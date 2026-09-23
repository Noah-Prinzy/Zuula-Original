import hashlib
import hmac
import json

import httpx
import pytest
import respx

from app.adapters.whatsapp import CloudWhatsAppAdapter, StubWhatsAppAdapter, WhatsAppError


def test_verify_webhook_matching_token_returns_challenge():
    adapter = StubWhatsAppAdapter(verify_token="secret")
    assert adapter.verify_webhook(mode="subscribe", token="secret", challenge="abc") == "abc"


@pytest.mark.parametrize(
    ("configured", "mode", "token"),
    [("secret", "subscribe", "wrong"), ("secret", "unsubscribe", "secret"), ("", "subscribe", "")],
)
def test_verify_webhook_rejects(configured, mode, token):
    adapter = StubWhatsAppAdapter(verify_token=configured)
    assert adapter.verify_webhook(mode=mode, token=token, challenge="abc") is None


def test_signature_is_an_hmac_of_the_raw_body():
    adapter = StubWhatsAppAdapter(verify_token="v", app_secret="app-secret")
    body = json.dumps({"entry": []}).encode()
    good = "sha256=" + hmac.new(b"app-secret", body, hashlib.sha256).hexdigest()
    assert adapter.verify_signature(body, good) is True
    assert adapter.verify_signature(body + b" ", good) is False
    assert adapter.verify_signature(body, None) is False
    # No app secret configured (local dev only): nothing to check.
    assert StubWhatsAppAdapter(verify_token="v").verify_signature(body, None) is True


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
                                {"from": "256722222222", "type": "image", "image": {"id": "1"}},
                            ]
                        }
                    }
                ]
            }
        ]
    }
    messages = StubWhatsAppAdapter(verify_token="").parse_inbound(payload)
    assert [(m.sender, m.text) for m in messages] == [
        ("256700000000", "Is this true?"),
        ("256711111111", "Check this too"),
    ]


def test_parse_inbound_ignores_status_updates_and_empty_payloads():
    payload = {"entry": [{"changes": [{"value": {"statuses": [{"id": "wamid.x"}]}}]}]}
    assert StubWhatsAppAdapter(verify_token="").parse_inbound(payload) == []
    assert StubWhatsAppAdapter(verify_token="").parse_inbound({}) == []


def _cloud():
    return CloudWhatsAppAdapter(
        verify_token="v", app_secret="s", access_token="tok", phone_number_id="555"
    )


@respx.mock
async def test_send_reply_posts_to_the_graph_api():
    adapter = _cloud()
    route = respx.post(adapter.url).mock(
        return_value=httpx.Response(200, json={"messages": [{"id": "w"}]})
    )
    await adapter.send_reply(to="256700000000", text="Verdict: False.")
    request = route.calls.last.request
    assert request.url.path.endswith("/555/messages")
    assert request.headers["Authorization"] == "Bearer tok"
    assert json.loads(request.content) == {
        "messaging_product": "whatsapp",
        "to": "256700000000",
        "type": "text",
        "text": {"body": "Verdict: False."},
    }


@respx.mock
async def test_send_reply_failure_raises():
    adapter = _cloud()
    respx.post(adapter.url).mock(return_value=httpx.Response(401))
    with pytest.raises(WhatsAppError):
        await adapter.send_reply(to="256700000000", text="x")
