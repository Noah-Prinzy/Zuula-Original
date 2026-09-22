import asyncio
import json
import secrets

from fastapi import Body, Header
from fastapi.responses import StreamingResponse

from app.core.errors import ApiError
from app.core.router import APIRouter
from app.realtime import redis_client
from app.realtime.submissions import load_state, new_state, save_state, subscribe
from app.schemas.submission import SubmissionAccepted
from app.worker.pipeline import PIPELINES, STEP_SECONDS, run_submission_pipeline

router = APIRouter(prefix="/submissions", tags=["submissions"])

_VALID_TYPES = set(PIPELINES)
# Excludes 0/1 (and nothing else) — matches openapi.yaml's TrackingId pattern
# ^ZL-[A-Z2-9]{4}-[A-Z2-9]{2}$ exactly.
_TRACKING_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789"


def _generate_tracking_id() -> str:
    part1 = "".join(secrets.choice(_TRACKING_ALPHABET) for _ in range(4))
    part2 = "".join(secrets.choice(_TRACKING_ALPHABET) for _ in range(2))
    return f"ZL-{part1}-{part2}"


def _content_and_preview(body: dict, sub_type: str) -> tuple[str, str]:
    """(text handed to the AnalysisProvider, short preview shown on the Status page) — mirrors
    apps/web/lib/mock/submissions.ts's StoredSubmission.preview per type."""
    if sub_type == "text":
        text = body.get("content", "")
        return text, text[:120]
    if sub_type == "url":
        url = body.get("url", "")
        return url, url
    if sub_type == "article":
        content = body.get("content", "")
        preview = body.get("headline") or content[:120]
        return content, preview
    # media: no real file storage yet (the S3 adapter is Step 4) — nothing to analyze from
    # text, so the stub AnalysisProvider gets an empty string and picks a sample by that.
    return "", body.get("headline") or "Media upload"


@router.post("", response_model=SubmissionAccepted, status_code=202)
def create_submission(
    body: dict = Body(...),  # noqa: B008 — stub accepts any shape; P3 validates against SubmissionInput
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    sub_type = body.get("type")
    if sub_type not in _VALID_TYPES:
        raise ApiError("bad_request", f"type must be one of {sorted(_VALID_TYPES)}.")

    text, preview = _content_and_preview(body, sub_type)
    language = body.get("language") or "auto"
    tracking_id = _generate_tracking_id()
    report_id = f"fc-new-{tracking_id.replace('-', '').lower()}"

    r = redis_client.get_redis()
    save_state(r, tracking_id, new_state(tracking_id, content_type=sub_type, language=language))

    run_submission_pipeline.delay(
        tracking_id,
        content_type=sub_type,
        text=text,
        language=language,
        report_id=report_id,
        preview=preview,
    )

    estimated = round(sum(STEP_SECONDS[s] for s in PIPELINES[sub_type]))
    return SubmissionAccepted(
        tracking_id=tracking_id,
        status="queued",
        estimated_seconds=estimated,
        status_url=f"/api/v1/submissions/{tracking_id}",
    )


def _status_response(state: dict) -> dict:
    data = {
        "trackingId": state["trackingId"],
        "status": state["status"],
        "submittedAt": state["submittedAt"],
        "steps": state["steps"],
    }
    if state.get("completedAt"):
        data["completedAt"] = state["completedAt"]
    if state.get("result"):
        data["result"] = state["result"]
    if state.get("error"):
        data["error"] = state["error"]
    return data


@router.get("/{tracking_id}", response_model=None)
def get_submission_status(tracking_id: str):
    state = load_state(redis_client.get_redis(), tracking_id)
    if state is None:
        raise ApiError("not_found", f"No submission with tracking id '{tracking_id}'.")
    return _status_response(state)


@router.get("/{tracking_id}/events")
async def stream_submission_events(tracking_id: str):
    state = await asyncio.to_thread(load_state, redis_client.get_redis(), tracking_id)
    if state is None:
        raise ApiError("not_found", f"No submission with tracking id '{tracking_id}'.")

    async def gen():
        for step in state["steps"]:
            yield f"event: step\ndata: {json.dumps(step)}\n\n"

        if state["status"] in ("completed", "failed"):
            event_name = "done" if state["status"] == "completed" else "failed"
            yield f"event: {event_name}\ndata: {json.dumps(_status_response(state))}\n\n"
            return

        # Small race window: a step could complete between the load above and this
        # subscribe() below and be missed here — acceptable for a P2 stub demo (the final
        # done/failed event and GET .../{trackingId} both always reflect the true end state).
        # Redis Streams (replay-from-offset) would close this gap; P3 can revisit if it matters.
        seen = {s["step"] for s in state["steps"]}
        async for message in subscribe(redis_client.get_async_redis(), tracking_id):
            if message["type"] == "step":
                step = message["step"]
                if step["status"] == "done":
                    if step["step"] in seen:
                        continue
                    seen.add(step["step"])
                yield f"event: step\ndata: {json.dumps(step)}\n\n"
            elif message["type"] in ("done", "failed"):
                payload = json.dumps(_status_response(message["state"]))
                yield f"event: {message['type']}\ndata: {payload}\n\n"
                return

    return StreamingResponse(gen(), media_type="text/event-stream")
