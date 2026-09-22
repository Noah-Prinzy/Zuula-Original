from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ZUULA_", env_file=".env", extra="ignore")

    env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-dev-only"
    session_cookie_name: str = "zuula_session"
    cors_origins: str = "http://localhost:3000"

    partner_rate_limit_per_hour: int = 100

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


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_celery_settings() -> CelerySettings:
    return CelerySettings()


@lru_cache
def get_analysis_settings() -> AnalysisSettings:
    return AnalysisSettings()
