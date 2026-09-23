"""Google/Facebook OAuth (FR-AUTH-01): the authorization-code flow app/api/v1/auth.py's
start/callback routes drive.

The real providers exchange the code at the token endpoint and read the profile over
`httpx`. A profile's `email` is only filled in when the provider has verified it, because
the callback links a new identity to an existing account by email. A provider without a
client id and secret falls back to the stub, which never calls anyone and "signs in" a fixed
demo profile; in production it's unavailable instead (`ProviderUnavailable`).
"""

from dataclasses import dataclass
from typing import Protocol
from urllib.parse import urlencode

import httpx

from app.adapters.readiness import configured, is_production
from app.core.config import get_adapters_settings

_KNOWN_PROVIDERS = ("google", "facebook")
# Graph API versions are supported for about two years; bump this when Meta retires it.
FACEBOOK_GRAPH_VERSION = "v21.0"


class OAuthError(Exception):
    pass


class ProviderUnavailable(OAuthError):
    """This provider has no credentials, and production never falls back to the stub (which
    would sign anyone in as its demo profile)."""


@dataclass
class OAuthProfile:
    provider: str
    subject: str
    email: str
    name: str


class OAuthProvider(Protocol):
    def authorize_url(self, *, redirect_uri: str, state: str) -> str: ...
    async def exchange_code(self, *, code: str, redirect_uri: str) -> OAuthProfile: ...


class StubOAuthProvider:
    def __init__(self, provider: str):
        self.provider = provider

    def authorize_url(self, *, redirect_uri: str, state: str) -> str:
        query = urlencode({"redirect_uri": redirect_uri, "state": state})
        return f"https://{self.provider}.example/oauth/authorize?{query}"

    async def exchange_code(self, *, code: str, redirect_uri: str) -> OAuthProfile:
        return OAuthProfile(
            provider=self.provider,
            subject=f"stub-{self.provider}-user",
            email=f"demo@{self.provider}.example",
            name="Demo User",
        )


def _json(response: httpx.Response, what: str) -> dict:
    if response.status_code >= 400:
        raise OAuthError(f"{what} failed with HTTP {response.status_code}.")
    return response.json()


class GoogleOAuthProvider:
    provider = "google"
    AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

    def __init__(self, *, client_id: str, client_secret: str, timeout: float = 10.0):
        self._client_id = client_id
        self._client_secret = client_secret
        self._timeout = timeout

    def authorize_url(self, *, redirect_uri: str, state: str) -> str:
        query = urlencode(
            {
                "client_id": self._client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
                "prompt": "select_account",
            }
        )
        return f"{self.AUTHORIZE_URL}?{query}"

    async def exchange_code(self, *, code: str, redirect_uri: str) -> OAuthProfile:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            token = _json(
                await client.post(
                    self.TOKEN_URL,
                    data={
                        "code": code,
                        "client_id": self._client_id,
                        "client_secret": self._client_secret,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code",
                    },
                ),
                "Google token exchange",
            )
            info = _json(
                await client.get(
                    self.USERINFO_URL,
                    headers={"Authorization": f"Bearer {token['access_token']}"},
                ),
                "Google userinfo",
            )
        if not info.get("sub"):
            raise OAuthError("Google returned no account id.")
        verified = info.get("email_verified") in (True, "true")
        return OAuthProfile(
            provider=self.provider,
            subject=str(info["sub"]),
            email=info.get("email", "") if verified else "",
            name=info.get("name", ""),
        )


class FacebookOAuthProvider:
    provider = "facebook"
    AUTHORIZE_URL = f"https://www.facebook.com/{FACEBOOK_GRAPH_VERSION}/dialog/oauth"
    TOKEN_URL = f"https://graph.facebook.com/{FACEBOOK_GRAPH_VERSION}/oauth/access_token"
    PROFILE_URL = f"https://graph.facebook.com/{FACEBOOK_GRAPH_VERSION}/me"

    def __init__(self, *, client_id: str, client_secret: str, timeout: float = 10.0):
        self._client_id = client_id
        self._client_secret = client_secret
        self._timeout = timeout

    def authorize_url(self, *, redirect_uri: str, state: str) -> str:
        query = urlencode(
            {
                "client_id": self._client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "email,public_profile",
                "state": state,
            }
        )
        return f"{self.AUTHORIZE_URL}?{query}"

    async def exchange_code(self, *, code: str, redirect_uri: str) -> OAuthProfile:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            token = _json(
                await client.get(
                    self.TOKEN_URL,
                    params={
                        "client_id": self._client_id,
                        "client_secret": self._client_secret,
                        "redirect_uri": redirect_uri,
                        "code": code,
                    },
                ),
                "Facebook token exchange",
            )
            info = _json(
                await client.get(
                    self.PROFILE_URL,
                    params={"fields": "id,name,email", "access_token": token["access_token"]},
                ),
                "Facebook profile",
            )
        if not info.get("id"):
            raise OAuthError("Facebook returned no account id.")
        # Facebook only returns an email address its user has confirmed.
        return OAuthProfile(
            provider=self.provider,
            subject=str(info["id"]),
            email=info.get("email", ""),
            name=info.get("name", ""),
        )


def get_oauth_provider(provider: str) -> OAuthProvider:
    if provider not in _KNOWN_PROVIDERS:
        raise ValueError(f"Unknown OAuth provider '{provider}'.")
    settings = get_adapters_settings()
    if provider == "google" and configured("google", settings):
        return GoogleOAuthProvider(
            client_id=settings.google_oauth_client_id,
            client_secret=settings.google_oauth_client_secret,
        )
    if provider == "facebook" and configured("facebook", settings):
        return FacebookOAuthProvider(
            client_id=settings.facebook_oauth_client_id,
            client_secret=settings.facebook_oauth_client_secret,
        )
    if is_production():
        raise ProviderUnavailable(f"Sign-in with {provider} isn't set up.")
    return StubOAuthProvider(provider)
