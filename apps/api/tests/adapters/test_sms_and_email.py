"""Africa's Talking over respx, and SMTP with `aiosmtplib.send` captured."""

import httpx
import pytest
import respx

from app.adapters import email as email_adapter
from app.adapters.sms import LIVE_URL, SANDBOX_URL, AfricasTalkingSmsSender, SmsError


def _at_reply(status_code: int, status: str) -> dict:
    return {
        "SMSMessageData": {
            "Message": "Sent to 1/1",
            "Recipients": [
                {"number": "+256700000000", "statusCode": status_code, "status": status}
            ],
        }
    }


@respx.mock
async def test_sms_posts_to_africas_talking():
    route = respx.post(LIVE_URL).mock(
        return_value=httpx.Response(201, json=_at_reply(101, "Success"))
    )
    await AfricasTalkingSmsSender(username="zuula", api_key="key").send(
        to="+256700000000", message="Your code is 123456."
    )
    request = route.calls.last.request
    assert request.headers["apiKey"] == "key"
    body = dict(httpx.QueryParams(request.content.decode()))
    assert body == {"username": "zuula", "to": "+256700000000", "message": "Your code is 123456."}


@respx.mock
async def test_the_sandbox_username_uses_the_sandbox_host():
    route = respx.post(SANDBOX_URL).mock(
        return_value=httpx.Response(201, json=_at_reply(100, "Processed"))
    )
    await AfricasTalkingSmsSender(username="sandbox", api_key="key").send(
        to="+256700000000", message="x"
    )
    assert route.called


@respx.mock
@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(401, text="The supplied authentication is invalid"),
        httpx.Response(201, json=_at_reply(403, "InvalidPhoneNumber")),
        httpx.Response(201, json={"SMSMessageData": {"Recipients": []}}),
    ],
)
async def test_sms_failures_raise(response):
    respx.post(LIVE_URL).mock(return_value=response)
    with pytest.raises(SmsError):
        await AfricasTalkingSmsSender(username="zuula", api_key="key").send(
            to="+256700000000", message="x"
        )


@pytest.mark.parametrize(("port", "tls", "starttls"), [(587, False, True), (465, True, False)])
async def test_email_goes_out_over_smtp(monkeypatch, port, tls, starttls):
    sent = {}

    async def fake_send(message, **kwargs):
        sent["message"], sent["kwargs"] = message, kwargs

    monkeypatch.setattr(email_adapter.aiosmtplib, "send", fake_send)
    sender = email_adapter.SmtpEmailSender(
        host="smtp.example.com", port=port, username="u", password="p", sender="hello@zuula.ug"
    )
    await sender.send(to="amina@example.com", subject="Your code", body="123456")
    message = sent["message"]
    assert message["To"] == "amina@example.com" and message["Subject"] == "Your code"
    assert message["From"] == "Zuula <hello@zuula.ug>"
    assert message.get_content().strip() == "123456"
    assert sent["kwargs"]["hostname"] == "smtp.example.com"
    assert (sent["kwargs"]["use_tls"], sent["kwargs"]["start_tls"]) == (tls, starttls)
