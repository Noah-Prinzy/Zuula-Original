"""In-app notifications (FR-NOTIFY): stored per user, and pushed live to that user's open
GET /notifications/stream connections over Redis pub/sub.

A notification is published only after the transaction that created it commits (an
`after_commit` hook on the session), so no one is ever told about something that was then
rolled back — and a notification written inside a rolled-back test transaction is never
published at all.
"""

import json
from datetime import UTC, datetime

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session as OrmSession

from app.db.base import new_id
from app.db.models import Notification
from app.realtime import redis_client
from app.schemas.notifications import AppNotification

_PENDING = "zuula_pending_notifications"

VERDICT_LABELS = {
    "authentic": "Authentic",
    "likely-false": "Likely False",
    "false": "False",
    "ai-generated": "AI-Generated",
    "unverifiable": "Unverifiable",
}


def channel(user_id: str) -> str:
    return f"zuula:notifications:{user_id}"


def to_schema(n: Notification) -> AppNotification:
    return AppNotification(
        id=n.id,
        kind=n.kind,
        title=n.title,
        body=n.body,
        href=n.href,
        created_at=n.created_at,
        read=n.read_at is not None,
    )


def notify(
    db: AsyncSession,
    *,
    user_id: str,
    kind: str,
    title: str,
    body: str,
    href: str | None = None,
    broadcast_id: str | None = None,
) -> Notification:
    n = Notification(
        id=new_id("ntf"),
        user_id=user_id,
        kind=kind,
        title=title,
        body=body,
        href=href,
        broadcast_id=broadcast_id,
        created_at=datetime.now(UTC),
    )
    db.add(n)
    db.sync_session.info.setdefault(_PENDING, []).append(n)
    return n


@event.listens_for(OrmSession, "after_commit")
def _publish_after_commit(session: OrmSession) -> None:
    pending = session.info.pop(_PENDING, None)
    if not pending:
        return
    r = redis_client.get_redis()
    for n in pending:
        payload = to_schema(n).model_dump(by_alias=True, mode="json", exclude_none=True)
        r.publish(channel(n.user_id), json.dumps(payload))


@event.listens_for(OrmSession, "after_rollback")
def _drop_after_rollback(session: OrmSession) -> None:
    session.info.pop(_PENDING, None)
