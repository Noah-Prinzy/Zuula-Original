"""Transliterated from apps/web/lib/mock/account.ts (SAMPLE_NOTIFICATIONS)."""

from app.schemas.notifications import AlertSettings, AppNotification, Channels, NotifyOn

SAMPLE_NOTIFICATIONS: list[AppNotification] = [
    AppNotification(id="n1", kind="verdict-ready", title="Your submission was checked", body="“Free unlimited internet for every Ugandan from January 2027” — False.", href="/fact-checks/fc-2026-0142", created_at="2026-09-21T10:42:00+03:00", read=False),
    AppNotification(id="n2", kind="broadcast", title="Emergency alert: health misinformation", body="A false malaria cure is spreading on WhatsApp in central Uganda.", href="/fact-checks/fc-2026-0161", created_at="2026-09-21T08:15:00+03:00", read=False),
    AppNotification(id="n3", kind="topic-alert", title="New fact-check in Education", body="“All schools to close for the rest of the term next week” — Likely False.", href="/fact-checks/fc-2026-0159", created_at="2026-09-20T17:03:00+03:00", read=False),
    AppNotification(id="n4", kind="review-outcome", title="A verdict you rated was reviewed", body="An Expert Reviewer confirmed the original verdict.", href="/fact-checks/fc-2026-0142", created_at="2026-09-19T12:30:00+03:00", read=True),
    AppNotification(id="n5", kind="topic-alert", title="New fact-check in Economy", body="Video of a “new 50,000 shilling note” — AI-Generated.", href="/fact-checks/fc-2026-0160", created_at="2026-09-18T09:10:00+03:00", read=True),
    AppNotification(id="n6", kind="accreditation", title="Accreditation reminder", body="Verified Journalists get 2× rating weight. Apply from your account.", href="/account/verification", created_at="2026-09-15T14:00:00+03:00", read=True),
]

DEFAULT_ALERT_SETTINGS = AlertSettings(
    topics=["Health", "Elections", "Technology"],
    notify_on=NotifyOn(),
    channels=Channels(in_app=True, email=True),
)
