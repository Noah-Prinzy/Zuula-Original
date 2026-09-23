"""Inbound Telegram Bot webhook (FR-SUBMIT-04). Each message becomes a submission through
the same enqueue_submission() the website's POST /api/v1/submissions uses, and the verdict
is sent back to the same chat when the pipeline finishes (app/worker/pipeline.py).
"""

from fastapi import Body, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.telegram import get_telegram_adapter
from app.api.v1.submissions import enqueue_submission
from app.core.router import APIRouter
from app.db.session import get_db
from app.services.submissions import chat_fields

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/telegram", status_code=200)
async def receive_telegram_message(
    payload: dict = Body(...),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    adapter = get_telegram_adapter()
    message = adapter.parse_inbound(payload)
    if message is not None:
        submission = await enqueue_submission(
            db, fields=chat_fields(message.text), channel="telegram", channel_ref=message.chat_id
        )
        adapter.send_reply(
            chat_id=message.chat_id,
            text=f"Got it — tracking id {submission.tracking_id}. We'll message you the verdict.",
        )
    return {}
