from datetime import datetime

from pydantic import Field

from app.schemas.common import CamelModel, ReviewReason, Verdict


class ReviewCase(CamelModel):
    id: str
    report_id: str
    reason: ReviewReason
    flagged_at: datetime
    reports: int | None = None
    assignee: str | None = None
    priority: str  # normal | high
    sla_due_at: datetime | None = None
    sla_state: str | None = None  # overdue | due-soon | on-track


def dump_review_case(model: ReviewCase) -> dict:
    """openapi.yaml requires `assignee` (oneOf string/null) — an unassigned case must still
    show the key as explicit `null`, not omit it, matching apps/web/lib/mock/review.ts."""
    data = model.model_dump(by_alias=True, mode="json", exclude_none=True)
    data.setdefault("assignee", None)
    return data


class ReviewDecision(CamelModel):
    id: str
    case_id: str
    report_id: str
    title: str
    outcome: str  # confirmed | overridden
    # `from` is a Python keyword; alias the wire field back to it explicitly (an explicit
    # Field alias wins over the class's alias_generator).
    from_verdict: Verdict = Field(alias="from")
    to: Verdict
    justification: str
    reviewer: str
    decided_at: datetime
    turnaround_hours: float
