from fastapi import Depends, Query, Response

from app.core.errors import ApiError
from app.core.router import APIRouter
from app.core.security import PartnerPrincipal, require_partner_key
from app.schemas.common import Verdict
from app.schemas.fact_check import dump_report
from app.schemas.partner import PartnerSearchResponse
from app.stubs.fact_checks import SAMPLE_REPORTS, get_report
from app.stubs.fact_checks_public import to_public, to_search_item

router = APIRouter(prefix="/fact-checks", tags=["partner"])


@router.get("/{id}", response_model=None)
def partner_get_fact_check(
    id: str,  # noqa: A002
    response: Response,
    principal: PartnerPrincipal = Depends(require_partner_key),  # noqa: B008
):
    response.headers.update(principal.rate_limit_headers)
    report = get_report(id)
    if report is None:
        raise ApiError("not_found", f"No fact-check with id '{id}'.")
    return dump_report(to_public(report))


@router.get("", response_model=PartnerSearchResponse)
def partner_search_fact_checks(
    response: Response,
    principal: PartnerPrincipal = Depends(require_partner_key),  # noqa: B008
    q: str = "",
    verdict: Verdict | None = None,
    category: str | None = None,
    language: str | None = None,
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50, alias="perPage"),
):
    response.headers.update(principal.rate_limit_headers)

    results = [
        r
        for r in SAMPLE_REPORTS
        if r.community.score.status != "suspended"
        and (not q or q.lower() in f"{r.title} {r.summary}".lower())
        and (not verdict or r.verdict == verdict)
        and (not category or r.category == category)
        and (not language or r.language == language)
        and (not from_ or r.checked_at.date().isoformat() >= from_)
        and (not to or r.checked_at.date().isoformat() <= to)
    ]
    total = len(results)
    start = (page - 1) * per_page
    page_items = results[start : start + per_page]

    return PartnerSearchResponse(
        data=[to_search_item(r) for r in page_items], page=page, per_page=per_page, total=total
    )
