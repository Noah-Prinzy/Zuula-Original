"""ZUULA_ENV=production refuses to start on stub adapters (ADR 0002 §7)."""

import pytest

from app.adapters.readiness import REQUIRED, assert_production_ready
from app.core.config import AdaptersSettings, Settings

_ALL = {var.lower(): "set" for variables in REQUIRED.values() for var in variables}


def test_development_never_blocks():
    assert_production_ready(Settings(env="development"), AdaptersSettings())


def test_production_names_every_missing_setting():
    with pytest.raises(RuntimeError) as exc:
        assert_production_ready(Settings(env="production"), AdaptersSettings())
    message = str(exc.value)
    for var in (
        "TURNSTILE_SECRET_KEY",
        "CLAMAV_HOST",
        "WHATSAPP_APP_SECRET",
        "TELEGRAM_WEBHOOK_SECRET",
        "ZUULA_SECRET_KEY",
    ):
        assert var in message


def test_production_rejects_the_sms_sandbox():
    adapters = AdaptersSettings(**{**_ALL, "africastalking_username": "sandbox"})
    with pytest.raises(RuntimeError, match="not 'sandbox'"):
        assert_production_ready(Settings(env="production", secret_key="real"), adapters)


def test_production_starts_when_everything_is_set():
    adapters = AdaptersSettings(**{**_ALL, "africastalking_username": "zuula"})
    assert_production_ready(Settings(env="production", secret_key="real"), adapters)
