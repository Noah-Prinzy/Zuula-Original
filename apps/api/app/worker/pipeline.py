"""The submission pipeline, persisted in PostgreSQL (P3; ADR 0002 §6). Step sequencing,
timing and event shape still match apps/web/lib/analysis.ts's PIPELINES/STEPS exactly.

`run_pipeline(db, tracking_id)` is the whole pipeline as one async function over a database
session: it reads the committed `submissions` row, runs each step (publishing live progress
over Redis for the SSE endpoint), and on success writes the `fact_check_reports` row, opens a
low-confidence review case if needed, and tells the submitter. The Celery task
`run_submission_pipeline` is a thin wrapper running it on the worker's own connection.

ClamAV, storage and transcription are still adapter stand-ins until P3 PR 5 (real adapters,
multipart uploads); the AI step goes through app.providers.analysis.AnalysisProvider (P4).
"""

import asyncio
import time
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.adapters.clamav import get_clamav_scanner
from app.adapters.storage import get_object_storage
from app.adapters.telegram import get_telegram_adapter
from app.adapters.whatsapp import get_whatsapp_adapter
from app.core import rules
from app.core.config import get_analysis_settings, get_database_settings
from app.db.ids import next_report_id
from app.db.models import FactCheckReport, Submission
from app.providers.analysis import get_analysis_provider
from app.realtime import redis_client
from app.realtime.submissions import publish_done, publish_failed, publish_step
from app.services import escalation, notifications
from app.services.pipeline_steps import PIPELINES, STEP_SECONDS
from app.services.platform_settings import get_platform_settings
from app.services.submissions import status_of
from app.worker import celery_app

__all__ = ["PIPELINES", "STEP_SECONDS", "run_pipeline", "run_submission_pipeline"]

# apps/web/lib/submission.ts's SubmissionType ("text"/"url"/"media"/"article", what the form
# bucketed the input as) isn't the same vocabulary as FactCheckReport.contentType
# ("text"/"url"/"image"/"audio"/"video", what the content actually *is*). An article is
# text; a media upload's real kind needs file inspection (P3 PR 5's upload handling) —
# "image" is the placeholder until then.
_REPORT_CONTENT_TYPE: dict[str, str] = {
    "text": "text",
    "url": "url",
    "article": "text",
    "media": "image",
}


def _analysis_text(s: Submission) -> str:
    if s.type == "url":
        return s.url or ""
    return s.content or ""


async def run_pipeline(db: AsyncSession, tracking_id: str) -> None:
    s = await db.get(Submission, tracking_id)
    if s is None or s.status != "queued":
        return  # unknown, or already picked up (a redelivered Celery message)
    r = redis_client.get_redis()
    s.status = "processing"
    await db.commit()

    scale = get_analysis_settings().pipeline_step_scale
    started = time.monotonic()
    # The frontend's own demo failure path (submission-status.tsx): a URL containing "fail"
    # can't be fetched. Real fetch failures replace this in P3 PR 5.
    fail_at = "fetch" if s.type == "url" and "fail" in (s.url or "").lower() else None

    for step in PIPELINES[s.type]:
        seconds = STEP_SECONDS[step]
        publish_step(r, tracking_id, {"step": step, "status": "active", "seconds": seconds})
        await asyncio.sleep(seconds * scale)

        # No multipart upload yet (P3 PR 5): these exercise the adapter interfaces the real
        # upload flow will call with the actual file bytes.
        if step == "scan":
            get_clamav_scanner().scan(b"")
        elif step == "media":
            get_object_storage().put(
                key=f"{tracking_id}/media", data=b"", content_type="application/octet-stream"
            )

        if step == fail_at:
            s.status = "failed"
            s.completed_at = datetime.now(UTC)
            # SubmissionStatusResponse.error embeds the whole ErrorEnvelope.
            s.error = {"error": {"code": "invalid_content", "message": "Couldn't fetch that link."}}
            await db.commit()
            publish_failed(r, tracking_id, await status_of(db, s))
            await _reply_on_channel(s, "We couldn't check that link. Please try again.")
            return

        # Reassign rather than append: JSONB mutation isn't tracked in place.
        s.steps = [*s.steps, {"step": step, "status": "done", "seconds": seconds}]
        await db.commit()
        publish_step(r, tracking_id, {"step": step, "status": "done", "seconds": seconds})

    report_content_type = _REPORT_CONTENT_TYPE[s.type]
    text = _analysis_text(s)
    analysis = get_analysis_provider().analyze(
        content_type=report_content_type, text=text, language=s.language
    )
    now = datetime.now(UTC)
    report = FactCheckReport(
        id=await next_report_id(db, now=now),
        tracking_id=tracking_id,
        title=analysis.title,
        content_type=report_content_type,
        language=s.language,
        submitted_text=text,
        source_url=s.url or s.article_url,
        verdict=analysis.verdict,
        confidence=analysis.confidence,
        summary=analysis.summary,
        what_is_false=analysis.what_is_false,
        what_is_true=analysis.what_is_true,
        claims=[
            c.model_dump(by_alias=True, mode="json", exclude_none=True) for c in analysis.claims
        ],
        citations=[
            c.model_dump(by_alias=True, mode="json", exclude_none=True) for c in analysis.citations
        ],
        ai_signals=[
            a.model_dump(by_alias=True, mode="json", exclude_none=True) for a in analysis.ai_signals
        ],
        category=analysis.category,
        checked_at=now,
        processing_seconds=round(time.monotonic() - started, 2),
        community_status="standard",
    )
    db.add(report)
    s.status = "completed"
    s.completed_at = now
    await db.flush()

    if report.confidence < rules.LOW_CONFIDENCE_THRESHOLD:
        await escalation.open_case(db, report, "low-confidence", await get_platform_settings(db))
    if s.user_id:
        notifications.notify(
            db,
            user_id=s.user_id,
            kind="verdict-ready",
            title="Your submission was checked",
            body=f"{report.title} — {notifications.VERDICT_LABELS[report.verdict]}.",
            href=f"/fact-checks/{report.id}",
        )
    await db.commit()

    publish_done(r, tracking_id, await status_of(db, s))
    await _reply_on_channel(
        s,
        f"Zuula verdict: {notifications.VERDICT_LABELS[report.verdict]}. {report.summary} "
        f"Full report: https://zuula.ug/fact-checks/{report.id}",
    )


async def _reply_on_channel(s: Submission, text: str) -> None:
    """FR-SUBMIT-04: a chat submission gets its answer back in the same chat."""
    if not s.channel_ref:
        return
    if s.channel == "whatsapp":
        get_whatsapp_adapter().send_reply(to=s.channel_ref, text=text)
    elif s.channel == "telegram":
        get_telegram_adapter().send_reply(chat_id=s.channel_ref, text=text)


async def _run_in_worker(tracking_id: str) -> None:
    engine = create_async_engine(get_database_settings().database_url, poolclass=NullPool)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as db:
            await run_pipeline(db, tracking_id)
    finally:
        await engine.dispose()


@celery_app.task(name="zuula.run_submission_pipeline")
def run_submission_pipeline(tracking_id: str) -> None:
    # One event loop and one connection per submission: the worker is a plain process, and
    # asyncpg connections belong to the loop that opened them.
    asyncio.run(_run_in_worker(tracking_id))
