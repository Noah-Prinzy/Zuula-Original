"""Transliterated from apps/web/lib/mock/admin.ts."""

from datetime import date, timedelta

from app.schemas.admin import (
    AdminOverview,
    AdminUser,
    AuditEntry,
    Broadcast,
    ContentReport,
    DailyCheckPoint,
    Kpi,
    ManipulationSignal,
    MonthlyReport,
    PlatformSettings,
    Retraining,
    SystemHealthItem,
    Thresholds,
    TrustedSource,
    VerdictCount,
    Weights,
)

KPIS: list[Kpi] = [
    Kpi(id="f1", label="Text detection F1", value=91.4, unit="%", target=90, direction="min", note="Held-out Ugandan test set, Sep eval"),
    Kpi(id="deepfake", label="Deepfake accuracy", value=83.1, unit="%", target=85, direction="min", note="Image + video benchmark"),
    Kpi(id="mau", label="Monthly active users", value=38420, unit="", target=50000, direction="min", note="Unique signed-in and anonymous"),
    Kpi(id="latency", label="Avg text verdict time", value=7.3, unit="s", target=10, direction="max", note="p50 over the last 7 days"),
    Kpi(id="ratings", label="Ratings per verdict", value=31, unit="", target=25, direction="min", note="Mean over the last 30 days"),
    Kpi(id="turnaround", label="Expert turnaround", value=19.6, unit="h", target=48, direction="max", note="Mean, last 30 days"),
    Kpi(id="partners", label="API partners", value=6, unit="", target=10, direction="min", note="Organisations with an active key"),
    Kpi(id="languages", label="Languages supported", value=5, unit="", target=5, direction="min", note="English, Luganda, Acholi, Runyankole, Ateso"),
]

_DAILY_COUNTS = [412, 438, 391, 460, 522, 498, 350, 377, 541, 603, 587, 612, 455, 489]
_DAILY_START = date(2026, 9, 8)
DAILY_CHECKS: list[DailyCheckPoint] = [
    DailyCheckPoint(date=_DAILY_START + timedelta(days=i), checks=c) for i, c in enumerate(_DAILY_COUNTS)
]

VERDICT_MIX: list[VerdictCount] = [
    VerdictCount(verdict="false", count=1840),
    VerdictCount(verdict="likely-false", count=1210),
    VerdictCount(verdict="authentic", count=980),
    VerdictCount(verdict="ai-generated", count=640),
    VerdictCount(verdict="unverifiable", count=565),
]

SYSTEM_HEALTH: list[SystemHealthItem] = [
    SystemHealthItem(label="API uptime (30 days)", value="99.82%", ok=True, note="SLA 99.5%"),
    SystemHealthItem(label="Analysis queue", value="14 jobs", ok=True, note="Oldest 38s"),
    SystemHealthItem(label="AI model", value="zuula-verify 0.3", ok=True, note="Retrained 14 Sep"),
    SystemHealthItem(label="Source crawler", value="2 sources failing", ok=False, note="See Sources"),
]

ADMIN_OVERVIEW = AdminOverview(kpis=KPIS, daily_checks=DAILY_CHECKS, verdict_mix=VERDICT_MIX, system_health=SYSTEM_HEALTH)

SAMPLE_USERS: list[AdminUser] = [
    AdminUser(id="u1", name="Mary Akello", email="mary@example.com", role="admin", status="active", joined="2026-01-12", last_active="2026-09-21", ratings=12),
    AdminUser(id="u2", name="David Okello", email="david@example.com", role="expert", status="active", joined="2026-02-03", last_active="2026-09-21", ratings=88),
    AdminUser(id="u3", name="Esther Atim", email="esther@example.com", role="expert", status="active", joined="2026-03-18", last_active="2026-09-20", ratings=64),
    AdminUser(id="u4", name="Sarah Namutebi", email="sarah@example.com", role="journalist", status="active", joined="2026-04-09", last_active="2026-09-21", ratings=142),
    AdminUser(id="u5", name="Grace Nankya", email="grace@example.com", role="journalist", status="pending", joined="2026-09-19", last_active="2026-09-19", ratings=3),
    AdminUser(id="u6", name="Amina Nakato", email="amina@example.com", role="public", status="active", joined="2026-05-22", last_active="2026-09-21", ratings=37),
    AdminUser(id="u7", name="James Ssentongo", email="james@example.com", role="public", status="active", joined="2026-06-30", last_active="2026-09-18", ratings=21),
    AdminUser(id="u8", name="Peter Wabwire", email="peter@example.com", role="public", status="suspended", joined="2026-07-14", last_active="2026-09-02", ratings=410),
    AdminUser(id="u9", name="Joseph Opio", email="joseph@example.com", role="public", status="active", joined="2026-08-01", last_active="2026-09-20", ratings=9),
]

