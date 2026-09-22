"""Telegram Bot API (FR-SUBMIT-04): inbound messages create submissions, via
app/webhooks/telegram.py. Interface covers parsing the bot API's update payload and a stub
reply sender — no call to api.telegram.org happens in P2.
"""

import logging
from dataclasses import dataclass
from typing import Protocol

logger = logging.getLogger("zuula.adapters.telegram")


@dataclass
class InboundMessage:
    chat_id: str
    text: str


class TelegramAdapter(Protocol):
    def parse_inbound(self, payload: dict) -> InboundMessage | None: ...
    def send_reply(self, *, chat_id: str, text: str) -> None: ...


class StubTelegramAdapter:
    def parse_inbound(self, payload: dict) -> InboundMessage | None:
        # Matches the Bot API's Update shape: {"message": {"chat": {"id": ...}, "text": ...}}
        message = payload.get("message") or {}
        text = message.get("text")
        chat_id = (message.get("chat") or {}).get("id")
        if text and chat_id is not None:
            return InboundMessage(chat_id=str(chat_id), text=text)
        return None

    def send_reply(self, *, chat_id: str, text: str) -> None:
        logger.info("Telegram reply (stub, not sent): chat_id=%s text=%r", chat_id, text)


def get_telegram_adapter() -> TelegramAdapter:
    return StubTelegramAdapter()
