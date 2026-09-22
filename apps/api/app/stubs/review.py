"""Transliterated from apps/web/lib/mock/review.ts."""

from datetime import UTC, datetime, timedelta

from app.schemas.review import ReviewCase, ReviewDecision

REVIEW_SLA_HOURS = 48
REVIEW_NOW = datetime(2026, 9, 21, 9, 0, tzinfo=UTC)  # 12:00 EAT

REASON_META = {
    "community-escalation": {
        "label": "Community escalation",
        "description": "Fewer than 40% of over 100 ratings agree with the verdict (§9.2).",
    },
    "suspended": {
        "label": "Suspended",
        "description": "Fewer than 20% of over 200 ratings agree. The verdict is hidden until reviewed.",
    },
    "user-reports": {"label": "User reports", "description": "Readers reported a problem with this verdict."},
    "low-confidence": {"label": "Low AI confidence", "description": "The AI was less than 60% confident."},
}

_RAW_CASES = [
    {"id": "rc-0418", "report_id": "fc-2026-0152", "reason": "suspended", "flagged_at": "2026-09-19T06:00:00+00:00", "assignee": None, "priority": "high"},
    {"id": "rc-0417", "report_id": "fc-2026-0155", "reason": "community-escalation", "flagged_at": "2026-09-19T17:30:00+00:00", "assignee": "David Okello", "priority": "high"},
    {"id": "rc-0416", "report_id": "fc-2026-0158", "reason": "low-confidence", "flagged_at": "2026-09-20T12:10:00+00:00", "assignee": None, "priority": "normal"},
    {"id": "rc-0415", "report_id": "fc-2026-0159", "reason": "user-reports", "flagged_at": "2026-09-21T03:45:00+00:00", "reports": 14, "assignee": "Esther Atim", "priority": "normal"},
    {"id": "rc-0414", "report_id": "fc-2026-0157", "reason": "user-reports", "flagged_at": "2026-09-21T06:20:00+00:00", "reports": 6, "assignee": None, "priority": "normal"},
]


def _sla(flagged_at: str) -> tuple[datetime, str]:
    due = datetime.fromisoformat(flagged_at) + timedelta(hours=REVIEW_SLA_HOURS)
    hours_left = (due - REVIEW_NOW).total_seconds() / 3600
    state = "overdue" if hours_left < 0 else "due-soon" if hours_left < 12 else "on-track"
    return due, state


def _build_case(raw: dict) -> ReviewCase:
    due, state = _sla(raw["flagged_at"])
    return ReviewCase(
        id=raw["id"],
        report_id=raw["report_id"],
        reason=raw["reason"],
        flagged_at=raw["flagged_at"],
        reports=raw.get("reports"),
        assignee=raw.get("assignee"),
        priority=raw["priority"],
        sla_due_at=due,
        sla_state=state,
    )


SAMPLE_CASES: list[ReviewCase] = [_build_case(r) for r in _RAW_CASES]
_BY_ID = {c.id: c for c in SAMPLE_CASES}


def get_case(case_id: str) -> ReviewCase | None:
    return _BY_ID.get(case_id)


SAMPLE_DECISIONS: list[ReviewDecision] = [
    ReviewDecision(
        id="d-0412",
        case_id="rc-0412",
        report_id="fc-2026-0142",
        title="“Free unlimited internet for every Ugandan from January 2027”",
        outcome="confirmed",
        **{"from": "false"},
        to="false",
        justification="Verified with the Ministry's communications office. No such programme exists.",
        reviewer="David Okello",
        decided_at="2026-09-19T11:20:00+00:00",
        turnaround_hours=6.5,
    ),
    ReviewDecision(
        id="d-0409",
        case_id="rc-0409",
        report_id="fc-2026-0154",
        title="Photo of record water levels at a lakeside landing site",
        outcome="overridden",
        **{"from": "false"},
        to="likely-false",
        justification="The photo is genuine but from 2020, so “False” overstated it. Recycled media fits “Likely False” with a context note.",
        reviewer="David Okello",
        decided_at="2026-09-17T15:05:00+00:00",
        turnaround_hours=21,
    ),
    ReviewDecision(
        id="d-0403",
        case_id="rc-0403",
        report_id="fc-2026-0151",
        title="Cholera vaccination campaign announced for border districts",
        outcome="confirmed",
        **{"from": "authentic"},
        to="authentic",
        justification="Dates and districts match the Ministry of Health announcement.",
        reviewer="David Okello",
        decided_at="2026-09-14T08:40:00+00:00",
        turnaround_hours=3.2,
    ),
    ReviewDecision(
        id="d-0398",
        case_id="rc-0398",
        report_id="fc-2026-0153",
        title="Free mobile data offer circulating on social media",
        outcome="confirmed",
        **{"from": "false"},
        to="false",
        justification="Domain registered two days before the campaign and not owned by the operator.",
        reviewer="David Okello",
        decided_at="2026-09-12T06:15:00+00:00",
        turnaround_hours=30,
    ),
]
