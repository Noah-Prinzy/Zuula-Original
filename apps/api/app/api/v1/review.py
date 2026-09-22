from fastapi import Body, Depends

from app.core.errors import ApiError
from app.core.pagination import PageParams, page_params, paginate
from app.core.router import APIRouter
from app.core.security import require_roles
from app.schemas.account import UserProfile
from app.schemas.fact_check import dump_report
from app.schemas.review import ReviewCase, ReviewDecision, dump_review_case
from app.stubs.fact_checks import get_report
from app.stubs.review import SAMPLE_CASES, SAMPLE_DECISIONS, get_case

router = APIRouter(prefix="/review", tags=["review"])

# FR-REVIEW: Expert, Admin only.
_reviewer = require_roles("expert", "admin")


@router.get("/overview")
def get_review_overview(user: UserProfile = Depends(_reviewer)):  # noqa: B008
    overdue = sum(1 for c in SAMPLE_CASES if c.sla_state == "overdue")
    due_soon = sum(1 for c in SAMPLE_CASES if c.sla_state == "due-soon")
    return {
        "queueSize": len(SAMPLE_CASES),
        "overdue": overdue,
        "dueSoon": due_soon,
        "recentDecisions": [
            d.model_dump(by_alias=True, mode="json", exclude_none=True)
            for d in SAMPLE_DECISIONS[:5]
        ],
    }


@router.get("/queue", response_model=None)
def get_review_queue(
    reason: str | None = None,
    assignee: str | None = None,
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_reviewer),  # noqa: B008
):
    cases: list[ReviewCase] = SAMPLE_CASES
    if reason:
        cases = [c for c in cases if c.reason == reason]
    if assignee == "unassigned":
        cases = [c for c in cases if c.assignee is None]
    elif assignee == "me":
        cases = [c for c in cases if c.assignee == user.name]
    elif assignee:
        cases = [c for c in cases if c.assignee == assignee]

    items, meta = paginate(cases, params)
    return {"data": [dump_review_case(c) for c in items], **meta}


@router.get("/cases/{id}", response_model=None)
def get_review_case(id: str, user: UserProfile = Depends(_reviewer)):  # noqa: A002, B008
    found = get_case(id)
    if found is None:
        raise ApiError("not_found", f"No review case '{id}'.")
    case = found
    report = get_report(case.report_id)
    return {
        "case": dump_review_case(case),
        "report": dump_report(report) if report else None,
    }


@router.post("/cases/{id}/assign", response_model=None)
def assign_case(id: str, body: dict = Body(...), user: UserProfile = Depends(_reviewer)):  # noqa: A002, B008
    case = get_case(id)
    if case is None:
        raise ApiError("not_found", f"No review case '{id}'.")
    assignee_id = body.get("assigneeId")
    return dump_review_case(case.model_copy(update={"assignee": assignee_id or user.name}))


@router.post("/cases/{id}/decision", response_model=ReviewDecision)
def decide_case(id: str, body: dict = Body(...), user: UserProfile = Depends(_reviewer)):  # noqa: A002, B008
    case = get_case(id)
    if case is None:
        raise ApiError("not_found", f"No review case '{id}'.")
    report = get_report(case.report_id)
    if report is None:
        raise ApiError("not_found", f"No report for case '{id}'.")

    outcome = body.get("outcome")
    justification = body.get("justification", "")
    if outcome not in ("confirmed", "overridden") or len(justification) < 10:
        raise ApiError(
            "bad_request", "outcome and a justification of at least 10 characters are required."
        )
    verdict = body.get("verdict") if outcome == "overridden" else report.verdict
    if outcome == "overridden" and not verdict:
        raise ApiError("bad_request", "verdict is required when outcome is 'overridden'.")

    return ReviewDecision(
        id=f"d-{id}",
        case_id=id,
        report_id=report.id,
        title=report.title,
        outcome=outcome,
        **{"from": report.verdict},
        to=verdict,
        justification=justification,
        reviewer=user.name,
        decided_at="2026-09-22T00:00:00+03:00",
        turnaround_hours=1.0,
    )


@router.get("/history", response_model=None)
def get_review_history(
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_reviewer),  # noqa: B008
):
    decisions = [d for d in SAMPLE_DECISIONS if d.reviewer == user.name] or SAMPLE_DECISIONS
    items, meta = paginate(decisions, params)
    return {
        "data": [d.model_dump(by_alias=True, mode="json", exclude_none=True) for d in items],
        **meta,
    }
