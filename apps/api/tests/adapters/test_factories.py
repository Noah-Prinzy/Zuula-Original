"""Each factory returns its stub until the adapter's settings are filled in."""

import pytest

from app.adapters import clamav, email, oauth, sms, storage, telegram, turnstile, whatsapp


def test_everything_is_a_stub_without_credentials():
    assert isinstance(sms.get_sms_sender(), sms.StubSmsSender)
    assert isinstance(email.get_email_sender(), email.StubEmailSender)
    assert isinstance(turnstile.get_turnstile_verifier(), turnstile.StubTurnstileVerifier)
    assert isinstance(clamav.get_clamav_scanner(), clamav.StubClamAvScanner)
    assert isinstance(storage.get_object_storage(), storage.StubObjectStorage)
    assert isinstance(oauth.get_oauth_provider("google"), oauth.StubOAuthProvider)
    assert type(whatsapp.get_whatsapp_adapter()) is whatsapp.StubWhatsAppAdapter
    assert type(telegram.get_telegram_adapter()) is telegram.StubTelegramAdapter


def test_configured_adapters_are_real(adapter_env):
    adapter_env(
        AFRICASTALKING_API_KEY="k",
        EMAIL_SMTP_HOST="smtp.example.com",
        TURNSTILE_SECRET_KEY="s",
        CLAMAV_HOST="clamav",
        S3_ACCESS_KEY_ID="id",
        S3_SECRET_ACCESS_KEY="secret",
        GOOGLE_OAUTH_CLIENT_ID="g",
        GOOGLE_OAUTH_CLIENT_SECRET="gs",
        WHATSAPP_ACCESS_TOKEN="t",
        WHATSAPP_PHONE_NUMBER_ID="123",
        TELEGRAM_BOT_TOKEN="bot",
    )
    assert isinstance(sms.get_sms_sender(), sms.AfricasTalkingSmsSender)
    assert isinstance(email.get_email_sender(), email.SmtpEmailSender)
    assert isinstance(turnstile.get_turnstile_verifier(), turnstile.CloudflareTurnstileVerifier)
    assert isinstance(clamav.get_clamav_scanner(), clamav.ClamdScanner)
    assert isinstance(storage.get_object_storage(), storage.S3ObjectStorage)
    assert isinstance(oauth.get_oauth_provider("google"), oauth.GoogleOAuthProvider)
    # Facebook has no credentials in this test, so it stays a stub on its own.
    assert isinstance(oauth.get_oauth_provider("facebook"), oauth.StubOAuthProvider)
    assert isinstance(whatsapp.get_whatsapp_adapter(), whatsapp.CloudWhatsAppAdapter)
    assert isinstance(telegram.get_telegram_adapter(), telegram.BotApiTelegramAdapter)
    storage._s3 = None


def test_unknown_oauth_provider_raises():
    with pytest.raises(ValueError):
        oauth.get_oauth_provider("linkedin")


async def test_stubs_record_instead_of_sending():
    await sms.StubSmsSender().send(to="+256700000000", message="hi")
    await email.StubEmailSender().send(to="a@b.com", subject="S", body="B")
    assert sms.OUTBOX[-1] == {"to": "+256700000000", "message": "hi"}
    assert email.OUTBOX[-1] == {"to": "a@b.com", "subject": "S", "body": "B"}
    assert (await clamav.StubClamAvScanner().scan(b"x")).clean is True
    assert await turnstile.StubTurnstileVerifier().verify("token") is True
    assert await turnstile.StubTurnstileVerifier().verify("  ") is False

    store = storage.StubObjectStorage()
    assert (
        await store.put(key="k/1", data=b"abc", content_type="image/png")
        == "stub://zuula-media/k/1"
    )
    assert await store.get(key="k/1") == b"abc"
    await store.delete(key="k/1")
    assert await store.get(key="k/1") == b""  # the dev stub doesn't fail on a missing key
