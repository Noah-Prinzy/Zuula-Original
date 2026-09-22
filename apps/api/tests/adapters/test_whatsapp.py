from app.adapters.whatsapp import StubWhatsAppAdapter


def test_verify_webhook_matching_token_returns_challenge():
    adapter = StubWhatsAppAdapter(verify_token="secret")
    assert adapter.verify_webhook(mode="subscribe", token="secret", challenge="abc") == "abc"


def test_verify_webhook_wrong_token_returns_none():
    adapter = StubWhatsAppAdapter(verify_token="secret")
    assert adapter.verify_webhook(mode="subscribe", token="wrong", challenge="abc") is None


def test_verify_webhook_wrong_mode_returns_none():
    adapter = StubWhatsAppAdapter(verify_token="secret")
    assert adapter.verify_webhook(mode="unsubscribe", token="secret", challenge="abc") is None


def test_parse_inbound_extracts_messages():
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "messages": [
                                {"from": "256700000000", "text": {"body": "Is this true?"}},
                                {"from": "256711111111", "text": {"body": "Check this too"}},
                            ]
                        }
                    }
                ]
            }
        ]
    }
    messages = StubWhatsAppAdapter(verify_token="").parse_inbound(payload)
    assert len(messages) == 2
    assert messages[0].sender == "256700000000"
    assert messages[0].text == "Is this true?"


def test_parse_inbound_ignores_status_updates_and_empty_payloads():
    # A delivery-status callback has no "messages" key at all under value.
    payload = {"entry": [{"changes": [{"value": {"statuses": [{"id": "wamid.x"}]}}]}]}
    assert StubWhatsAppAdapter(verify_token="").parse_inbound(payload) == []
    assert StubWhatsAppAdapter(verify_token="").parse_inbound({}) == []


def test_send_reply_does_not_raise():
    StubWhatsAppAdapter(verify_token="").send_reply(to="256700000000", text="thanks")
