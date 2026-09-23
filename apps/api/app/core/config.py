from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.rules import PARTNER_RATE_LIMIT_PER_HOUR


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ZUULA_", env_file=".env", extra="ignore")

    env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-dev-only"
    session_cookie_name: str = "zuula_session"
    cors_origins: str = "http://localhost:3000"

    # Independently overridable via ZUULA_PARTNER_RATE_LIMIT_PER_HOUR — see
    # app/core/rules.py's PARTNER_RATE_LIMIT_PER_HOUR for why this defaults to it rather
    # than hardcoding its own copy of the same number.
    partner_rate_limit_per_hour: int = PARTNER_RATE_LIMIT_PER_HOUR

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


class CelerySettings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"
    # Shared by app/realtime/ too — pub/sub for SSE lives on the same Redis, a different DB
    # index from the Celery broker/backend so a `FLUSHDB` on one doesn't take out the other.
    redis_url: str = "redis://localhost:6379/2"


class AnalysisSettings(BaseSettings):
    """Sending submissions to a hosted LLM outside Uganda is an open §10.1 data-protection
    question (see the P2 brief and docs/adr/0001-api-architecture.md), so the provider and
    its region must be switchable rather than hardcoded. P2 ships only `stub`; P4 adds real
    providers behind the same app.providers.analysis.AnalysisProvider interface."""

    model_config = SettingsConfigDict(extra="ignore")

    analysis_provider: str = "stub"
    analysis_provider_region: str = ""
    # Real step durations (app/worker/pipeline.py's STEP_SECONDS, matching
    # apps/web/lib/analysis.ts) are scaled by this factor — 1.0 for a realistic demo feel,
    # near-0 so pipeline tests don't spend ~10 real seconds per text submission.
    pipeline_step_scale: float = 1.0


class AdaptersSettings(BaseSettings):
    """Config for every Step 4 integration adapter (app/adapters/**) — one class since
    they're all equally inert in P2 (every adapter is a stub; these values are read by
    exactly nothing yet, only documented in .env.example for what P3's real
    implementations will need). Field names match .env.example's var names, no ZUULA_
    prefix — same convention as CelerySettings/AnalysisSettings."""

    model_config = SettingsConfigDict(extra="ignore")

    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""
    facebook_oauth_client_id: str = ""
    facebook_oauth_client_secret: str = ""

    africastalking_username: str = "sandbox"
    africastalking_api_key: str = ""

    turnstile_site_key: str = ""
    turnstile_secret_key: str = ""

    clamav_host: str = "clamav"
    clamav_port: int = 3310

    s3_endpoint_url: str = ""
    s3_bucket: str = "zuula-media-dev"
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_region: str = "us-east-1"

    email_from: str = "hello@zuula.ug"
    email_smtp_host: str = ""
    email_smtp_port: int = 587
    email_smtp_user: str = ""
    email_smtp_password: str = ""

    # FR-SUBMIT-04: WhatsApp/Telegram messages create submissions — see app/webhooks/.
    whatsapp_verify_token: str = ""
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""
    telegram_bot_token: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_celery_settings() -> CelerySettings:
    return CelerySettings()


@lru_cache
def get_analysis_settings() -> AnalysisSettings:
    return AnalysisSettings()


@lru_cache
def get_adapters_settings() -> AdaptersSettings:
    return AdaptersSettings()
