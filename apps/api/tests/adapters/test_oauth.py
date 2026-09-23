"""Google and Facebook authorization-code exchanges over respx."""

from urllib.parse import parse_qs, urlparse

import httpx
import pytest
import respx

from app.adapters.oauth import (
    FacebookOAuthProvider,
    GoogleOAuthProvider,
    OAuthError,
    StubOAuthProvider,
)

google = GoogleOAuthProvider(client_id="gid", client_secret="gsecret")
facebook = FacebookOAuthProvider(client_id="fid", client_secret="fsecret")


def test_authorize_urls_carry_the_state_and_callback():
    for provider in (google, facebook):
        query = parse_qs(
            urlparse(
                provider.authorize_url(redirect_uri="https://api.zuula.ug/cb", state="n1")
            ).query
        )
        assert query["state"] == ["n1"] and query["redirect_uri"] == ["https://api.zuula.ug/cb"]
        assert query["response_type"] == ["code"]
    assert (
        "email"
        in parse_qs(urlparse(google.authorize_url(redirect_uri="x", state="s")).query)["scope"][0]
    )


@respx.mock
async def test_google_exchange_returns_the_verified_profile():
    token = respx.post(GoogleOAuthProvider.TOKEN_URL).mock(
        return_value=httpx.Response(200, json={"access_token": "at", "token_type": "Bearer"})
    )
    respx.get(GoogleOAuthProvider.USERINFO_URL).mock(
        return_value=httpx.Response(
            200,
            json={"sub": "108", "email": "okot@gmail.com", "email_verified": True, "name": "Okot"},
        )
    )
    profile = await google.exchange_code(code="c0de", redirect_uri="https://api.zuula.ug/cb")
    assert (profile.subject, profile.email, profile.name) == ("108", "okot@gmail.com", "Okot")
    body = dict(httpx.QueryParams(token.calls.last.request.content.decode()))
    assert body["code"] == "c0de" and body["grant_type"] == "authorization_code"
    assert respx.calls.last.request.headers["Authorization"] == "Bearer at"


@respx.mock
async def test_google_drops_an_unverified_email():
    # The callback links accounts by email, so an unverified address must never reach it.
    respx.post(GoogleOAuthProvider.TOKEN_URL).mock(
        return_value=httpx.Response(200, json={"access_token": "at"})
    )
    respx.get(GoogleOAuthProvider.USERINFO_URL).mock(
        return_value=httpx.Response(
            200, json={"sub": "108", "email": "x@example.com", "email_verified": False}
        )
    )
    assert (await google.exchange_code(code="c", redirect_uri="x")).email == ""


@respx.mock
async def test_facebook_exchange_returns_the_profile():
    respx.get(FacebookOAuthProvider.TOKEN_URL).mock(
        return_value=httpx.Response(200, json={"access_token": "fat"})
    )
    me = respx.get(FacebookOAuthProvider.PROFILE_URL).mock(
        return_value=httpx.Response(
            200, json={"id": "77", "name": "Amina", "email": "amina@example.com"}
        )
    )
    profile = await facebook.exchange_code(code="c", redirect_uri="x")
    assert (profile.provider, profile.subject, profile.email) == (
        "facebook",
        "77",
        "amina@example.com",
    )
    assert me.calls.last.request.url.params["access_token"] == "fat"


@respx.mock
async def test_a_refused_code_raises():
    respx.post(GoogleOAuthProvider.TOKEN_URL).mock(
        return_value=httpx.Response(400, json={"error": "invalid_grant"})
    )
    with pytest.raises(OAuthError):
        await google.exchange_code(code="used", redirect_uri="x")


async def test_the_stub_signs_in_a_demo_profile():
    profile = await StubOAuthProvider("google").exchange_code(code="c", redirect_uri="x")
    assert profile.email == "demo@google.example" and profile.subject
