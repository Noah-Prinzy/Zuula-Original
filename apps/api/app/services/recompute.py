"""Recomputing community scores in bulk: after an admin changes the weights or thresholds
(FR-ADMIN-06), or drops/restores a user's past ratings (decision 6a). ADR 0002 §4.

Every report is recomputed under its row lock, exactly like a vote, and a report that newly
*enters* escalated or suspended gets its review case (decision 6b) — a suspended report is
hidden, so without a case nobody would ever review it.
"""

from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FactCheckReport, Rating
from app.services import escalation
from app.services.community import recompute_report_community
from app.services.platform_settings import get_platform_settings, thresholds_of, weights_of

BATCH = 200


async def recompute_reports(db: AsyncSession, report_ids: list[str] | None = None) -> int:
    """Recompute the given reports (all when None), committing per batch. Returns how many
    review cases were opened or upgraded."""
    settings = await get_platform_settings(db)
    weights, thresholds = weights_of(settings), thresholds_of(settings)
    if report_ids is None:
        report_ids = list(await db.scalars(select(FactCheckReport.id).order_by(FactCheckReport.id)))

    cases = 0
    for start in range(0, len(report_ids), BATCH):
        batch = report_ids[start : start + BATCH]
        reports = await db.scalars(
            select(FactCheckReport)
            .where(FactCheckReport.id.in_(batch))
            .order_by(FactCheckReport.id)
            .with_for_update()
        )
        for report in reports:
            _, previous = await recompute_report_community(db, report, weights, thresholds)
            if await escalation.on_status_change(db, report, previous, settings):
                cases += 1
        await db.commit()
    return cases


async def set_ratings_excluded(db: AsyncSession, user_id: str, excluded: bool) -> list[str]:
    """Drop (or restore) all of a user's ratings; returns the affected report ids. The caller
    recomputes them (recompute_reports) and commits."""
    now = datetime.now(UTC)
    condition = Rating.excluded_at.is_(None) if excluded else Rating.excluded_at.is_not(None)
    rows = await db.execute(
        update(Rating)
        .where(Rating.user_id == user_id, condition)
        .values(excluded_at=now if excluded else None)
        .returning(Rating.report_id)
    )
    return sorted({r for (r,) in rows})
