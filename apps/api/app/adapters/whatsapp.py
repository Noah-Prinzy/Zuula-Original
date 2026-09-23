"""WhatsApp Cloud API (FR-SUBMIT-04): inbound messages create submissions, via
app/webhooks/whatsapp.py, and the verdict is sent back to the sender.

Inbound: Meta's subscription handshake, the `X-Hub-Signature-256` check (an HMAC-SHA256 of
the raw body with the app secret), and parsing the webhook payload. Outbound:
`CloudWhatsAppAdapter` posts to the Graph API's `/{phone_number_id}/messages`. Without an
access token and phone number id the stub logs replies instead of sending them.
"""

import hashlib
import hmac
import logging
from dataclasses import dataclass
from typing import Protocol

import httpx

from app.adapters.oauth import FACEBOOK_GRAPH_VERSION
from app.core.config import get_adapters_settings

logger = logging.getLogger("zuula.adapters.whatsapp")


class WhatsAppError(Exception):
    pass


@dataclass
class InboundMessage:
    sender: str
    text: str


class WhatsAppAdapter(Protocol):
    def verify_webhook(self, *, mode: str, token: str, challenge: str) -> str | None:
        """Meta's subscription handshake: return `challenge` if `token` matches the
        configured verify token and `mode == "subscribe"`, else None (caller 403s)."""
        ...

    def verify_signature(self, body: bytes, header: str | None) -> bool: ...

    def parse_inbound(self, payload: dict) -> list[InboundMessage]: ...

    async def send_reply(self, *, to: str, text: str) -> None: ...


class StubWhatsAppAdapter:
    def __init__(self, verify_token: str, app_secret: str = ""):
        self._verify_token = verify_token
        self._app_secret = app_secret

    def verify_webhook(self, *, mode: str, token: str, challenge: str) -> str | None:
        # An empty verify token would accept an empty `hub.verify_token`.
        if self._verify_token and mode == "subscribe" and token == self._verify_token:
            return challenge
        return None

    def verify_signature(self, body: bytes, header: str | None) -> bool:
        """`X-Hub-Signature-256: sha256=<hex HMAC of the raw body>`. Without an app secret
        (local dev only; production requires one) there's nothing to check against."""
        if not self._app_secret:
            return True
        expected = hmac.new(self._app_secret.encode(), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(header or "", f"sha256={expected}")

    def parse_inbound(self, payload: dict) -> list[InboundMessage]:
        # The Cloud API's webhook payload shape: entry[].changes[].value.messages[], each
        # {"from": <sender>, "text": {"body": <text>}}. Other message types (images, voice
        # notes) aren't submissions yet.
        messages = []
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                for msg in change.get("value", {}).get("messages", []):
                    text = (msg.get("text") or {}).get("body", "")
                    sender = msg.get("from", "")
                    if text and sender:
                        messages.append(InboundMessage(sender=sender, text=text))
        return messages

    async def send_reply(self, *, to: str, text: str) -> None:
        logger.info("WhatsApp reply (stub, not sent): to=%s text=%r", to, text)


class CloudWhatsAppAdapter(StubWhatsAppAdapter):
    def __init__(
        self,
        *,
        verify_token: str,
        app_secret: str,
        access_token: str,
        phone_number_id: str,
        timeout: float = 10.0,
    ):
        super().__init__(verify_token, app_secret)
        self._access_token = access_token
        self._timeout = timeout
        self.url = f"https://graph.facebook.com/{FACEBOOK_GRAPH_VERSION}/{phone_number_id}/messages"

    async def send_reply(self, *, to: str, text: str) -> None:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                self.url,
                headers={"Authorization": f"Bearer {self._access_token}"},
                json={
                    "messaging_product": "whatsapp",
                    "to": to,
                    "type": "text",
                    "text": {"body": text},
                },
            )
        if response.status_code >= 400:
            raise WhatsAppError(f"WhatsApp send failed with HTTP {response.status_code}.")


def get_whatsapp_adapter() -> WhatsAppAdapter:
    settings = get_adapters_settings()
    if settings.whatsapp_access_token and settings.whatsapp_phone_number_id:
        return CloudWhatsAppAdapter(
            verify_token=settings.whatsapp_verify_token,
            app_secret=settings.whatsapp_app_secret,
            access_token=settings.whatsapp_access_token,
            phone_number_id=settings.whatsapp_phone_number_id,
        )
    return StubWhatsAppAdapter(settings.whatsapp_verify_token, settings.whatsapp_app_secret)
