"""Expert review, user reports and manipulation signals (FR-REVIEW, FR-ADMIN moderation,
§9.2 escalation). ADR 0002 §2 and §4."""

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, created_at_column, in_check
from app.db.models.content import VERDICTS, VOTES

REVIEW_REASONS = ("community-escalation", "suspended", "user-reports", "low-confidence")


class ReviewCase(Base):
    """A report waiting for (or given) an expert decision. `sla_state` isn't stored — it
    depends on the current time, so it's computed when the case is read."""

    __tablename__ = "review_cases"
    __table_args__ = (
        CheckConstraint(in_check("reason", REVIEW_REASONS), name="reason"),
        CheckConstraint(in_check("priority", ("normal", "high")), name="priority"),
        CheckConstraint(in_check("status", ("open", "decided")), name="status"),
        # A report has at most one open case: a second trigger (say, escalated and then
        # suspended) updates the open case instead of queueing a duplicate.
        Index(
            "uq_review_cases_open_report",
            "report_id",
            unique=True,
            postgresql_where=text("status = 'open'"),
        ),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("fact_check_reports.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)
    flagged_at: Mapped[datetime] = created_at_column()
    # For `user-reports` cases: the moderation item whose reporters triggered it.
    content_report_id: Mapped[str | None] = mapped_column(ForeignKey("content_reports.id"))
    assignee_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), index=True)
    priority: Mapped[str] = mapped_column(Text, default="normal", server_default="normal")
    sla_due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(Text, default="open", server_default="open", index=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ReviewDecision(Base):
    __tablename__ = "review_decisions"
    __table_args__ = (
        CheckConstraint(in_check("outcome", ("confirmed", "overridden")), name="outcome"),
        CheckConstraint(in_check("from_verdict", VERDICTS), name="from_verdict"),
        CheckConstraint(in_check("to_verdict", VERDICTS), name="to_verdict"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("review_cases.id"), unique=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("fact_check_reports.id"), index=True)
    outcome: Mapped[str] = mapped_column(Text)
    from_verdict: Mapped[str] = mapped_column(Text)
    to_verdict: Mapped[str] = mapped_column(Text)
    justification: Mapped[str] = mapped_column(Text)
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    decided_at: Mapped[datetime] = created_at_column()
    turnaround_hours: Mapped[float] = mapped_column(Float)


class ContentReport(Base):
    """One moderation item per reported fact-check: the aggregate the admin Moderation screen
    lists (the contract's ContentReport). Individual reports are `content_flags` rows; the
    `reporters` count is read from them, never stored."""

    __tablename__ = "content_reports"
    __table_args__ = (
        CheckConstraint(
            f"resolution IS NULL OR {in_check('resolution', ('dismiss', 'remove'))}",
            name="resolution",
        ),
        Index(
            "uq_content_reports_open_report",
            "report_id",
            unique=True,
            postgresql_where=text("resolved_at IS NULL"),
        ),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("fact_check_reports.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)  # the first reporter's reason
    sample: Mapped[str] = mapped_column(Text, default="", server_default="")
    reported_at: Mapped[datetime] = created_at_column()
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolution: Mapped[str | None] = mapped_column(Text)
    resolved_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))


class ContentFlag(Base):
    """One user's "report an issue" on a fact-check (POST /fact-checks/{id}/report-issue)."""

    __tablename__ = "content_flags"
    __table_args__ = (UniqueConstraint("content_report_id", "user_id"),)

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    content_report_id: Mapped[str] = mapped_column(ForeignKey("content_reports.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)
    body: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = created_at_column()


class ManipulationSignal(Base):
    """Suspected coordinated rating (FR-ADMIN), written by the brigading detector job."""

    __tablename__ = "manipulation_signals"
    __table_args__ = (
        CheckConstraint(in_check("direction", VOTES), name="direction"),
        CheckConstraint("confidence BETWEEN 0 AND 1", name="confidence"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("fact_check_reports.id"), index=True)
    pattern: Mapped[str] = mapped_column(Text)
    accounts: Mapped[int] = mapped_column(Integer)
    window: Mapped[str] = mapped_column(Text)  # human phrase, e.g. "11 minutes"
    direction: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    detected_at: Mapped[datetime] = created_at_column()
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
