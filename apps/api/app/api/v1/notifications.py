"""In-app notifications and alert preferences (FR-NOTIFY). Notifications are rows per user;
the stream pushes new ones live over Redis pub/sub (app/services/notifications.py)."""

import asyncio
import json
import time
from datetime import UTC, datetime

from fastapi import Body, Depends, Header, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApiError
from app.core.pagination import PageParams, page_params
from app.core.router import APIRouter
from app.core.security import require_roles
from app.db.models import AlertSettings as AlertSettingsRow
from app.db.models import Notification
from app.db.session import get_db
from app.realtime import redis_client
from app.schemas.account import UserProfile
from app.schemas.notifications import AlertSettings
from app.services.notifications import channel, to_schema

router = APIRouter(tags=["notifications"])

_signed_in = require_roles()
_REPLAY = 20  # unread notifications sent when a stream opens fresh
_HEARTBEAT_SECONDS = 25


def _dump(model) -> dict:
    return model.model_dump(by_alias=True, mode="json", exclude_none=True)


@router.get("/notifications", response_model=None)
async def list_notifications(
    unread_only: bool = Query(False, alias="unreadOnly"),
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    conditions = [Notification.user_id == user.id]
    if unread_only:
        conditions.append(Notification.read_at.is_(None))
    total = (await db.execute(select(func.count()).where(*conditions))).scalar_one()
    rows = await db.scalars(
        select(Notification)
        .where(*conditions)
        .order_by(Notification.created_at.desc())
        .offset((params.page - 1) * params.per_page)
        .limit(params.per_page)
    )
    return {
        "data": [_dump(to_schema(n)) for n in rows],
        "page": params.page,
        "perPage": params.per_page,
        "total": total,
    }


@router.post("/notifications/{id}/read", status_code=204)
async def mark_notification_read(
    id: str,  # noqa: A002
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    # Only the user's own; an unknown id is the same 204 (nothing to reveal).
    await db.execute(
        update(Notification)
        .where(Notification.id == id, Notification.user_id == user.id)
        .where(Notification.read_at.is_(None))
        .values(read_at=datetime.now(UTC))
    )
    await db.commit()
    return None


@router.post("/notifications/read-all", status_code=204)
async def mark_all_read(
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(UTC))
    )
    await db.commit()
    return None


def _event(n: dict) -> str:
    # `id:` lets EventSource resume from Last-Event-ID after a reconnect.
    return f"id: {n['id']}\nevent: notification\ndata: {json.dumps(n)}\n\n"


@router.get("/notifications/stream")
async def stream_notifications(
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Replays what the client hasn't seen — everything after Last-Event-ID on a reconnect,
    else the latest unread — then pushes new notifications live until the connection's time
    is up (Settings.notification_stream_seconds); the browser then reconnects."""
    conditions = [Notification.user_id == user.id]
    after = await db.get(Notification, last_event_id) if last_event_id else None
    if after is not None and after.user_id == user.id:
        conditions.append(Notification.created_at > after.created_at)
    else:
        conditions.append(Notification.read_at.is_(None))
    backlog = list(
        await db.scalars(
            select(Notification)
            .where(*conditions)
            .order_by(Notification.created_at.desc())
            .limit(_REPLAY)
        )
    )
    replay = [_dump(to_schema(n)) for n in reversed(backlog)]
    seconds = get_settings().notification_stream_seconds

    async def gen():
        for n in replay:
            yield _event(n)
        if seconds <= 0:
            return
        deadline = time.monotonic() + seconds
        pubsub = redis_client.get_async_redis().pubsub()
        async with pubsub:
            await pubsub.subscribe(channel(user.id))
            last_beat = time.monotonic()
            while time.monotonic() < deadline:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message.get("type") == "message":
                    yield _event(json.loads(message["data"]))
                elif time.monotonic() - last_beat > _HEARTBEAT_SECONDS:
                    last_beat = time.monotonic()
                    yield ": keep-alive\n\n"  # an SSE comment: keeps proxies from timing out
                await asyncio.sleep(0)

    return StreamingResponse(gen(), media_type="text/event-stream")


# ---- Alert preferences ----


async def _alert_settings(db: AsyncSession, user_id: str) -> AlertSettings:
    row = await db.get(AlertSettingsRow, user_id)
    return AlertSettings.model_validate(row.settings) if row else AlertSettings()


@router.get("/me/alert-settings", response_model=AlertSettings)
async def get_alert_settings(
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    return await _alert_settings(db, user.id)


@router.patch("/me/alert-settings", response_model=AlertSettings)
async def update_alert_settings(
    body: dict = Body(...),  # noqa: B008
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    current = _dump(await _alert_settings(db, user.id))
    merged = {**current}
    if "topics" in body:
        merged["topics"] = body["topics"]
    for group in ("notifyOn", "channels"):
        if group in body:
            if not isinstance(body[group], dict):
                raise ApiError("bad_request", f"{group} must be an object.")
            merged[group] = {**current.get(group, {}), **body[group]}
    try:
        settings = AlertSettings.model_validate(merged)
    except ValueError as exc:
        raise ApiError("bad_request", "Invalid alert settings.") from exc
    # Emergency broadcasts are always on (FR-NOTIFY): not a user choice.
    settings.notify_on.emergency_broadcasts = True

    row = await db.get(AlertSettingsRow, user.id)
    data = _dump(settings)
    if row is None:
        db.add(AlertSettingsRow(user_id=user.id, settings=data, updated_at=datetime.now(UTC)))
    else:
        row.settings = data
        row.updated_at = datetime.now(UTC)
    await db.commit()
    return settings
