"""Submit something for checking, and follow it (FR-SUBMIT-01…07, FR-DETECT-07). The
submission is a `submissions` row from the moment it's accepted (ADR 0002 §6); the pipeline
runs in the Celery worker and streams progress over Redis."""

import asyncio
import json

from fastapi import Depends, Header, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.turnstile import get_turnstile_verifier
from app.core.errors import ApiError
from app.core.router import APIRouter
from app.core.security import get_current_user
from app.db.models import Submission
from app.db.session import get_db
from app.realtime import redis_client
from app.realtime.submissions import subscribe
from app.schemas.account import UserProfile
from app.schemas.submission import SubmissionAccepted
from app.services import submissions as svc
from app.worker import dispatch

router = APIRouter(prefix="/submissions", tags=["submissions"])


async def enqueue_submission(
    db: AsyncSession,
    *,
    fields: dict,
    channel: str,
    user_id: str | None = None,
    api_key_id: str | None = None,
    channel_ref: str | None = None,
    idempotency_key: str | None = None,
) -> Submission:
    """Shared by the HTTP routes and app/webhooks/ (FR-SUBMIT-04: a chat message becomes a
    submission exactly the way a website POST does). Commits, then dispatches — the worker
    must be able to see the row."""
    submission, created = await svc.create_submission(
        db,
        fields=fields,
        channel=channel,
        user_id=user_id,
        api_key_id=api_key_id,
        channel_ref=channel_ref,
        idempotency_key=idempotency_key,
    )
    await db.commit()
    if created:
        await dispatch.dispatch_pipeline(submission.tracking_id)
    return submission


@router.post("", response_model=SubmissionAccepted, status_code=202)
async def create_submission(
    request: Request,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    user: UserProfile | None = Depends(get_current_user),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    # SubmissionInput, as JSON or multipart (a media file); validated by svc.validate_input.
    body, upload = await svc.read_input(request)
    fields = svc.validate_input(body)
    # FR-AUTH-07: anonymous submissions need a Turnstile token; signed-in ones don't.
    if user is None and not await get_turnstile_verifier().verify(
        body.get("captchaToken"), remote_ip=request.client.host if request.client else None
    ):
        raise ApiError("bad_request", "Complete the captcha to submit while signed out.")
    if fields["type"] == "media":
        fields |= await svc.store_upload(upload)

    submission = await enqueue_submission(
        db,
        fields=fields,
        channel="web",
        user_id=user.id if user else None,
        idempotency_key=idempotency_key,
    )
    return svc.accepted(submission, status_url=f"/api/v1/submissions/{submission.tracking_id}")


async def _get(db: AsyncSession, tracking_id: str) -> Submission:
    submission = await db.get(Submission, tracking_id)
    if submission is None:
        raise ApiError("not_found", f"No submission with tracking id '{tracking_id}'.")
    return submission


@router.get("/{tracking_id}", response_model=None)
async def get_submission_status(tracking_id: str, db: AsyncSession = Depends(get_db)):  # noqa: B008
    return await svc.status_of(db, await _get(db, tracking_id))


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.get("/{tracking_id}/events")
async def stream_submission_events(
    tracking_id: str,
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    submission = await _get(db, tracking_id)
    state = await svc.status_of(db, submission)

    async def gen():
        for step in state["steps"]:
            yield _sse("step", step)
        if state["status"] in ("completed", "failed"):
            yield _sse("done" if state["status"] == "completed" else "failed", state)
            return

        # A step that completes between the read above and the subscribe below could be missed
        # by this one connection (ADR 0001's accepted gap); the final done/failed event and a
        # GET of the status always carry the full, true state.
        seen = {s["step"] for s in state["steps"]}
        async for message in subscribe(redis_client.get_async_redis(), tracking_id):
            if message["type"] == "step":
                step = message["step"]
                if step["status"] == "done":
                    if step["step"] in seen:
                        continue
                    seen.add(step["step"])
                yield _sse("step", step)
            elif message["type"] in ("done", "failed"):
                yield _sse(message["type"], message["state"])
                return
            await asyncio.sleep(0)

    return StreamingResponse(gen(), media_type="text/event-stream")
