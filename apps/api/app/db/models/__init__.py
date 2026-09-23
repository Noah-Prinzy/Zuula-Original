"""Every model, imported here so `Base.metadata` is complete for Alembic autogenerate and for
anything else that needs the whole schema."""

from app.db.models.content import (
    ExpertAnnotation,
    FactCheckReport,
    Rating,
    RatingComment,
    Submission,
)
from app.db.models.identity import (
    AccreditationApplication,
    ApiKey,
    ApiUsageHourly,
    AuthChallenge,
    OAuthIdentity,
    Session,
    User,
)
from app.db.models.platform import (
    AlertSettings,
    AuditLogEntry,
    Broadcast,
    ModelEvaluation,
    Notification,
    PlatformSettings,
    TrustedSource,
)
from app.db.models.review import (
    ContentFlag,
    ContentReport,
    ManipulationSignal,
    ReviewCase,
    ReviewDecision,
)

__all__ = [
    "AccreditationApplication",
    "AlertSettings",
    "ApiKey",
    "ApiUsageHourly",
    "AuditLogEntry",
    "AuthChallenge",
    "Broadcast",
    "ContentFlag",
    "ContentReport",
    "ExpertAnnotation",
    "FactCheckReport",
    "ManipulationSignal",
    "ModelEvaluation",
    "Notification",
    "OAuthIdentity",
    "PlatformSettings",
    "Rating",
    "RatingComment",
    "ReviewCase",
    "ReviewDecision",
    "Session",
    "Submission",
    "TrustedSource",
    "User",
]
