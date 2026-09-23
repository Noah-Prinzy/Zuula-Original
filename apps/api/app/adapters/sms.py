"""Africa's Talking SMS — phone verification and 2FA codes (FR-AUTH-05). Interface + a stub
that logs instead of sending.
"""

import logging
from collections import deque
from typing import Protocol

# What the stub "sent", newest last — lets local dev and tests read a verification code
# without a real SMS/email provider. Bounded, and only the stub writes to it.
OUTBOX: deque[dict] = deque(maxlen=200)

logger = logging.getLogger("zuula.adapters.sms")


class SmsSender(Protocol):
    def send(self, *, to: str, message: str) -> None: ...


class StubSmsSender:
    def send(self, *, to: str, message: str) -> None:
        logger.info("SMS (stub, not sent): to=%s message=%r", to, message)
        OUTBOX.append({"to": to, "message": message})


def get_sms_sender() -> SmsSender:
    return StubSmsSender()
