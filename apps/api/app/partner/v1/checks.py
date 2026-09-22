from fastapi import Body, Depends, Response

from app.core.errors import ApiError
from app.core.router import APIRouter
from app.core.security import PartnerPrincipal, rate_limit_headers, require_partner_key
from app.schemas.partner import PartnerCheckStatus
from app.schemas.submission import SubmissionAccepted
from app.stubs.fact_checks import SAMPLE_REPORTS, get_report_by_tracking_id
from app.stubs.fact_checks_public import to_public

router = APIRouter(tags=["partner"])


@router.post("/checks", response_model=SubmissionAccepted, status_code=202)
def partner_submit_check(
    response: Response,
    body: dict = Body(default={}),  # noqa: B008
    principal: PartnerPrincipal = Depends(require_partner_key),  # noqa: B008
):
    response.headers.update(rate_limit_headers(principal.key))
    if not body.get("type"):
        raise ApiError("bad_request", "type is required.")
    sample = SAMPLE_REPORTS[0]
    return SubmissionAccepted(
        tracking_id=sample.tracking_id,
        status="queued",
        estimated_seconds=10,
        status_url=f"https://api.zuula.ug/v1/checks/{sample.tracking_id}",
    )


@router.get("/checks/{tracking_id}", response_model=None)
def partner_get_check_status(
    tracking_id: str,
    response: Response,
    principal: PartnerPrincipal = Depends(require_partner_key),  # noqa: B008
):
    response.headers.update(rate_limit_headers(principal.key))
    report = get_report_by_tracking_id(tracking_id)
    if report is None:
        raise ApiError("not_found", f"No check with tracking id '{tracking_id}'.")
    status = PartnerCheckStatus(
        tracking_id=tracking_id,
        status="completed",
        submitted_at=report.checked_at,
        completed_at=report.checked_at,
        result=to_public(report),
    )
    data = status.model_dump(by_alias=True, mode="json", exclude_none=True)
    if "result" in data:
        data["result"].setdefault("humanReview", None)
    return data
