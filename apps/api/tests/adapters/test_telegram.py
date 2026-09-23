import json

import httpx
import pytest
import respx

from app.adapters.telegram import BotApiTelegramAdapter, StubTelegramAdapter, TelegramError


def test_parse_inbound_extracts_message():
    message = StubTelegramAdapter().parse_inbound(
        {"message": {"chat": {"id": 42}, "text": "Is this true?"}}
    )
    assert message is not None
    assert (message.chat_id, message.text) == ("42", "Is this true?")


def test_parse_inbound_ignores_non_text_updates():
    assert StubTelegramAdapter().parse_inbound({"edited_message": {"text": "x"}}) is None
    assert StubTelegramAdapter().parse_inbound({}) is None
    sticker = {"message": {"chat": {"id": 42}, "sticker": {"file_id": "abc"}}}
    assert StubTelegramAdapter().parse_inbound(sticker) is None


def test_secret_token_check():
    adapter = StubTelegramAdapter("s3cret")
    assert adapter.verify_secret("s3cret") is True
    assert adapter.verify_secret("wrong") is False
    assert adapter.verify_secret(None) is False
    assert StubTelegramAdapter().verify_secret(None) is True  # local dev: no secret set


@respx.mock
async def test_send_reply_calls_send_message():
    route = respx.post("https://api.telegram.org/botT0KEN/sendMessage").mock(
        return_value=httpx.Response(200, json={"ok": True})
    )
    await BotApiTelegramAdapter(bot_token="T0KEN", webhook_secret="s").send_reply(
        chat_id="42", text="Verdict"
    )
    assert json.loads(route.calls.last.request.content) == {"chat_id": "42", "text": "Verdict"}


@respx.mock
async def test_send_reply_failure_raises_without_the_token():
    respx.post("https://api.telegram.org/botT0KEN/sendMessage").mock(
        return_value=httpx.Response(403)
    )
    with pytest.raises(TelegramError) as exc:
        await BotApiTelegramAdapter(bot_token="T0KEN", webhook_secret="s").send_reply(
            chat_id="42", text="x"
        )
    assert "T0KEN" not in str(exc.value)
