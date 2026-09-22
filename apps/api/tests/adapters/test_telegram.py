from app.adapters.telegram import StubTelegramAdapter


def test_parse_inbound_extracts_message():
    payload = {"message": {"chat": {"id": 42}, "text": "Is this true?"}}
    message = StubTelegramAdapter().parse_inbound(payload)
    assert message is not None
    assert message.chat_id == "42"
    assert message.text == "Is this true?"


def test_parse_inbound_ignores_non_text_updates():
    # An edited_message or a callback_query update has no top-level "message" key.
    assert StubTelegramAdapter().parse_inbound({"edited_message": {"text": "x"}}) is None
    assert StubTelegramAdapter().parse_inbound({}) is None


def test_parse_inbound_ignores_message_without_text():
    # A sticker/photo message has a "message" but no "text" field.
    payload = {"message": {"chat": {"id": 42}, "sticker": {"file_id": "abc"}}}
    assert StubTelegramAdapter().parse_inbound(payload) is None


def test_send_reply_does_not_raise():
    StubTelegramAdapter().send_reply(chat_id="42", text="thanks")
