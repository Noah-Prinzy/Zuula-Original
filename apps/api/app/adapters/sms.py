"""Africa's Talking SMS: phone verification, 2FA codes (FR-AUTH-05) and SMS broadcasts.

`AfricasTalkingSmsSender` calls the messaging REST API; the `sandbox` username goes to
Africa's Talking's sandbox host, where messages show up in their simulator instead of on a
phone. Without an API key the stub logs instead of sending. Messages are sent from the
worker (app/worker/messaging.py), not inside a request.
"""

import logging
from collections import deque
from typing import Protocol

import httpx

from app.adapters.readiness import configured
from app.core.config import get_adapters_settings

# What the stub "sent", newest last — lets local dev and tests read a verification code
# without a real SMS/email provider. Bounded, and only the stub writes to it.
OUTBOX: deque[dict] = deque(maxlen=200)

logger = logging.getLogger("zuula.adapters.sms")

LIVE_URL = "https://api.africastalking.com/version1/messaging"
SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging"
# Africa's Talking per-recipient statusCode: 100 Processed, 101 Sent, 102 Queued.
_ACCEPTED = {100, 101, 102}


class SmsError(Exception):
    pass


class SmsSender(Protocol):
    async def send(self, *, to: str, message: str) -> None: ...


class StubSmsSender:
    async def send(self, *, to: str, message: str) -> None:
        logger.info("SMS (stub, not sent): to=%s message=%r", to, message)
        OUTBOX.append({"to": to, "message": message})


class AfricasTalkingSmsSender:
    def __init__(self, *, username: str, api_key: str, timeout: float = 10.0):
        self._username = username
        self._api_key = api_key
        self._timeout = timeout
        self.url = SANDBOX_URL if username == "sandbox" else LIVE_URL

    async def send(self, *, to: str, message: str) -> None:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                self.url,
                headers={"apiKey": self._api_key, "Accept": "application/json"},
                data={"username": self._username, "to": to, "message": message},
            )
        if response.status_code >= 400:
            raise SmsError(f"Africa's Talking returned HTTP {response.status_code}.")
        recipients = response.json().get("SMSMessageData", {}).get("Recipients", [])
        # Never log the message itself: it may carry a one-time code.
        if not recipients:
            raise SmsError("Africa's Talking accepted no recipients.")
        for recipient in recipients:
            if recipient.get("statusCode") not in _ACCEPTED:
                raise SmsError(f"Africa's Talking rejected the message: {recipient.get('status')}.")


def get_sms_sender() -> SmsSender:
    if configured("sms"):
        settings = get_adapters_settings()
        return AfricasTalkingSmsSender(
            username=settings.africastalking_username, api_key=settings.africastalking_api_key
        )
    return StubSmsSender()
