import pytest

from app.adapters.oauth import get_oauth_provider


@pytest.mark.parametrize("provider", ["google", "facebook"])
def test_authorize_url_points_at_provider(provider):
    url = get_oauth_provider(provider).authorize_url(redirect_uri="/callback", state="/next")
    assert url.startswith(f"https://{provider}.example/")
    assert "redirect_uri=/callback" in url
    assert "state=/next" in url


@pytest.mark.parametrize("provider", ["google", "facebook"])
def test_exchange_code_returns_a_profile(provider):
    profile = get_oauth_provider(provider).exchange_code(code="stub-code", redirect_uri="/callback")
    assert profile.provider == provider
    assert profile.email
    assert profile.subject


def test_unknown_provider_raises():
    with pytest.raises(ValueError):
        get_oauth_provider("linkedin")