CONTENT_REPORTS: list[ContentReport] = [
    ContentReport(id="cr1", report_id="fc-2026-0159", title="“All schools to close for the rest of the term next week”", reason="Verdict seems wrong", reporters=14, sample="Our head teacher received this letter officially.", reported_at="2026-09-21T06:45:00+03:00"),
    ContentReport(id="cr2", report_id="fc-2026-0157", title="Photo of flooded Kampala road shared as “today”", reason="Outdated information", reporters=6, sample="Road was flooded again this morning.", reported_at="2026-09-21T09:20:00+03:00"),
    ContentReport(id="cr3", report_id="fc-2026-0161", title="“Boiled banana leaves cure malaria in three days”", reason="Offensive comment", reporters=3, sample="A comment on this report contains insults.", reported_at="2026-09-20T22:10:00+03:00"),
]

MANIPULATION_SIGNALS: list[ManipulationSignal] = [
    ManipulationSignal(id="ms1", report_id="fc-2026-0152", title="Speech clip attributed to a district official", pattern="Accounts created in the last 48h from the same network range", accounts=132, window="11 minutes", direction="inaccurate", confidence=0.92),
    ManipulationSignal(id="ms2", report_id="fc-2026-0155", title="“Voting will move to mobile phones at the next election”", pattern="Identical rating comments posted within seconds", accounts=41, window="3 minutes", direction="inaccurate", confidence=0.78),
]

SAMPLE_SOURCES: list[TrustedSource] = [
    TrustedSource(id="s1", name="New Vision", domain="newvision.co.ug", type="media", languages=["English"], tier=1, active=True, last_crawled="2026-09-21T11:40:00+03:00", crawl_ok=True),
    TrustedSource(id="s2", name="Daily Monitor", domain="monitor.co.ug", type="media", languages=["English"], tier=1, active=True, last_crawled="2026-09-21T11:35:00+03:00", crawl_ok=True),
    TrustedSource(id="s3", name="Bukedde", domain="bukedde.co.ug", type="media", languages=["Luganda"], tier=1, active=True, last_crawled="2026-09-21T11:20:00+03:00", crawl_ok=True),
    TrustedSource(id="s4", name="Nile Post", domain="nilepost.co.ug", type="media", languages=["English"], tier=2, active=True, last_crawled="2026-09-21T10:50:00+03:00", crawl_ok=True),
    TrustedSource(id="s5", name="Uganda Radio Network", domain="ugandaradionetwork.net", type="media", languages=["English", "Luganda", "Acholi"], tier=1, active=True, last_crawled="2026-09-21T11:05:00+03:00", crawl_ok=False),
    TrustedSource(id="s6", name="Ministry of Health", domain="health.go.ug", type="government", languages=["English"], tier=1, active=True, last_crawled="2026-09-21T09:00:00+03:00", crawl_ok=True),
    TrustedSource(id="s7", name="Electoral Commission", domain="ec.or.ug", type="government", languages=["English"], tier=1, active=True, last_crawled="2026-09-21T08:30:00+03:00", crawl_ok=True),
    TrustedSource(id="s8", name="Uganda Communications Commission", domain="ucc.co.ug", type="government", languages=["English"], tier=1, active=True, last_crawled="2026-09-21T08:45:00+03:00", crawl_ok=False),
    TrustedSource(id="s9", name="Africa Check", domain="africacheck.org", type="fact-checker", languages=["English"], tier=1, active=True, last_crawled="2026-09-21T10:15:00+03:00", crawl_ok=True),
    TrustedSource(id="s10", name="PesaCheck", domain="pesacheck.org", type="fact-checker", languages=["English"], tier=1, active=True, last_crawled="2026-09-21T10:10:00+03:00", crawl_ok=True),
    TrustedSource(id="s11", name="Reuters", domain="reuters.com", type="international", languages=["English"], tier=2, active=True, last_crawled="2026-09-21T11:00:00+03:00", crawl_ok=True),
    TrustedSource(id="s12", name="Makerere University AI Lab", domain="air.ug", type="academic", languages=["English"], tier=3, active=False, last_crawled="2026-08-30T12:00:00+03:00", crawl_ok=True),
]

SOURCE_TARGET = 50  # FR-DETECT-06: at least 50 source databases

SAMPLE_BROADCASTS: list[Broadcast] = [
    Broadcast(id="b3", title="Health misinformation: false malaria cure", message="A message claiming boiled banana leaves cure malaria is spreading on WhatsApp. It is false. Get tested and use approved treatment.", severity="high", audience="Everyone in Central region", channels=["In-app", "Push", "SMS"], sent_at="2026-09-21T08:15:00+03:00", sent_by="Mary Akello", reach=18430, opened=9874),
    Broadcast(id="b2", title="Scam alert: fake free-data links", message="Links offering free mobile data for your National ID number are phishing. Don't enter your details.", severity="critical", audience="Everyone", channels=["In-app", "Push", "Email", "SMS"], sent_at="2026-09-16T14:02:00+03:00", sent_by="Mary Akello", reach=41205, opened=22950),
]

