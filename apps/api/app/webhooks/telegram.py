"""Inbound Telegram Bot webhook (FR-SUBMIT-04). Each message becomes a submission through
the same enqueue_submission() the website's POST /api/v1/submissions uses.
"""

from fastapi import Body

from app.adapters.telegram import get_telegram_adapter
from app.api.v1.submissions import enqueue_submission
from app.core.router import APIRouter

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/telegram", status_code=200)
def receive_telegram_message(payload: dict = Body(...)):  # noqa: B008
    adapter = get_telegram_adapter()
    message = adapter.parse_inbound(payload)
    if message is not None:
        accepted = enqueue_submission(
            sub_type="text", text=message.text, preview=message.text[:120]
        )
        adapter.send_reply(
            chat_id=message.chat_id,
            text=f"Got it — tracking id {accepted.tracking_id}. We'll message you the verdict.",
        )
    return {}
