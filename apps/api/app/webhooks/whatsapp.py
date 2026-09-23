"""Inbound WhatsApp Cloud API webhook (FR-SUBMIT-04). GET is Meta's subscription handshake;
POST delivers messages, each of which becomes a submission through the same
enqueue_submission() the website's POST /api/v1/submissions uses. The verdict goes back to
the sender when the pipeline finishes (app/worker/pipeline.py).
"""

from fastapi import Body, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.whatsapp import get_whatsapp_adapter
from app.api.v1.submissions import enqueue_submission
from app.core.errors import ApiError
from app.core.router import APIRouter
from app.db.session import get_db
from app.services.submissions import chat_fields

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.get("/whatsapp")
def verify_whatsapp_webhook(
    hub_mode: str = Query("", alias="hub.mode"),
    hub_verify_token: str = Query("", alias="hub.verify_token"),
    hub_challenge: str = Query("", alias="hub.challenge"),
):
    challenge = get_whatsapp_adapter().verify_webhook(
        mode=hub_mode, token=hub_verify_token, challenge=hub_challenge
    )
    if challenge is None:
        raise ApiError("forbidden", "Webhook verification failed.")
    return PlainTextResponse(challenge)


@router.post("/whatsapp", status_code=200)
async def receive_whatsapp_message(
    payload: dict = Body(...),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    adapter = get_whatsapp_adapter()
    for message in adapter.parse_inbound(payload):
        submission = await enqueue_submission(
            db, fields=chat_fields(message.text), channel="whatsapp", channel_ref=message.sender
        )
        adapter.send_reply(
            to=message.sender,
            text=f"Got it — tracking id {submission.tracking_id}. We'll text you the verdict.",
        )
    return {}
