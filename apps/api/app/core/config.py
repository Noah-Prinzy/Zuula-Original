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


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_celery_settings() -> CelerySettings:
    return CelerySettings()
