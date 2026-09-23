"""Which adapters run for real, and the production guard (ADR 0002 §7).

Every adapter's `get_*()` factory uses the real implementation when that adapter's settings
are filled in and the logging stub otherwise, which keeps local dev and the tests free of
external services. In production a stub would silently drop SMS codes, skip malware scans or
accept any captcha, so `ZUULA_ENV=production` with anything missing stops the API and the
worker at startup instead (`assert_production_ready()`), naming every missing variable.
"""

from app.core.config import AdaptersSettings, Settings, get_adapters_settings, get_settings

_DEV_SECRET_KEY = "change-me-dev-only"

# Adapter → the .env variables it needs (all of them) to run for real.
REQUIRED: dict[str, tuple[str, ...]] = {
    "Google sign-in": ("GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"),
    "Facebook sign-in": ("FACEBOOK_OAUTH_CLIENT_ID", "FACEBOOK_OAUTH_CLIENT_SECRET"),
    "SMS (Africa's Talking)": ("AFRICASTALKING_USERNAME", "AFRICASTALKING_API_KEY"),
    "Email (SMTP)": ("EMAIL_SMTP_HOST", "EMAIL_FROM"),
    "Captcha (Turnstile)": ("TURNSTILE_SECRET_KEY",),
    "Malware scanning (ClamAV)": ("CLAMAV_HOST",),
    "Media storage (S3)": ("S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"),
    "WhatsApp": (
        "WHATSAPP_VERIFY_TOKEN",
        "WHATSAPP_ACCESS_TOKEN",
        "WHATSAPP_PHONE_NUMBER_ID",
        "WHATSAPP_APP_SECRET",
    ),
    "Telegram": ("TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET"),
}


def configured(adapter: str, settings: AdaptersSettings | None = None) -> bool:
    settings = settings or get_adapters_settings()
    return all(getattr(settings, var.lower()) for var in REQUIRED[adapter])


def missing_for_production(settings: Settings, adapters: AdaptersSettings) -> list[str]:
    missing = [
        var
        for variables in REQUIRED.values()
        for var in variables
        if not getattr(adapters, var.lower())
    ]
    # The sandbox username only reaches Africa's Talking's simulator: no SMS is delivered.
    if adapters.africastalking_username == "sandbox":
        missing.append("AFRICASTALKING_USERNAME (not 'sandbox')")
    # Signs one-time codes and the OAuth state cookie.
    if settings.secret_key in ("", _DEV_SECRET_KEY):
        missing.append("ZUULA_SECRET_KEY (not the development default)")
    return missing


def assert_production_ready(
    settings: Settings | None = None, adapters: AdaptersSettings | None = None
) -> None:
    settings = settings or get_settings()
    if settings.env != "production":
        return
    missing = missing_for_production(settings, adapters or get_adapters_settings())
    if missing:
        raise RuntimeError(
            "ZUULA_ENV=production, but these settings are missing, so the API would fall back "
            "to stub adapters: " + ", ".join(missing)
        )
