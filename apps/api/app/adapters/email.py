"""Outbound email (password reset today; P3/P4 add notification digests). Interface + a
stub that logs instead of sending — no SMTP call happens in P2.
"""

import logging
from typing import Protocol

logger = logging.getLogger("zuula.adapters.email")


class EmailSender(Protocol):
    def send(self, *, to: str, subject: str, body: str) -> None: ...


class StubEmailSender:
    def send(self, *, to: str, subject: str, body: str) -> None:
        logger.info("Email (stub, not sent): to=%s subject=%r body=%r", to, subject, body)


def get_email_sender() -> EmailSender:
    return StubEmailSender()
