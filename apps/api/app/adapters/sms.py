"""Africa's Talking SMS — phone verification and 2FA codes (FR-AUTH-05). Interface + a stub
that logs instead of sending.
"""

import logging
from typing import Protocol

logger = logging.getLogger("zuula.adapters.sms")


class SmsSender(Protocol):
    def send(self, *, to: str, message: str) -> None: ...


class StubSmsSender:
    def send(self, *, to: str, message: str) -> None:
        logger.info("SMS (stub, not sent): to=%s message=%r", to, message)


def get_sms_sender() -> SmsSender:
    return StubSmsSender()
