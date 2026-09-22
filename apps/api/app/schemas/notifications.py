from datetime import datetime

from app.schemas.common import CamelModel


class AppNotification(CamelModel):
    id: str
    kind: str  # verdict-ready | topic-alert | review-outcome | broadcast | accreditation
    title: str
    body: str
    href: str | None = None
    created_at: datetime
    read: bool


class NotifyOn(CamelModel):
    submission_results: bool = True
    viral_misinformation: bool = True
    expert_reviews: bool = True
    emergency_broadcasts: bool = True  # always on, not user-editable


class Channels(CamelModel):
    in_app: bool = True
    email: bool = True
    push: bool = False
    sms: bool = False
    whatsapp: bool = False


class AlertSettings(CamelModel):
    topics: list[str] = []
    notify_on: NotifyOn = NotifyOn()
    channels: Channels = Channels()
