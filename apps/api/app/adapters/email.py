"""Outbound email: verification and reset codes, 2FA codes and email broadcasts.

`SmtpEmailSender` sends through any SMTP server with `aiosmtplib` (STARTTLS on 587, implicit
TLS on 465). Without EMAIL_SMTP_HOST the stub logs instead of sending. Messages are sent
from the worker (app/worker/messaging.py), not inside a request.
"""

import logging
from collections import deque
from email.message import EmailMessage
from typing import Protocol

import aiosmtplib

from app.adapters.readiness import configured
from app.core.config import get_adapters_settings

# What the stub "sent", newest last — lets local dev and tests read a verification code
# without a real SMS/email provider. Bounded, and only the stub writes to it.
OUTBOX: deque[dict] = deque(maxlen=200)

logger = logging.getLogger("zuula.adapters.email")


class EmailSender(Protocol):
    async def send(self, *, to: str, subject: str, body: str) -> None: ...


class StubEmailSender:
    async def send(self, *, to: str, subject: str, body: str) -> None:
        logger.info("Email (stub, not sent): to=%s subject=%r body=%r", to, subject, body)
        OUTBOX.append({"to": to, "subject": subject, "body": body})


class SmtpEmailSender:
    def __init__(
        self,
        *,
        host: str,
        port: int,
        username: str,
        password: str,
        sender: str,
        timeout: float = 15.0,
    ):
        self._host = host
        self._port = port
        self._username = username or None
        self._password = password or None
        self._sender = sender
        self._timeout = timeout

    def build(self, *, to: str, subject: str, body: str) -> EmailMessage:
        message = EmailMessage()
        message["From"] = f"Zuula <{self._sender}>"
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        return message

    async def send(self, *, to: str, subject: str, body: str) -> None:
        await aiosmtplib.send(
            self.build(to=to, subject=subject, body=body),
            hostname=self._host,
            port=self._port,
            username=self._username,
            password=self._password,
            use_tls=self._port == 465,
            start_tls=self._port == 587,
            timeout=self._timeout,
        )


def get_email_sender() -> EmailSender:
    if configured("Email (SMTP)"):
        settings = get_adapters_settings()
        return SmtpEmailSender(
            host=settings.email_smtp_host,
            port=settings.email_smtp_port,
            username=settings.email_smtp_user,
            password=settings.email_smtp_password,
            sender=settings.email_from,
        )
    return StubEmailSender()
