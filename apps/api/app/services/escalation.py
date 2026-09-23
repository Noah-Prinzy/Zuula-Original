"""Opening expert review cases (§9.2, FR-REVIEW). ADR 0002 §4.

Four triggers, one function:
- a report's community status *enters* `escalated` or `suspended` (a vote, or an admin's
  weight/threshold change — decision 6b: those open cases too);
- open user reports on a verdict reach `rules.USER_REPORTS_CASE_THRESHOLD`;
- the pipeline's AI confidence is below `rules.LOW_CONFIDENCE_THRESHOLD`.

A report has at most one open case (a partial unique index). A second trigger on a report
that already has one upgrades that case when it's more serious (suspended > community
escalation > user reports > low confidence) rather than queueing a duplicate.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import new_id
from app.db.models import FactCheckReport, ReviewCase
from app.schemas.admin import PlatformSettings

_SEVERITY = {"low-confidence": 0, "user-reports": 1, "community-escalation": 2, "suspended": 3}
_PRIORITY = {
    "low-confidence": "normal",
    "user-reports": "normal",
    "community-escalation": "high",
    "suspended": "high",
}


async def open_case(
    db: AsyncSession,
    report: FactCheckReport,
    reason: str,
    settings: PlatformSettings,
    *,
    content_report_id: str | None = None,
) -> ReviewCase:
    existing = (
        await db.scalars(
            select(ReviewCase).where(ReviewCase.report_id == report.id, ReviewCase.status == "open")
        )
    ).first()
    if existing is not None:
        if _SEVERITY[reason] > _SEVERITY[existing.reason]:
            existing.reason = reason
            existing.priority = _PRIORITY[reason]
        if content_report_id and existing.content_report_id is None:
            existing.content_report_id = content_report_id
        return existing

    now = datetime.now(UTC)
    case = ReviewCase(
        id=new_id("rc"),
        report_id=report.id,
        reason=reason,
        flagged_at=now,
        content_report_id=content_report_id,
        priority=_PRIORITY[reason],
        sla_due_at=now + timedelta(hours=settings.sla_hours),
        status="open",
    )
    db.add(case)
    await db.flush()
    return case


async def on_status_change(
    db: AsyncSession, report: FactCheckReport, previous: str | None, settings: PlatformSettings
) -> ReviewCase | None:
    """Call after recompute_report_community() with the previous status it returned (None =
    unchanged). Only *entering* escalated/suspended opens a case."""
    if previous is None:
        return None
    if report.community_status == "suspended":
        return await open_case(db, report, "suspended", settings)
    if report.community_status == "escalated" and previous != "suspended":
        return await open_case(db, report, "community-escalation", settings)
    return None
