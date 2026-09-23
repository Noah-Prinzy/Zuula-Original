"""Inbound WhatsApp Cloud API webhook (FR-SUBMIT-04). GET is Meta's subscription handshake;
POST delivers messages, each of which becomes a submission through the same
enqueue_submission() the website's POST /api/v1/submissions uses. The verdict goes back to
the sender when the pipeline finishes (app/worker/pipeline.py).
"""

import json
import logging

from fastapi import Depends, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.whatsapp import get_whatsapp_adapter
from app.api.v1.submissions import enqueue_submission
from app.core.errors import ApiError
from app.core.router import APIRouter
from app.db.session import get_db
from app.services.submissions import chat_fields

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger("zuula.webhooks.whatsapp")


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
    request: Request,
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    adapter = get_whatsapp_adapter()
    # The signature covers the exact bytes Meta sent, so check it before parsing.
    body = await request.body()
    if not adapter.verify_signature(body, request.headers.get("X-Hub-Signature-256")):
        raise ApiError("forbidden", "Invalid webhook signature.")
    try:
        payload = json.loads(body)
    except ValueError as exc:
        raise ApiError("invalid_content", "The body must be JSON.") from exc
    for message in adapter.parse_inbound(payload if isinstance(payload, dict) else {}):
        submission = await enqueue_submission(
            db, fields=chat_fields(message.text), channel="whatsapp", channel_ref=message.sender
        )
        try:
            await adapter.send_reply(
                to=message.sender,
                text=f"Got it — tracking id {submission.tracking_id}. We'll text you the verdict.",
            )
        except Exception:  # noqa: BLE001 — the submission is in; a failed "got it" isn't fatal
            # An error here would make Meta redeliver the message and submit it twice.
            logger.warning("WhatsApp acknowledgement failed", exc_info=True)
    return {}
