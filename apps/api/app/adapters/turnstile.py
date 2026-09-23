"""Cloudflare Turnstile (FR-AUTH-07): verifies the captcha token SubmissionInput.captchaToken
carries, required when a submission comes in signed-out.

`CloudflareTurnstileVerifier` POSTs the token and the visitor's IP to Cloudflare's
`siteverify`. Without TURNSTILE_SECRET_KEY the stub accepts any non-empty token.
"""

import logging
from typing import Protocol

import httpx

from app.adapters.readiness import configured
from app.core.config import get_adapters_settings

logger = logging.getLogger("zuula.adapters.turnstile")

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


class TurnstileVerifier(Protocol):
    async def verify(self, token: str | None, *, remote_ip: str | None = None) -> bool: ...


class StubTurnstileVerifier:
    async def verify(self, token: str | None, *, remote_ip: str | None = None) -> bool:
        return bool(token and token.strip())


class CloudflareTurnstileVerifier:
    def __init__(self, *, secret_key: str, timeout: float = 10.0):
        self._secret_key = secret_key
        self._timeout = timeout

    async def verify(self, token: str | None, *, remote_ip: str | None = None) -> bool:
        if not token or not token.strip():
            return False
        data = {"secret": self._secret_key, "response": token.strip()}
        if remote_ip:
            data["remoteip"] = remote_ip
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(SITEVERIFY_URL, data=data)
            response.raise_for_status()
            result = response.json()
        except (httpx.HTTPError, ValueError):
            # Fail closed: an unverifiable token is treated as a failed captcha.
            logger.warning("Turnstile siteverify failed", exc_info=True)
            return False
        if not result.get("success"):
            logger.info("Turnstile rejected a token: %s", result.get("error-codes"))
        return bool(result.get("success"))


def get_turnstile_verifier() -> TurnstileVerifier:
    if configured("Captcha (Turnstile)"):
        return CloudflareTurnstileVerifier(secret_key=get_adapters_settings().turnstile_secret_key)
    return StubTurnstileVerifier()
