from datetime import datetime

from pydantic import Field

from app.schemas.common import CamelModel, ErrorEnvelope, Verdict
from app.schemas.fact_check import FactCheckReport


class SubmissionAccepted(CamelModel):
    tracking_id: str
    status: str = "queued"
    estimated_seconds: int
    status_url: str


class SubmissionStepEvent(CamelModel):
    step: str
    status: str  # active | done
    seconds: float | None = None


class SubmissionStatusResponse(CamelModel):
    tracking_id: str
    status: str  # queued | processing | completed | failed
    submitted_at: datetime
    completed_at: datetime | None = None
    steps: list[SubmissionStepEvent] = Field(default_factory=list)
    result: FactCheckReport | None = None
    error: ErrorEnvelope | None = None


class ActivitySubmission(CamelModel):
    tracking_id: str
    type: str
    preview: str
    submitted_at: datetime
    status: str  # processing | complete | failed
    verdict: Verdict | None = None
    report_id: str | None = None


class ActivityRating(CamelModel):
    report_id: str
    title: str
    verdict: Verdict
    vote: str
    comment: str | None = None
    rated_at: datetime
