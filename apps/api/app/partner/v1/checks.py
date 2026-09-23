"""Partner API: submit a check and follow it (FR-API-01). Same submission path as the
website, attributed to the partner's key."""

from fastapi import Body, Depends, Header, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.submissions import enqueue_submission
from app.core.errors import ApiError
from app.core.router import APIRouter
from app.core.security import PartnerPrincipal, require_partner_key
from app.db.models import Submission
from app.db.session import get_db
from app.schemas.submission import SubmissionAccepted
from app.services import submissions as svc

router = APIRouter(tags=["partner"])

PARTNER_BASE_URL = "https://api.zuula.ug"


@router.post("/checks", response_model=SubmissionAccepted, status_code=202)
async def partner_submit_check(
    response: Response,
    body: dict = Body(default={}),  # noqa: B008
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    principal: PartnerPrincipal = Depends(require_partner_key),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    response.headers.update(principal.rate_limit_headers)
    fields = svc.validate_input(body)
    submission = await enqueue_submission(
        db,
        fields=fields,
        channel="partner",
        api_key_id=principal.key_id,
        idempotency_key=idempotency_key,
    )
    return svc.accepted(
        submission, status_url=f"{PARTNER_BASE_URL}/v1/checks/{submission.tracking_id}"
    )


@router.get("/checks/{tracking_id}", response_model=None)
async def partner_get_check_status(
    tracking_id: str,
    response: Response,
    principal: PartnerPrincipal = Depends(require_partner_key),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    response.headers.update(principal.rate_limit_headers)
    submission = await db.get(Submission, tracking_id)
    # A partner sees its own checks at every stage, and anyone's once it has a published
    # report (reports are public). Someone else's in-flight submission stays private.
    visible = submission is not None and (
        submission.api_key_id == principal.key_id
        or await svc.report_for(db, tracking_id) is not None
    )
    if not visible:
        raise ApiError("not_found", f"No check with tracking id '{tracking_id}'.")
    return await svc.status_of(db, submission, public=True)
