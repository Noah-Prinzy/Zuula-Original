"""WhatsApp Cloud API (FR-SUBMIT-04): inbound messages create submissions, via
app/webhooks/whatsapp.py. Interface covers Meta's webhook verification handshake, parsing
the inbound payload shape, and a stub reply sender — no call to the Graph API happens in P2.
"""

import logging
from dataclasses import dataclass
from typing import Protocol

logger = logging.getLogger("zuula.adapters.whatsapp")


@dataclass
class InboundMessage:
    sender: str
    text: str


class WhatsAppAdapter(Protocol):
    def verify_webhook(self, *, mode: str, token: str, challenge: str) -> str | None:
        """Meta's subscription handshake: return `challenge` if `token` matches the
        configured verify token and `mode == "subscribe"`, else None (caller 403s)."""
        ...

    def parse_inbound(self, payload: dict) -> list[InboundMessage]: ...

    def send_reply(self, *, to: str, text: str) -> None: ...


class StubWhatsAppAdapter:
    def __init__(self, verify_token: str):
        self._verify_token = verify_token

    def verify_webhook(self, *, mode: str, token: str, challenge: str) -> str | None:
        if mode == "subscribe" and token == self._verify_token:
            return challenge
        return None

    def parse_inbound(self, payload: dict) -> list[InboundMessage]:
        # Matches the Cloud API's webhook payload shape: entry[].changes[].value.messages[],
        # each {"from": <sender>, "text": {"body": <text>}}.
        messages = []
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                for msg in change.get("value", {}).get("messages", []):
                    text = (msg.get("text") or {}).get("body", "")
                    sender = msg.get("from", "")
                    if text and sender:
                        messages.append(InboundMessage(sender=sender, text=text))
        return messages

    def send_reply(self, *, to: str, text: str) -> None:
        logger.info("WhatsApp reply (stub, not sent): to=%s text=%r", to, text)


def get_whatsapp_adapter() -> WhatsAppAdapter:
    from app.core.config import get_adapters_settings

    return StubWhatsAppAdapter(get_adapters_settings().whatsapp_verify_token)
