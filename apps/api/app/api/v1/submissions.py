import asyncio
import json

from fastapi import Body, Header
from fastapi.responses import StreamingResponse

from app.core.errors import ApiError
from app.core.router import APIRouter
from app.schemas.submission import SubmissionAccepted, SubmissionStatusResponse, SubmissionStepEvent
from app.stubs.fact_checks import SAMPLE_REPORTS, get_report_by_tracking_id

router = APIRouter(prefix="/submissions", tags=["submissions"])

# P2 stub pipeline — matches apps/web/lib/analysis.ts's step ids/labels/seconds, text pipeline.
_TEXT_PIPELINE = [
    {"step": "received", "seconds": 0.6},
    {"step": "language", "seconds": 0.8},
    {"step": "claims", "seconds": 1.5},
    {"step": "sources", "seconds": 2.5},
    {"step": "ai", "seconds": 1.2},
    {"step": "report", "seconds": 1.2},
]


def _done_steps() -> list[SubmissionStepEvent]:
    return [
        SubmissionStepEvent(step=s["step"], status="done", seconds=s["seconds"])
        for s in _TEXT_PIPELINE
    ]


@router.post("", response_model=SubmissionAccepted, status_code=202)
def create_submission(
    body: dict = Body(...),  # noqa: B008 — stub accepts any shape; P3 validates against SubmissionInput
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    # Every submission "resolves" to the same demo report in P2 — there's no real pipeline yet.
    sample = SAMPLE_REPORTS[0]
    return SubmissionAccepted(
        tracking_id=sample.tracking_id,
        status="queued",
        estimated_seconds=10,
        status_url=f"/api/v1/submissions/{sample.tracking_id}",
    )


def _dump_status(resp: SubmissionStatusResponse) -> dict:
    """Same exclude_none/humanReview treatment as dump_report(), applied to the wrapper —
    exclude_none already recurses into the embedded FactCheckReport."""
    data = resp.model_dump(by_alias=True, mode="json", exclude_none=True)
    if "result" in data:
        data["result"].setdefault("humanReview", None)
    return data


@router.get("/{tracking_id}", response_model=None)
def get_submission_status(tracking_id: str):
    report = get_report_by_tracking_id(tracking_id)
    if report is None:
        raise ApiError("not_found", f"No submission with tracking id '{tracking_id}'.")
    return _dump_status(
        SubmissionStatusResponse(
            tracking_id=tracking_id,
            status="completed",
            submitted_at=report.checked_at,
            completed_at=report.checked_at,
            steps=_done_steps(),
            result=report,
        )
    )


@router.get("/{tracking_id}/events")
async def stream_submission_events(tracking_id: str):
    report = get_report_by_tracking_id(tracking_id)
    if report is None:
        raise ApiError("not_found", f"No submission with tracking id '{tracking_id}'.")

    async def gen():
        for s in _TEXT_PIPELINE:
            frame = SubmissionStepEvent(step=s["step"], status="active", seconds=s["seconds"])
            yield f"event: step\ndata: {frame.model_dump_json(by_alias=True)}\n\n"
            await asyncio.sleep(0)  # stub: no real delay
            frame = SubmissionStepEvent(step=s["step"], status="done", seconds=s["seconds"])
            yield f"event: step\ndata: {frame.model_dump_json(by_alias=True)}\n\n"

        final = SubmissionStatusResponse(
            tracking_id=tracking_id,
            status="completed",
            submitted_at=report.checked_at,
            completed_at=report.checked_at,
            steps=_done_steps(),
            result=report,
        )
        yield f"event: done\ndata: {json.dumps(_dump_status(final))}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")
