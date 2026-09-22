from fastapi import Body, Depends

from app.core.errors import ApiError
from app.core.pagination import PageParams, page_params, paginate
from app.core.router import APIRouter
from app.core.security import require_roles
from app.schemas.account import UserProfile
from app.schemas.fact_check import CommunityScore, RatingComment
from app.stubs.fact_checks import get_report

router = APIRouter(prefix="/fact-checks", tags=["ratings"])

_signed_in = require_roles()


@router.post("/{id}/ratings", response_model=CommunityScore)
def rate_fact_check(id: str, body: dict = Body(...), user: UserProfile = Depends(_signed_in)):  # noqa: A002, B008
    report = get_report(id)
    if report is None:
        raise ApiError("not_found", f"No fact-check with id '{id}'.")
    if body.get("vote") not in ("accurate", "inaccurate"):
        raise ApiError("bad_request", "vote must be 'accurate' or 'inaccurate'.")
    # P2 stub: doesn't mutate stored counts (no DB yet) — just echoes the current score.
    return report.community.score


@router.delete("/{id}/ratings", response_model=CommunityScore)
def retract_rating(id: str, user: UserProfile = Depends(_signed_in)):  # noqa: A002, B008
    report = get_report(id)
    if report is None:
        raise ApiError("not_found", f"No fact-check with id '{id}'.")
    return report.community.score


@router.get("/{id}/comments", response_model=None)
def list_comments(id: str, params: PageParams = Depends(page_params)):  # noqa: A002, B008
    report = get_report(id)
    if report is None:
        raise ApiError("not_found", f"No fact-check with id '{id}'.")
    items, meta = paginate(report.community.comments, params)
    return {
        "data": [c.model_dump(by_alias=True, mode="json", exclude_none=True) for c in items],
        **meta,
    }


@router.post("/{id}/comments", response_model=RatingComment, status_code=201)
def add_comment(id: str, body: dict = Body(...), user: UserProfile = Depends(_signed_in)):  # noqa: A002, B008
    report = get_report(id)
    if report is None:
        raise ApiError("not_found", f"No fact-check with id '{id}'.")
    vote = body.get("vote")
    text = body.get("body")
    if vote not in ("accurate", "inaccurate") or not text:
        raise ApiError("bad_request", "vote and body are required.")
    return RatingComment(
        id="r-new",
        author=user.name,
        # Admins rate as standard users (§9.1).
        role="public" if user.role == "admin" else user.role,
        vote=vote,
        body=text,
        created_at="2026-09-22T00:00:00+03:00",
    )


@router.post("/{id}/report-issue", status_code=202)
def report_issue(id: str, body: dict = Body(...), user: UserProfile = Depends(_signed_in)):  # noqa: A002, B008
    if not body.get("reason"):
        raise ApiError("bad_request", "reason is required.")
    return {}