MONTHLY_REPORTS: list[MonthlyReport] = [
    MonthlyReport(month="2026-04", checks=4120, false_share=52, ai_generated=210, top_categories=["Health", "Politics", "Economy"], avg_delivery=9.4),
    MonthlyReport(month="2026-05", checks=6380, false_share=55, ai_generated=344, top_categories=["Politics", "Health", "Education"], avg_delivery=8.9),
    MonthlyReport(month="2026-06", checks=8905, false_share=58, ai_generated=512, top_categories=["Elections", "Politics", "Health"], avg_delivery=8.1),
    MonthlyReport(month="2026-07", checks=10240, false_share=57, ai_generated=690, top_categories=["Economy", "Technology", "Health"], avg_delivery=7.8),
    MonthlyReport(month="2026-08", checks=12870, false_share=54, ai_generated=905, top_categories=["Technology", "Economy", "Education"], avg_delivery=7.5),
    MonthlyReport(month="2026-09", checks=9105, false_share=56, ai_generated=744, top_categories=["Health", "Education", "Economy"], avg_delivery=7.3),
]

AUDIT_ACTION_LABELS = {
    "verdict.override": "Verdict overridden",
    "verdict.confirm": "Verdict confirmed",
    "user.role_change": "Role changed",
    "user.suspend": "User suspended",
    "source.add": "Source added",
    "source.deactivate": "Source deactivated",
    "broadcast.send": "Broadcast sent",
    "settings.update": "Settings changed",
    "moderation.remove": "Content removed",
}

SAMPLE_AUDIT: list[AuditEntry] = [
    AuditEntry(id="a12", at="2026-09-21T11:02:00+03:00", actor="Mary Akello", actor_role="admin", action="settings.update", target="Escalation thresholds", detail="Questioned: min ratings 40 → 50", ip="196.43.x.x"),
    AuditEntry(id="a11", at="2026-09-21T08:15:00+03:00", actor="Mary Akello", actor_role="admin", action="broadcast.send", target="b3", detail="Health misinformation: false malaria cure (Central)", ip="196.43.x.x"),
    AuditEntry(id="a10", at="2026-09-20T17:40:00+03:00", actor="Mary Akello", actor_role="admin", action="user.role_change", target="Esther Atim", detail="Public User → Expert Reviewer", ip="196.43.x.x"),
    AuditEntry(id="a9", at="2026-09-19T14:20:00+03:00", actor="David Okello", actor_role="expert", action="verdict.confirm", target="fc-2026-0142", detail="False confirmed: “Verified with the Ministry…”", ip="102.85.x.x"),
    AuditEntry(id="a8", at="2026-09-18T10:05:00+03:00", actor="Mary Akello", actor_role="admin", action="user.suspend", target="Peter Wabwire", detail="Coordinated rating activity (ms-0031)", ip="196.43.x.x"),
    AuditEntry(id="a7", at="2026-09-17T18:05:00+03:00", actor="David Okello", actor_role="expert", action="verdict.override", target="fc-2026-0154", detail="False → Likely False: “Photo is genuine but from 2020…”", ip="102.85.x.x"),
    AuditEntry(id="a6", at="2026-09-16T14:02:00+03:00", actor="Mary Akello", actor_role="admin", action="broadcast.send", target="b2", detail="Scam alert: fake free-data links (Everyone)", ip="196.43.x.x"),
    AuditEntry(id="a5", at="2026-09-15T09:30:00+03:00", actor="Mary Akello", actor_role="admin", action="source.add", target="Bukedde", detail="Media house, Luganda, tier 1", ip="196.43.x.x"),
    AuditEntry(id="a4", at="2026-09-12T16:45:00+03:00", actor="Mary Akello", actor_role="admin", action="moderation.remove", target="Comment on fc-2026-0139", detail="Abusive language", ip="196.43.x.x"),
    AuditEntry(id="a3", at="2026-09-10T12:00:00+03:00", actor="Mary Akello", actor_role="admin", action="source.deactivate", target="Makerere University AI Lab", detail="Feed discontinued", ip="196.43.x.x"),
]

DEFAULT_SETTINGS = PlatformSettings(
    thresholds=Thresholds(
        verified_min=90,
        questioned_min=40,
        questioned_max=69,
        questioned_ratings=50,
        escalated_max=39,
        escalated_ratings=100,
        suspended_max=19,
        suspended_ratings=200,
    ),
    weights=Weights(public=1, journalist=2, expert=5),
    sla_hours=48,
    api_rate_limit=100,
    retraining=Retraining(cadence="weekly", min_ccs=85),
)
