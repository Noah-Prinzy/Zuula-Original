"""Cloudflare siteverify over respx. Anything but a clear success fails the captcha."""

import httpx
import pytest
import respx

from app.adapters.turnstile import SITEVERIFY_URL, CloudflareTurnstileVerifier

verifier = CloudflareTurnstileVerifier(secret_key="secret")


@respx.mock
async def test_a_valid_token_passes_and_sends_the_ip():
    route = respx.post(SITEVERIFY_URL).mock(
        return_value=httpx.Response(200, json={"success": True})
    )
    assert await verifier.verify("token", remote_ip="41.210.1.2") is True
    body = dict(httpx.QueryParams(route.calls.last.request.content.decode()))
    assert body == {"secret": "secret", "response": "token", "remoteip": "41.210.1.2"}


@respx.mock
@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(200, json={"success": False, "error-codes": ["invalid-input-response"]}),
        httpx.Response(500),
        httpx.Response(200, text="not json"),
    ],
)
async def test_rejections_and_errors_fail(response):
    respx.post(SITEVERIFY_URL).mock(return_value=response)
    assert await verifier.verify("token") is False


@respx.mock
async def test_network_errors_fail_closed():
    respx.post(SITEVERIFY_URL).mock(side_effect=httpx.ConnectError("down"))
    assert await verifier.verify("token") is False


@pytest.mark.parametrize("token", [None, "", "   "])
async def test_a_missing_token_fails_without_a_call(token):
    assert await verifier.verify(token) is False
