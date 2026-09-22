import asyncio
import json

from fastapi import Body, Depends
from fastapi.responses import StreamingResponse

from app.core.pagination import PageParams, page_params, paginate
from app.core.router import APIRouter
from app.core.security import require_roles
from app.schemas.account import UserProfile
from app.schemas.notifications import AlertSettings
from app.stubs.notifications import DEFAULT_ALERT_SETTINGS, SAMPLE_NOTIFICATIONS

router = APIRouter(tags=["notifications"])

_signed_in = require_roles()


@router.get("/notifications", response_model=None)
def list_notifications(
    unread_only: bool = False,
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_signed_in),  # noqa: B008
):
    filtered = [n for n in SAMPLE_NOTIFICATIONS if not unread_only or not n.read]
    items, meta = paginate(filtered, params)
    return {
        "data": [n.model_dump(by_alias=True, mode="json", exclude_none=True) for n in items],
        **meta,
    }


@router.post("/notifications/{id}/read", status_code=204)
def mark_notification_read(id: str, user: UserProfile = Depends(_signed_in)):  # noqa: A002, B008
    return None


@router.post("/notifications/read-all", status_code=204)
def mark_all_read(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return None


@router.get("/notifications/stream")
async def stream_notifications(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    async def gen():
        for n in SAMPLE_NOTIFICATIONS[:1]:
            payload = json.dumps(n.model_dump(by_alias=True, mode="json", exclude_none=True))
            yield f"event: notification\ndata: {payload}\n\n"
            await asyncio.sleep(0)

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/me/alert-settings", response_model=AlertSettings)
def get_alert_settings(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return DEFAULT_ALERT_SETTINGS


@router.patch("/me/alert-settings", response_model=AlertSettings)
def update_alert_settings(body: dict = Body(...), user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return DEFAULT_ALERT_SETTINGS.model_copy(update=body)
