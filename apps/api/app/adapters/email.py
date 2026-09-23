"""Outbound email (password reset today; P3/P4 add notification digests). Interface + a
stub that logs instead of sending — no SMTP call happens in P2.
"""

import logging
from collections import deque
from typing import Protocol

# What the stub "sent", newest last — lets local dev and tests read a verification code
# without a real SMS/email provider. Bounded, and only the stub writes to it.
OUTBOX: deque[dict] = deque(maxlen=200)

logger = logging.getLogger("zuula.adapters.email")


class EmailSender(Protocol):
    def send(self, *, to: str, subject: str, body: str) -> None: ...


class StubEmailSender:
    def send(self, *, to: str, subject: str, body: str) -> None:
        logger.info("Email (stub, not sent): to=%s subject=%r body=%r", to, subject, body)
        OUTBOX.append({"to": to, "subject": subject, "body": body})


def get_email_sender() -> EmailSender:
    return StubEmailSender()
