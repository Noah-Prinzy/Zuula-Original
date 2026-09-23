"""SMS and email delivery, off the request path (ADR 0002 §7). A slow or failing provider
delays one message instead of a sign-in request, and Celery retries it with backoff."""

import asyncio

from app.adapters.email import get_email_sender
from app.adapters.sms import get_sms_sender
from app.worker import celery_app


async def deliver_message(channel: str, to: str, body: str, subject: str | None = None) -> None:
    if channel == "sms":
        await get_sms_sender().send(to=to, message=body)
    elif channel == "email":
        await get_email_sender().send(to=to, subject=subject or "Zuula", body=body)
    else:
        raise ValueError(f"Unknown message channel '{channel}'.")


@celery_app.task(
    name="zuula.send_message",
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=4,
)
def send_message(channel: str, to: str, body: str, subject: str | None = None) -> None:
    asyncio.run(deliver_message(channel, to, body, subject))
