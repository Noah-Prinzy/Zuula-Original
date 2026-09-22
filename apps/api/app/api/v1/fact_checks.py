import math
from datetime import UTC, datetime

from fastapi import Depends, Query

from app.core.errors import ApiError
from app.core.pagination import PageParams, page_params, paginate
from app.core.router import APIRouter
from app.schemas.common import ContentType, Verdict
from app.schemas.fact_check import FactCheckReport, FactCheckSummary, dump_report
from app.stubs.fact_checks import SAMPLE_REPORTS, get_report

router = APIRouter(prefix="/fact-checks", tags=["fact-checks"])


def _is_listed(r: FactCheckReport) -> bool:
    # FR-SEARCH: suspended verdicts are hidden from search until reviewed (§9.2).
    return r.community.score.status != "suspended"


def _summary(r: FactCheckReport) -> FactCheckSummary:
    return FactCheckSummary(
        id=r.id,
        tracking_id=r.tracking_id,
        title=r.title,
        content_type=r.content_type,
        language=r.language,
        verdict=r.verdict,
        confidence=r.confidence,
        summary=r.summary,
        category=r.category,
        checked_at=r.checked_at,
        score=r.community.score,
    )


def _matches(r: FactCheckReport, q: str) -> bool:
    if not q:
        return True
    hay = f"{r.title} {r.summary} {r.category} {r.language} {r.submitted_text}".lower()
    return all(word in hay for word in q.lower().split())


def _age_days(checked_at: datetime, now: datetime) -> float:
    return max(0.0, (now - checked_at).total_seconds() / 86_400)


def _rank(r: FactCheckReport, now: datetime) -> float:
    ccs = r.community.score.ccs if r.community.score.ccs is not None else 50
    recency = math.exp(-_age_days(r.checked_at, now) / 14)
    return 0.6 * (ccs / 100) + 0.4 * recency


@router.get("", response_model=None)
def search_fact_checks(
    q: str = "",
    verdict: str = Query("", description="Comma-separated Verdict values"),
    category: str | None = None,
    language: str | None = None,
    type: ContentType | None = None,  # noqa: A002 — matches the contract's query param name
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    sort: str = Query("relevance", pattern="^(relevance|newest|most-rated)$"),
    params: PageParams = Depends(page_params),  # noqa: B008
):
    verdicts: list[Verdict] = [v for v in verdict.split(",") if v]  # type: ignore[assignment]
    now = datetime.now(UTC)

    results = [
        r
        for r in SAMPLE_REPORTS
        if _is_listed(r)
        and _matches(r, q)
        and (not verdicts or r.verdict in verdicts)
        and (not category or r.category == category)
        and (not language or r.language == language)
        and (not type or r.content_type == type)
        and (not from_ or r.checked_at.date().isoformat() >= from_)
        and (not to or r.checked_at.date().isoformat() <= to)
    ]

    if sort == "newest":
        results.sort(key=lambda r: r.checked_at, reverse=True)
    elif sort == "most-rated":
        results.sort(key=lambda r: r.community.score.total, reverse=True)
    else:
        results.sort(key=lambda r: _rank(r, now), reverse=True)

    page_reports, meta = paginate(results, params)
    summaries = [
        _summary(r).model_dump(by_alias=True, mode="json", exclude_none=True) for r in page_reports
    ]
    return {"data": summaries, **meta}


@router.get("/facets", response_model=None)
def get_facets():
    listed = [r for r in SAMPLE_REPORTS if _is_listed(r)]
    return {
        "categories": sorted({r.category for r in listed}),
        "languages": sorted({r.language for r in listed}),
    }


@router.get("/home-feed", response_model=None)
def get_home_feed():
    now = datetime.now(UTC)
    listed = [r for r in SAMPLE_REPORTS if _is_listed(r)]

    recent = sorted(listed, key=lambda r: r.checked_at, reverse=True)[:5]

    def debate_score(r: FactCheckReport) -> float:
        s = r.community.score
        if s.ccs is None:
            return 0
        return s.total * (1 - abs(s.ccs - 50) / 50)

    recent_ids = {r.id for r in recent}
    debated = [
        r
        for r in sorted(listed, key=debate_score, reverse=True)
        if r.id not in recent_ids
    ][:3]

    leaderboard_candidates = [
        r for r in listed if r.community.score.total >= 25 and r.community.score.ccs is not None
    ]
    leaderboard_candidates.sort(
        key=lambda r: (r.community.score.ccs, r.community.score.total), reverse=True
    )

    trending: dict[str, int] = {}
    for r in listed:
        if _age_days(r.checked_at, now) <= 7:
            trending[r.category] = trending.get(r.category, 0) + 1
    trending_list = sorted(trending.items(), key=lambda kv: (-kv[1], kv[0]))[:6]

    return {
        "recent": [
            _summary(r).model_dump(by_alias=True, mode="json", exclude_none=True) for r in recent
        ],
        "debated": [
            _summary(r).model_dump(by_alias=True, mode="json", exclude_none=True) for r in debated
        ],
        "trending": [{"category": c, "count": n} for c, n in trending_list],
        "leaderboard": [
            {
                "report": _summary(r).model_dump(by_alias=True, mode="json", exclude_none=True),
                "score": r.community.score.model_dump(
                    by_alias=True, mode="json", exclude_none=True
                ),
            }
            for r in leaderboard_candidates[:5]
        ],
    }


@router.get("/{id}", response_model=None)
def get_fact_check(id: str):  # noqa: A002
    report = get_report(id)
    if report is None:
        raise ApiError("not_found", f"No fact-check with id '{id}'.")
    return dump_report(report)


@router.get("/{id}/related", response_model=list[FactCheckSummary])
def get_related(id: str, limit: int = Query(3, le=10)):  # noqa: A002
    report = get_report(id)
    if report is None:
        raise ApiError("not_found", f"No fact-check with id '{id}'.")

    words = {w for w in report.title.lower().split() if len(w) > 2}
    scored = []
    for r in SAMPLE_REPORTS:
        if r.id == id or not _is_listed(r):
            continue
        same_topic = r.category == report.category
        shared = len(words & {w for w in r.title.lower().split() if len(w) > 2})
        if same_topic or shared > 0:
            scored.append((3 * same_topic + shared, r))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [_summary(r) for _, r in scored[:limit]]
