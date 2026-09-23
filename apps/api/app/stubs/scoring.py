"""P2 stub data scores itself with the real implementation — app/services/community.py, the
port of apps/web/lib/community.ts, driven by app/core/rules.py. Kept as a re-export until
app/stubs/ is removed (P3 PR 6)."""

from app.core.rules import CCS_STATUS_THRESHOLDS, CCS_WEIGHTS
from app.services.community import community_score, status_for

__all__ = ["CCS_STATUS_THRESHOLDS", "CCS_WEIGHTS", "community_score", "status_for"]
