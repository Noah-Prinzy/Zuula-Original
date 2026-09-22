"""Transliterated from apps/web/lib/mock/account.ts."""

from app.schemas.account import ApiKey, DeviceSession
from app.schemas.submission import ActivityRating, ActivitySubmission

API_RATE_LIMIT = 100

SAMPLE_SUBMISSIONS: list[ActivitySubmission] = [
    ActivitySubmission(
        tracking_id="ZL-7K3P-Q9",
        type="text",
        preview="BREAKING: The Ministry of ICT has announced that every Ugandan will get free unlimited internet…",
        submitted_at="2026-09-21T10:41:00+03:00",
        status="complete",
        verdict="false",
        report_id="fc-2026-0142",
    ),
    ActivitySubmission(
        tracking_id="ZL-2M8D-R4",
        type="media",
        preview="expressway-flood.jpg",
        submitted_at="2026-09-20T07:55:00+03:00",
        status="complete",
        verdict="ai-generated",
        report_id="fc-2026-0157",
    ),
    ActivitySubmission(
        tracking_id="ZL-FA7L-D2",
        type="url",
        preview="https://example.com/fail-demo",
        submitted_at="2026-09-19T16:20:00+03:00",
        status="failed",
    ),
]

SAMPLE_RATINGS: list[ActivityRating] = [
    ActivityRating(
        report_id="fc-2026-0161",
        title="“Boiled banana leaves cure malaria in three days”",
        verdict="false",
        vote="accurate",
        comment="My clinic sees patients who tried this first. Please share the correct advice.",
        rated_at="2026-09-21T09:02:00+03:00",
    ),
    ActivityRating(
        report_id="fc-2026-0159",
        title="“All schools to close for the rest of the term next week”",
        verdict="likely-false",
        vote="inaccurate",
        rated_at="2026-09-20T18:40:00+03:00",
    ),
    ActivityRating(
        report_id="fc-2026-0156",
        title="New national examination timetable published",
        verdict="authentic",
        vote="accurate",
        rated_at="2026-09-19T11:15:00+03:00",
    ),
]

SAMPLE_SESSIONS: list[DeviceSession] = [
    DeviceSession(id="d1", device="Chrome on Windows", location="Kampala, Uganda", last_active="Active now", current=True),
    DeviceSession(id="d2", device="Zuula app on Android", location="Entebbe, Uganda", last_active="2 hours ago", current=False),
    DeviceSession(id="d3", device="Safari on iPhone", location="Jinja, Uganda", last_active="5 days ago", current=False),
]

SAMPLE_API_KEYS: list[ApiKey] = [
    ApiKey(
        id="k1",
        name="Newsroom CMS",
        prefix="zl_live_4f7a",
        scopes=["submit", "read"],
        created_at="2026-08-02",
        last_used_at="2026-09-21T10:05:00+03:00",
    ),
    ApiKey(
        id="k2",
        name="Research notebook",
        prefix="zl_live_b91c",
        scopes=["read"],
        created_at="2026-09-10",
        last_used_at=None,
    ),
]

SAMPLE_API_USAGE = {"usedThisHour": 37, "last24h": 412}
