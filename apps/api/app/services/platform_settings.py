"""The live, admin-editable platform settings (FR-ADMIN-06): the `platform_settings` row, or the
app/core/rules.py defaults if it hasn't been created yet. The partner rate limit's default is
ZUULA_PARTNER_RATE_LIMIT_PER_HOUR (itself defaulting to rules.PARTNER_RATE_LIMIT_PER_HOUR), so
an operator's env override still applies until an admin saves a value."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rules
from app.core.config import get_settings
from app.db.models import PlatformSettings as PlatformSettingsRow
from app.schemas.admin import PlatformSettings, Retraining, Thresholds, Weights


def default_settings() -> PlatformSettings:
    t = rules.CCS_STATUS_THRESHOLDS
    return PlatformSettings(
        thresholds=Thresholds(
            verified_min=t["verified"]["min_score"],
            questioned_min=t["questioned"]["min_score"],
            questioned_max=t["questioned"]["max_score"],
            questioned_ratings=t["questioned"]["min_ratings"],
            escalated_max=t["escalated"]["max_score"],
            escalated_ratings=t["escalated"]["min_ratings"],
            suspended_max=t["suspended"]["max_score"],
            suspended_ratings=t["suspended"]["min_ratings"],
        ),
        weights=Weights(**rules.CCS_WEIGHTS),
        sla_hours=rules.REVIEW_SLA_HOURS,
        api_rate_limit=get_settings().partner_rate_limit_per_hour,
        retraining=Retraining(cadence="weekly", min_ccs=85),
    )


async def get_platform_settings(db: AsyncSession) -> PlatformSettings:
    row = await db.get(PlatformSettingsRow, 1)
    return PlatformSettings.model_validate(row.settings) if row else default_settings()


def weights_of(settings: PlatformSettings) -> dict[str, int]:
    """The live §9.1 weights in app.services.community's shape."""
    w = settings.weights
    return {"public": w.public, "journalist": w.journalist, "expert": w.expert}


def thresholds_of(settings: PlatformSettings) -> dict[str, dict[str, int]]:
    """The live §9.2 thresholds in app.core.rules.CCS_STATUS_THRESHOLDS' shape."""
    t = settings.thresholds
    return {
        "verified": {"min_score": t.verified_min},
        "questioned": {
            "min_score": t.questioned_min,
            "max_score": t.questioned_max,
            "min_ratings": t.questioned_ratings,
        },
        "escalated": {"max_score": t.escalated_max, "min_ratings": t.escalated_ratings},
        "suspended": {"max_score": t.suspended_max, "min_ratings": t.suspended_ratings},
    }
