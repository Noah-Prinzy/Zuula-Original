"""Builds the trimmed partner-facing shape, matching the `factCheck()` helper in
apps/web/components/developers/examples.ts field-for-field: no submittedText, no
annotations, no rating comments — only aggregate community counts."""

from app.schemas.fact_check import (
    FactCheckPublic,
    FactCheckReport,
    FactCheckSearchItem,
    PublicCommunityCounts,
)

BASE_URL = "https://zuula.ug"


def to_public(r: FactCheckReport) -> FactCheckPublic:
    return FactCheckPublic(
        id=r.id,
        tracking_id=r.tracking_id,
        url=f"{BASE_URL}/fact-checks/{r.id}",
        title=r.title,
        content_type=r.content_type,
        language=r.language,
        category=r.category,
        verdict=r.verdict,
        confidence=r.confidence,
        summary=r.summary,
        what_is_false=r.what_is_false,
        what_is_true=r.what_is_true,
        claims=r.claims,
        citations=r.citations,
        ai_signals=r.ai_signals,
        community=PublicCommunityCounts(accurate=r.community.accurate, inaccurate=r.community.inaccurate),
        human_review=r.human_review,
        checked_at=r.checked_at,
        processing_seconds=r.processing_seconds,
    )


def to_search_item(r: FactCheckReport) -> FactCheckSearchItem:
    return FactCheckSearchItem(
        id=r.id,
        tracking_id=r.tracking_id,
        url=f"{BASE_URL}/fact-checks/{r.id}",
        title=r.title,
        verdict=r.verdict,
        confidence=r.confidence,
        summary=r.summary,
        category=r.category,
        language=r.language,
        checked_at=r.checked_at,
    )
