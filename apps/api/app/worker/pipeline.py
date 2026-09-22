"""The real submit-flow pipeline (P2 Step 3). ClamAV scanning, storage and transcription are
stand-ins for real integrations (those adapters are Step 4's scope — this task's job is the
*shape* of the pipeline, not real external calls); the AI step goes through
app.providers.analysis.AnalysisProvider, P2's only real interface boundary here. Step
sequencing, timing and event shape match apps/web/lib/analysis.ts's PIPELINES/STEPS exactly,
so P3's frontend integration is a drop-in swap from the local mock simulation to this.
"""

import time
from datetime import UTC, datetime

from app.core.config import get_analysis_settings
from app.providers.analysis import get_analysis_provider
from app.realtime import redis_client
from app.realtime.submissions import (
    load_state,
    publish_done,
    publish_failed,
    publish_step,
    save_state,
)
from app.schemas.fact_check import CommunityRating, FactCheckReport, RatingCounts, dump_report
from app.stubs.scoring import community_score
from app.worker import celery_app

# Mirrors apps/web/lib/analysis.ts's PIPELINES map exactly.
PIPELINES: dict[str, list[str]] = {
    "text": ["received", "language", "claims", "sources", "ai", "report"],
    "url": ["received", "fetch", "language", "claims", "sources", "ai", "report"],
    "article": ["received", "language", "claims", "sources", "ai", "report"],
    "media": ["received", "scan", "media", "transcribe", "claims", "sources", "report"],
}

# Mirrors apps/web/lib/analysis.ts's STEPS[*].seconds exactly.
STEP_SECONDS: dict[str, float] = {
    "received": 0.6,
    "scan": 1.5,
    "fetch": 1.8,
    "transcribe": 2.5,
    "media": 3.0,
    "language": 0.8,
    "claims": 1.5,
    "sources": 2.5,
    "ai": 1.2,
    "report": 1.2,
}

# apps/web/lib/submission.ts's SubmissionType ("text"/"url"/"media"/"article", what the form
# bucketed the input as) isn't the same vocabulary as FactCheckReport.contentType
# ("text"/"url"/"image"/"audio"/"video", what the reviewed content actually *is* —
# app/schemas/common.py's ContentType). An article is textual content; a "media" upload's
# real kind needs actual file inspection, which is the S3/MIME-sniffing adapter's job
# (Step 4) — "image" is this stub's placeholder until then.
_REPORT_CONTENT_TYPE: dict[str, str] = {
    "text": "text",
    "url": "url",
    "article": "text",
    "media": "image",
}


def _empty_community() -> CommunityRating:
    accurate = RatingCounts(public=0, journalist=0, expert=0)
    inaccurate = RatingCounts(public=0, journalist=0, expert=0)
    return CommunityRating(
        accurate=accurate,
        inaccurate=inaccurate,
        comments=[],
        score=community_score(accurate, inaccurate),
    )


@celery_app.task(name="zuula.run_submission_pipeline")
def run_submission_pipeline(
    tracking_id: str,
    *,
    content_type: str,
    text: str,
    language: str,
    report_id: str,
    preview: str = "",
) -> None:
    """`content_type` here is the *submission* type (text/url/media/article — PIPELINES'
    keys, what decides the step sequence); see _REPORT_CONTENT_TYPE for why the finished
    FactCheckReport doesn't reuse it verbatim."""
    r = redis_client.get_redis()
    state = load_state(r, tracking_id)
    if state is None:
        return  # State expired (STATE_TTL_SECONDS) or was never written — nothing to do.

    state["status"] = "processing"
    save_state(r, tracking_id, state)

    scale = get_analysis_settings().pipeline_step_scale
    started = time.monotonic()

    # Mirrors the frontend's own demo failure path (submission-status.tsx): a URL submission
    # whose text contains "fail" can't be fetched, on the first attempt only. Submitting the
    # same tracking id's retry (a fresh POST in this stub — there's no resumable retry yet)
    # would get a fresh state and succeed, same as the frontend's `attempt` counter.
    fail_at = "fetch" if content_type == "url" and "fail" in preview.lower() else None

    for step in PIPELINES[content_type]:
        seconds = STEP_SECONDS[step]
        publish_step(r, tracking_id, {"step": step, "status": "active", "seconds": seconds})
        time.sleep(seconds * scale)

        if step == fail_at:
            state["status"] = "failed"
            # Matches openapi.yaml's ErrorEnvelope shape exactly ({"error": {code, message}})
            # since SubmissionStatusResponse.error embeds the whole envelope, not just its body.
            state["error"] = {
                "error": {"code": "invalid_content", "message": "Couldn't fetch that link."}
            }
            save_state(r, tracking_id, state)
            publish_failed(r, tracking_id, state)
            return

        publish_step(r, tracking_id, {"step": step, "status": "done", "seconds": seconds})
        state["steps"].append({"step": step, "status": "done", "seconds": seconds})
        save_state(r, tracking_id, state)

    report_content_type = _REPORT_CONTENT_TYPE[content_type]
    analysis = get_analysis_provider().analyze(
        content_type=report_content_type, text=text, language=language
    )
    now = datetime.now(UTC)
    report = FactCheckReport(
        id=report_id,
        tracking_id=tracking_id,
        title=analysis.title,
        content_type=report_content_type,
        language=language,
        submitted_text=text,
        verdict=analysis.verdict,
        confidence=analysis.confidence,
        summary=analysis.summary,
        what_is_false=analysis.what_is_false,
        what_is_true=analysis.what_is_true,
        claims=analysis.claims,
        citations=analysis.citations,
        ai_signals=analysis.ai_signals,
        annotations=[],
        community=_empty_community(),
        category=analysis.category,
        checked_at=now,
        processing_seconds=time.monotonic() - started,
    )

    state["status"] = "completed"
    state["completedAt"] = now.isoformat()
    state["result"] = dump_report(report)
    save_state(r, tracking_id, state)
    publish_done(r, tracking_id, state)
