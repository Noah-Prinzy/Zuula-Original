"""Partner API: fact-check lookup and search (FR-API-01), from the database. Suspended
reports are excluded from search, like everywhere else."""

from fastapi import Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.fact_checks import CHECKED_ON, get_report_row, parse_date, text_match
from app.core.router import APIRouter
from app.core.security import PartnerPrincipal, require_partner_key
from app.db.models import FactCheckReport
from app.db.session import get_db
from app.schemas.common import Verdict
from app.schemas.fact_check import dump_report
from app.schemas.partner import PartnerSearchResponse
from app.services import reports as rep

router = APIRouter(prefix="/fact-checks", tags=["partner"])


@router.get("/{id}", response_model=None)
async def partner_get_fact_check(
    id: str,  # noqa: A002
    response: Response,
    principal: PartnerPrincipal = Depends(require_partner_key),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    response.headers.update(principal.rate_limit_headers)
    return dump_report(await rep.public_report(db, await get_report_row(db, id)))


@router.get("", response_model=PartnerSearchResponse)
async def partner_search_fact_checks(
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
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    response.headers.update(principal.rate_limit_headers)
    conditions = [rep.LISTED]
    if q.strip():
        conditions.append(text_match(q.strip()))
    if verdict:
        conditions.append(FactCheckReport.verdict == verdict)
    if category:
        conditions.append(FactCheckReport.category == category)
    if language:
        conditions.append(FactCheckReport.language == language)
    if (start := parse_date(from_, "from")) is not None:
        conditions.append(start <= CHECKED_ON)
    if (end := parse_date(to, "to")) is not None:
        conditions.append(end >= CHECKED_ON)

    total = (
        await db.execute(select(func.count()).select_from(FactCheckReport).where(*conditions))
    ).scalar_one()
    rows = await db.scalars(
        select(FactCheckReport)
        .where(*conditions)
        .order_by(FactCheckReport.checked_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    return PartnerSearchResponse(
        data=[rep.search_item_of(r) for r in rows], page=page, per_page=per_page, total=total
    )
