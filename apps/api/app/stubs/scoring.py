"""Mirrors apps/web/lib/community.ts exactly (weights, CCS formula, status thresholds) so stub
data shows realistic scores. P3 moves this server-side for real; P2 just needs it consistent."""

from app.schemas.fact_check import CommunityScore, RatingCounts

RATING_WEIGHTS = {"public": 1, "journalist": 2, "expert": 5}

CCS_THRESHOLDS = {
    "verified": {"min_score": 90},
    "questioned": {"min_score": 40, "max_score": 69, "min_ratings": 50},
    "escalated": {"max_score": 39, "min_ratings": 100},
    "suspended": {"max_score": 19, "min_ratings": 200},
}


def _sum(c: RatingCounts) -> int:
    return c.public + c.journalist + c.expert


def _weighted(c: RatingCounts) -> float:
    return c.public * RATING_WEIGHTS["public"] + c.journalist * RATING_WEIGHTS["journalist"] + c.expert * RATING_WEIGHTS["expert"]


def status_for(ccs: float | None, total: int) -> str:
    if ccs is None:
        return "standard"
    t = CCS_THRESHOLDS
    if ccs <= t["suspended"]["max_score"] and total > t["suspended"]["min_ratings"]:
        return "suspended"
    if ccs <= t["escalated"]["max_score"] and total > t["escalated"]["min_ratings"]:
        return "escalated"
    if t["questioned"]["min_score"] <= ccs <= t["questioned"]["max_score"] and total > t["questioned"]["min_ratings"]:
        return "questioned"
    if ccs >= t["verified"]["min_score"]:
        return "verified"
    return "standard"


def community_score(accurate: RatingCounts, inaccurate: RatingCounts) -> CommunityScore:
    wa = _weighted(accurate)
    wi = _weighted(inaccurate)
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
        status=status_for(ccs, total),
    )
