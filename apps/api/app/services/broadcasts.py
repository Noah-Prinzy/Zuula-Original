"""Emergency broadcasts (FR-NOTIFY, FR-ADMIN): an admin's alert to everyone. ADR 0002 §2.

In-app delivery is immediate: one notification row per active account, written with the
broadcast itself. SMS and email go out afterwards from the worker (deliver_channels), to the
people who have that channel turned on in their alert settings. Emergency broadcasts ignore
the "notify me about" toggles (they're always on), but not the choice of channel — an SMS
costs the recipient nothing to ignore, but it's still their number.
"""

from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.email import get_email_sender
from app.adapters.sms import get_sms_sender
from app.db.base import new_id, utcnow
from app.db.models import AlertSettings, Broadcast, Notification, User
from app.schemas.notifications import AlertSettings as AlertSettingsSchema

# openapi.yaml's channel values: in-app, push, email, sms (matched case-insensitively, since
# the sample broadcasts store the admin screen's display labels, "In-app", "SMS", …).
_SMS, _EMAIL = "sms", "email"


def _wants(channels: list[str], name: str) -> bool:
    return any(c.strip().lower() == name for c in channels)


async def fan_out_in_app(db: AsyncSession, broadcast: Broadcast) -> int:
    """One `broadcast` notification per active account. Returns the reach."""
    users = list(
        await db.scalars(
            select(User.id).where(User.status != "suspended", User.deleted_at.is_(None))
        )
    )
    now = utcnow()
    if users:
        await db.execute(
            insert(Notification),
            [
                {
                    "id": new_id("ntf"),
                    "user_id": uid,
                    "kind": "broadcast",
                    "title": broadcast.title,
                    "body": broadcast.message,
                    "broadcast_id": broadcast.id,
                    "created_at": now,
                }
                for uid in users
            ],
        )
    return len(users)


async def deliver_channels(db: AsyncSession, broadcast_id: str) -> dict[str, int]:
    broadcast = await db.get(Broadcast, broadcast_id)
    if broadcast is None:
        return {}
    sent = {_SMS: 0, _EMAIL: 0}
    wants_sms = _wants(broadcast.channels, _SMS)
    wants_email = _wants(broadcast.channels, _EMAIL)
    if not (wants_sms or wants_email):
        return sent

    rows = await db.execute(
        select(User, AlertSettings.settings)
        .outerjoin(AlertSettings, AlertSettings.user_id == User.id)
        .where(User.status != "suspended", User.deleted_at.is_(None))
    )
    text = f"{broadcast.title}: {broadcast.message}"
    for user, raw in rows:
        prefs = AlertSettingsSchema.model_validate(raw) if raw else AlertSettingsSchema()
        if wants_sms and prefs.channels.sms and user.phone:
            get_sms_sender().send(to=user.phone, message=f"Zuula alert — {text}")
            sent[_SMS] += 1
        if (
            wants_email
            and prefs.channels.email
            and user.email
            and not user.email.endswith(".invalid")
        ):
            get_email_sender().send(
                to=user.email, subject=f"Zuula alert: {broadcast.title}", body=broadcast.message
            )
            sent[_EMAIL] += 1
    return sent
