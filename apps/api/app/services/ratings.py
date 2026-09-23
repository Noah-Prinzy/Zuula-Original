"""Casting and retracting community ratings (FR-RATE-01…03, §9.1/§9.2). ADR 0002 §4.

One vote per person per report. Every write locks the report row, changes the vote,
recomputes the report's counts/CCS/status from the `ratings` table, and — if the status
*entered* escalated or suspended — opens (or upgrades) its review case, all in one
transaction. Two people voting at once serialise on the row lock, so neither recompute can
miss the other's vote.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rules
from app.core.errors import ApiError
from app.db.models import FactCheckReport, Rating
from app.schemas.account import UserProfile
from app.schemas.fact_check import CommunityScore
from app.services import escalation
from app.services.community import recompute_report_community
from app.services.platform_settings import get_platform_settings, thresholds_of, weights_of
from app.services.reports import score_of


def rater_role(user: UserProfile) -> str:
    """§9.1: admins rate at the public weight."""
    return rules.ADMIN_RATER_ROLE if user.role == "admin" else user.role


async def lock_report(db: AsyncSession, report_id: str) -> FactCheckReport:
    report = (
        await db.scalars(
            select(FactCheckReport).where(FactCheckReport.id == report_id).with_for_update()
        )
    ).first()
    if report is None:
        raise ApiError("not_found", f"No fact-check with id '{report_id}'.")
    return report


async def set_vote(
    db: AsyncSession, report: FactCheckReport, user: UserProfile, vote: str | None
) -> CommunityScore:
    """Cast, change (`vote`) or retract (`None`) the user's vote on a locked report, then
    recompute and escalate. The caller commits."""
    rating = await db.get(Rating, (report.id, user.id))
    now = datetime.now(UTC)
    if vote is None:
        if rating is not None:
            await db.delete(rating)
    elif rating is None:
        db.add(
            Rating(
                report_id=report.id,
                user_id=user.id,
                vote=vote,
                rater_role=rater_role(user),
                created_at=now,
                updated_at=now,
            )
        )
    elif rating.vote != vote:
        # A changed vote is a new vote: weighted by the role the user has *now* (decision 6a
        # is "the role when they voted"). An admin's exclusion of the user's ratings stays.
        rating.vote = vote
        rating.rater_role = rater_role(user)
        rating.updated_at = now
    await db.flush()

    settings = await get_platform_settings(db)
    _, previous = await recompute_report_community(
        db, report, weights_of(settings), thresholds_of(settings)
    )
    await escalation.on_status_change(db, report, previous, settings)
    return score_of(report, settings)
