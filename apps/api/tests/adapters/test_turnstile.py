import pytest

from app.adapters.turnstile import get_turnstile_verifier


@pytest.mark.parametrize("token", [None, "", "   "])
def test_empty_or_missing_token_fails(token):
    assert get_turnstile_verifier().verify(token) is False


def test_present_token_passes():
    assert get_turnstile_verifier().verify("any-non-empty-token") is True
