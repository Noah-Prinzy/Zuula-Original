"""Weighted Community Confidence Score and escalation status (§9.1, §9.2, FR-RATE-03).

A line-for-line port of apps/web/lib/community.ts — the two must agree. Weights and thresholds
are parameters (defaulting to app/core/rules.py) because admins can change the live values
(FR-ADMIN-06, the `platform_settings` row).

`recompute_report_community()` is the one writer of a report's denormalized community columns:
it re-counts from `ratings` rather than incrementing, so the counts can't drift from the votes
(ADR 0002 §4). Callers hold the report row lock (`SELECT … FOR UPDATE`) when voting.
"""

from collections.abc import Mapping
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rules import CCS_STATUS_THRESHOLDS, CCS_WEIGHTS
from app.db.models import FactCheckReport, Rating
from app.schemas.fact_check import CommunityScore, RatingCounts

Weights = Mapping[str, int]
Thresholds = Mapping[str, Mapping[str, int]]


def _sum(c: RatingCounts) -> int:
    return c.public + c.journalist + c.expert


def _weighted(c: RatingCounts, weights: Weights) -> float:
    return (
        c.public * weights["public"]
        + c.journalist * weights["journalist"]
        + c.expert * weights["expert"]
    )


def status_for(
    ccs: float | None, total: int, thresholds: Thresholds = CCS_STATUS_THRESHOLDS
) -> str:
    if ccs is None:
        return "standard"
    t = thresholds
    if ccs <= t["suspended"]["max_score"] and total > t["suspended"]["min_ratings"]:
        return "suspended"
    if ccs <= t["escalated"]["max_score"] and total > t["escalated"]["min_ratings"]:
        return "escalated"
    if (
        t["questioned"]["min_score"] <= ccs <= t["questioned"]["max_score"]
        and total > t["questioned"]["min_ratings"]
    ):
        return "questioned"
    if ccs >= t["verified"]["min_score"]:
        return "verified"
    return "standard"


def community_score(
    accurate: RatingCounts,
    inaccurate: RatingCounts,
    weights: Weights = CCS_WEIGHTS,
    thresholds: Thresholds = CCS_STATUS_THRESHOLDS,
) -> CommunityScore:
    wa = _weighted(accurate, weights)
    wi = _weighted(inaccurate, weights)
    accurate_count = _sum(accurate)
    inaccurate_count = _sum(inaccurate)
    total = accurate_count + inaccurate_count
    ccs = round((wa / (wa + wi)) * 100) if wa + wi > 0 else None
    return CommunityScore(
        ccs=ccs,
        weighted_accurate=wa,
        weighted_inaccurate=wi,
        accurate_count=accurate_count,
        inaccurate_count=inaccurate_count,
        total=total,
        status=status_for(ccs, total, thresholds),
    )


def report_counts(report: FactCheckReport) -> tuple[RatingCounts, RatingCounts]:
    """(accurate, inaccurate) from a FactCheckReport row's denormalized columns."""
    return (
        RatingCounts(
            public=report.accurate_public,
            journalist=report.accurate_journalist,
            expert=report.accurate_expert,
        ),
        RatingCounts(
            public=report.inaccurate_public,
            journalist=report.inaccurate_journalist,
            expert=report.inaccurate_expert,
        ),
    )


async def recompute_report_community(
    session: AsyncSession,
    report: FactCheckReport,
    weights: Weights = CCS_WEIGHTS,
    thresholds: Thresholds = CCS_STATUS_THRESHOLDS,
) -> tuple[CommunityScore, str | None]:
    """Re-count `report`'s ratings, store counts/ccs/status on it, and return the new score
    plus the previous status if it changed (None otherwise) — escalation hooks key off that.
    Excluded ratings (an admin dropped a suspended user's votes) don't count."""
    rows = await session.execute(
        select(Rating.vote, Rating.rater_role, func.count())
        .where(Rating.report_id == report.id, Rating.excluded_at.is_(None))
        .group_by(Rating.vote, Rating.rater_role)
    )
    counts = {("accurate", r): 0 for r in ("public", "journalist", "expert")}
    counts |= {("inaccurate", r): 0 for r in ("public", "journalist", "expert")}
    for vote, role, n in rows:
        counts[(vote, role)] = n

    for (vote, role), n in counts.items():
        setattr(report, f"{vote}_{role}", n)

    accurate, inaccurate = report_counts(report)
    score = community_score(accurate, inaccurate, weights, thresholds)
    previous = report.community_status
    report.ccs = score.ccs
    report.community_status = score.status
    changed = previous if previous != score.status else None
    if changed is not None:
        report.status_changed_at = datetime.now(UTC)
    return score, changed
