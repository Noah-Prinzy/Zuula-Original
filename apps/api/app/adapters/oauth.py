"""Google/Facebook OAuth (FR-AUTH-01). Interface + a stub that never calls either provider:
`authorize_url` builds a fake authorize link, `exchange_code` always "succeeds" with a fixed
demo profile — good enough to exercise app/api/v1/auth.py's start/callback routes end to end.
"""

from dataclasses import dataclass
from typing import Protocol

_KNOWN_PROVIDERS = ("google", "facebook")


@dataclass
class OAuthProfile:
    provider: str
    subject: str
    email: str
    name: str


class OAuthProvider(Protocol):
    def authorize_url(self, *, redirect_uri: str, state: str) -> str: ...
    def exchange_code(self, *, code: str, redirect_uri: str) -> OAuthProfile: ...


class StubOAuthProvider:
    def __init__(self, provider: str):
        self.provider = provider

    def authorize_url(self, *, redirect_uri: str, state: str) -> str:
        return f"https://{self.provider}.example/oauth/authorize?redirect_uri={redirect_uri}&state={state}"

    def exchange_code(self, *, code: str, redirect_uri: str) -> OAuthProfile:
        return OAuthProfile(
            provider=self.provider,
            subject=f"stub-{self.provider}-user",
            email=f"demo@{self.provider}.example",
            name="Demo User",
        )


_PROVIDERS: dict[str, OAuthProvider] = {p: StubOAuthProvider(p) for p in _KNOWN_PROVIDERS}


def get_oauth_provider(provider: str) -> OAuthProvider:
    if provider not in _PROVIDERS:
        raise ValueError(f"Unknown OAuth provider '{provider}'.")
    return _PROVIDERS[provider]
