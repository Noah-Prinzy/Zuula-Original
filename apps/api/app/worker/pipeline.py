"""The submission pipeline, persisted in PostgreSQL (P3; ADR 0002 §6). Step sequencing,
timing and event shape still match apps/web/lib/analysis.ts's PIPELINES/STEPS exactly.

`run_pipeline(db, tracking_id)` is the whole pipeline as one async function over a database
session: it reads the committed `submissions` row, runs each step (publishing live progress
over Redis for the SSE endpoint), and on success writes the `fact_check_reports` row, opens a
low-confidence review case if needed, and tells the submitter. The Celery task
`run_submission_pipeline` is a thin wrapper running it on the worker's own connection.

A media upload is read back from object storage and scanned by ClamAV in the "scan" step;
transcription and the AI step go through app.providers.analysis.AnalysisProvider (P4).
"""

import asyncio
import logging
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

logger = logging.getLogger("zuula.worker.pipeline")

__all__ = ["PIPELINES", "STEP_SECONDS", "run_pipeline", "run_submission_pipeline"]

# apps/web/lib/submission.ts's SubmissionType ("text"/"url"/"media"/"article", what the form
# bucketed the input as) isn't the same vocabulary as FactCheckReport.contentType
# ("text"/"url"/"image"/"audio"/"video", what the content actually *is*). An article is
# text; a media upload's kind comes from its (already validated) content type.
_REPORT_CONTENT_TYPE: dict[str, str] = {"text": "text", "url": "url", "article": "text"}


def _report_content_type(s: Submission) -> str:
    if s.type == "media":
        kind = (s.media_content_type or "").partition("/")[0]
        return kind if kind in ("image", "audio", "video") else "image"
    return _REPORT_CONTENT_TYPE[s.type]


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

        failure = None
        if step == "scan" and s.media_object_key:
            failure = await _scan_upload(s)
        elif step == fail_at:
            failure = ("invalid_content", "Couldn't fetch that link.")

        if failure is not None:
            code, message = failure
            s.status = "failed"
            s.completed_at = datetime.now(UTC)
            # SubmissionStatusResponse.error embeds the whole ErrorEnvelope.
            s.error = {"error": {"code": code, "message": message}}
            await db.commit()
            publish_failed(r, tracking_id, await status_of(db, s))
            await _reply_on_channel(s, f"We couldn't check that. {message}")
            return

        # Reassign rather than append: JSONB mutation isn't tracked in place.
        s.steps = [*s.steps, {"step": step, "status": "done", "seconds": seconds}]
        await db.commit()
        publish_step(r, tracking_id, {"step": step, "status": "done", "seconds": seconds})

    report_content_type = _report_content_type(s)
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


async def _scan_upload(s: Submission) -> tuple[str, str] | None:
    """The "scan" step: ClamAV over the uploaded bytes. Fails closed — a file that can't be
    scanned isn't analysed. An infected file is deleted straight away."""
    storage = get_object_storage()
    try:
        data = await storage.get(key=s.media_object_key)
        result = await get_clamav_scanner().scan(data)
    except Exception:  # noqa: BLE001 — storage or scanner down: fail closed
        logger.exception("Malware scan failed for %s", s.tracking_id)
        return ("server_error", "We couldn't scan that file for malware. Please try again.")
    if result.clean:
        return None
    logger.warning("Upload %s failed the malware scan: %s", s.tracking_id, result.signature)
    await storage.delete(key=s.media_object_key)
    s.media_object_key = None
    return ("invalid_content", "That file failed our malware scan, so we didn't check it.")


async def _reply_on_channel(s: Submission, text: str) -> None:
    """FR-SUBMIT-04: a chat submission gets its answer back in the same chat. Best effort:
    the verdict is already saved, so a failed reply is logged, not retried."""
    if not s.channel_ref:
        return
    try:
        if s.channel == "whatsapp":
            await get_whatsapp_adapter().send_reply(to=s.channel_ref, text=text)
        elif s.channel == "telegram":
            await get_telegram_adapter().send_reply(chat_id=s.channel_ref, text=text)
    except Exception:  # noqa: BLE001
        logger.warning("Couldn't send the verdict back on %s", s.channel, exc_info=True)


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
