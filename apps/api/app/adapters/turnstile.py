"""Cloudflare Turnstile (FR-AUTH-07): verifies the captcha token SubmissionInput.captchaToken
carries, required when a submission comes in signed-out. Interface + a stub that checks
presence only — no call to Cloudflare's siteverify endpoint happens in P2.
"""

from typing import Protocol


class TurnstileVerifier(Protocol):
    def verify(self, token: str | None) -> bool: ...


class StubTurnstileVerifier:
    def verify(self, token: str | None) -> bool:
        return bool(token and token.strip())


def get_turnstile_verifier() -> TurnstileVerifier:
    return StubTurnstileVerifier()
