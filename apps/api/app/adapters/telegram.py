"""Telegram Bot API (FR-SUBMIT-04): inbound messages create submissions, via
app/webhooks/telegram.py, and the verdict is sent back to the same chat.

Inbound: the `X-Telegram-Bot-Api-Secret-Token` check (Telegram echoes the `secret_token`
given to setWebhook on every call) and parsing the Update payload. Outbound:
`BotApiTelegramAdapter` calls `sendMessage`. Without a bot token the stub logs replies
instead of sending them.
"""

import hmac
import logging
from dataclasses import dataclass
from typing import Protocol

import httpx

from app.core.config import get_adapters_settings

logger = logging.getLogger("zuula.adapters.telegram")


class TelegramError(Exception):
    pass


@dataclass
class InboundMessage:
    chat_id: str
    text: str


class TelegramAdapter(Protocol):
    def verify_secret(self, header: str | None) -> bool: ...
    def parse_inbound(self, payload: dict) -> InboundMessage | None: ...
    async def send_reply(self, *, chat_id: str, text: str) -> None: ...


class StubTelegramAdapter:
    def __init__(self, webhook_secret: str = ""):
        self._webhook_secret = webhook_secret

    def verify_secret(self, header: str | None) -> bool:
        # Without a secret (local dev only; production requires one) there's nothing to check.
        if not self._webhook_secret:
            return True
        return hmac.compare_digest(header or "", self._webhook_secret)

    def parse_inbound(self, payload: dict) -> InboundMessage | None:
        # Matches the Bot API's Update shape: {"message": {"chat": {"id": ...}, "text": ...}}
        message = payload.get("message") or {}
        text = message.get("text")
        chat_id = (message.get("chat") or {}).get("id")
        if text and chat_id is not None:
            return InboundMessage(chat_id=str(chat_id), text=text)
        return None

    async def send_reply(self, *, chat_id: str, text: str) -> None:
        logger.info("Telegram reply (stub, not sent): chat_id=%s text=%r", chat_id, text)


class BotApiTelegramAdapter(StubTelegramAdapter):
    def __init__(self, *, bot_token: str, webhook_secret: str, timeout: float = 10.0):
        super().__init__(webhook_secret)
        self._url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        self._timeout = timeout

    async def send_reply(self, *, chat_id: str, text: str) -> None:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(self._url, json={"chat_id": chat_id, "text": text})
        # The URL carries the bot token, so errors never include it.
        if response.status_code >= 400:
            raise TelegramError(f"Telegram sendMessage failed with HTTP {response.status_code}.")


def get_telegram_adapter() -> TelegramAdapter:
    settings = get_adapters_settings()
    if settings.telegram_bot_token:
        return BotApiTelegramAdapter(
            bot_token=settings.telegram_bot_token,
            webhook_secret=settings.telegram_webhook_secret,
        )
    return StubTelegramAdapter(settings.telegram_webhook_secret)
