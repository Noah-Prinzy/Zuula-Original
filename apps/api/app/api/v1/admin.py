from fastapi import Body, Depends

from app.core.errors import ApiError
from app.core.pagination import PageParams, page_params, paginate
from app.core.router import APIRouter
from app.core.security import require_roles
from app.schemas.account import UserProfile
from app.schemas.admin import (
    AdminOverview,
    AdminUser,
    Broadcast,
    PlatformSettings,
    TrustedSource,
    TrustedSourceInput,
)
from app.stubs.admin import (
    ADMIN_OVERVIEW,
    CONTENT_REPORTS,
    DEFAULT_SETTINGS,
    MANIPULATION_SIGNALS,
    MONTHLY_REPORTS,
    SAMPLE_AUDIT,
    SAMPLE_BROADCASTS,
    SAMPLE_SOURCES,
    SAMPLE_USERS,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_admin = require_roles("admin")




@router.get("/overview", response_model=AdminOverview)
def get_admin_overview(user: UserProfile = Depends(_admin)):  # noqa: B008
    return ADMIN_OVERVIEW


@router.get("/users", response_model=None)
def list_admin_users(
    q: str | None = None,
    role: str | None = None,
    status: str | None = None,
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_admin),  # noqa: B008
):
    users = SAMPLE_USERS
    if q:
        needle = q.lower()
        users = [u for u in users if needle in u.name.lower() or needle in u.email.lower()]
    if role:
        users = [u for u in users if u.role == role]
    if status:
        users = [u for u in users if u.status == status]
    items, meta = paginate(users, params)
    return {
        "data": [u.model_dump(by_alias=True, mode="json", exclude_none=True) for u in items],
        **meta,
    }


@router.patch("/users/{id}", response_model=AdminUser)
def update_admin_user(id: str, body: dict = Body(...), user: UserProfile = Depends(_admin)):  # noqa: A002, B008
    target = next((u for u in SAMPLE_USERS if u.id == id), None)
    if target is None:
        raise ApiError("not_found", f"No user '{id}'.")
    return target.model_copy(update={k: v for k, v in body.items() if k in AdminUser.model_fields})


@router.get("/moderation/reports", response_model=None)
def list_content_reports(
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_admin),  # noqa: B008
):
    items, meta = paginate(CONTENT_REPORTS, params)
    return {
        "data": [r.model_dump(by_alias=True, mode="json", exclude_none=True) for r in items],
        **meta,
    }


@router.post("/moderation/reports/{id}/resolve")
def resolve_content_report(id: str, body: dict = Body(...), user: UserProfile = Depends(_admin)):  # noqa: A002, B008
    if body.get("action") not in ("dismiss", "remove"):
        raise ApiError("bad_request", "action must be 'dismiss' or 'remove'.")
    return {}


@router.get("/moderation/signals", response_model=list)
def list_manipulation_signals(user: UserProfile = Depends(_admin)):  # noqa: B008
    return [s.model_dump(by_alias=True, exclude_none=True) for s in MANIPULATION_SIGNALS]


@router.get("/sources", response_model=None)
def list_sources(params: PageParams = Depends(page_params), user: UserProfile = Depends(_admin)):  # noqa: B008
    items, meta = paginate(SAMPLE_SOURCES, params)
    return {
        "data": [s.model_dump(by_alias=True, mode="json", exclude_none=True) for s in items],
        **meta,
    }


@router.post("/sources", response_model=TrustedSource, status_code=201)
def add_source(body: TrustedSourceInput, user: UserProfile = Depends(_admin)):  # noqa: B008
    return TrustedSource(
        id="s-new",
        name=body.name,
        domain=body.domain,
        type=body.type,
        languages=body.languages,
        tier=body.tier,
        active=body.active,
        last_crawled="2026-09-22T00:00:00+03:00",
        crawl_ok=True,
    )


@router.patch("/sources/{id}", response_model=TrustedSource)
def update_source(id: str, body: TrustedSourceInput, user: UserProfile = Depends(_admin)):  # noqa: A002, B008
    existing = next((s for s in SAMPLE_SOURCES if s.id == id), None)
    if existing is None:
        raise ApiError("not_found", f"No source '{id}'.")
    return existing.model_copy(update=body.model_dump())


@router.delete("/sources/{id}", status_code=204)
def remove_source(id: str, user: UserProfile = Depends(_admin)):  # noqa: A002, B008
    return None


@router.get("/broadcasts", response_model=list[Broadcast])
def list_broadcasts(user: UserProfile = Depends(_admin)):  # noqa: B008
    return SAMPLE_BROADCASTS


@router.post("/broadcasts", response_model=Broadcast, status_code=202)
def send_broadcast(body: dict = Body(...), user: UserProfile = Depends(_admin)):  # noqa: B008
    for field in ("title", "message", "severity", "audience", "channels"):
        if not body.get(field):
            raise ApiError("bad_request", f"{field} is required.")
    return Broadcast(
        id="b-new",
        title=body["title"],
        message=body["message"],
        severity=body["severity"],
        audience=body["audience"],
        channels=body["channels"],
        sent_at="2026-09-22T00:00:00+03:00",
        sent_by=user.name,
        reach=0,
        opened=0,
    )


@router.get("/reports", response_model=list)
def list_monthly_reports(user: UserProfile = Depends(_admin)):  # noqa: B008
    return [r.model_dump(by_alias=True, exclude_none=True) for r in MONTHLY_REPORTS]


@router.get("/audit-log", response_model=None)
def list_audit_log(
    actor_role: str | None = None,
    action: str | None = None,
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_admin),  # noqa: B008
):
    entries = SAMPLE_AUDIT
    if actor_role:
        entries = [e for e in entries if e.actor_role == actor_role]
    if action:
        entries = [e for e in entries if e.action == action]
    items, meta = paginate(entries, params)
    return {
        "data": [e.model_dump(by_alias=True, mode="json", exclude_none=True) for e in items],
        **meta,
    }


@router.get("/settings", response_model=PlatformSettings)
def get_platform_settings(user: UserProfile = Depends(_admin)):  # noqa: B008
    return DEFAULT_SETTINGS


@router.patch("/settings", response_model=PlatformSettings)
def update_platform_settings(body: PlatformSettings, user: UserProfile = Depends(_admin)):  # noqa: B008
    return body
