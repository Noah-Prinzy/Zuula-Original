"""Inbound WhatsApp Cloud API webhook (FR-SUBMIT-04). GET is Meta's subscription handshake;
POST delivers messages, each of which becomes a submission through the same
enqueue_submission() the website's POST /api/v1/submissions uses.
"""

from fastapi import Body, Query
from fastapi.responses import PlainTextResponse

from app.adapters.whatsapp import get_whatsapp_adapter
from app.api.v1.submissions import enqueue_submission
from app.core.errors import ApiError
from app.core.router import APIRouter

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
def receive_whatsapp_message(payload: dict = Body(...)):  # noqa: B008
    adapter = get_whatsapp_adapter()
    for message in adapter.parse_inbound(payload):
        accepted = enqueue_submission(
            sub_type="text", text=message.text, preview=message.text[:120]
        )
        adapter.send_reply(
            to=message.sender,
            text=f"Got it — tracking id {accepted.tracking_id}. We'll text you the verdict.",
        )
    return {}
