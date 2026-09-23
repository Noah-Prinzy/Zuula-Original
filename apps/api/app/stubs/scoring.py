"""P2 stub data scores itself with the real implementation — app/services/community.py, the
port of apps/web/lib/community.ts. Kept as a re-export until app/stubs/ is removed (P3 PR 6)."""

from app.services.community import community_score, status_for

__all__ = ["community_score", "status_for"]
