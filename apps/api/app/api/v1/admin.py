from fastapi import Body, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApiError
from app.core.pagination import PageParams, page_params, paginate
from app.core.router import APIRouter
from app.core.security import require_roles
from app.db.models import AuditLogEntry, Rating, User
from app.db.session import get_db
from app.schemas.account import UserProfile
from app.schemas.admin import (
    AdminOverview,
    AdminUser,
    AuditEntry,
    Broadcast,
    PlatformSettings,
    TrustedSource,
    TrustedSourceInput,
)
from app.services import audit
from app.services.auth import revoke_sessions
from app.stubs.admin import (
    ADMIN_OVERVIEW,
    CONTENT_REPORTS,
    DEFAULT_SETTINGS,
    MANIPULATION_SIGNALS,
    MONTHLY_REPORTS,
    SAMPLE_BROADCASTS,
    SAMPLE_SOURCES,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_admin = require_roles("admin")


def _dump(model) -> dict:
    return model.model_dump(by_alias=True, mode="json", exclude_none=True)


@router.get("/overview", response_model=AdminOverview)
def get_admin_overview(user: UserProfile = Depends(_admin)):  # noqa: B008
    return ADMIN_OVERVIEW


_ROLE_LABELS = {
    "public": "Public User",
    "journalist": "Verified Journalist",
    "expert": "Expert Reviewer",
    "admin": "Admin",
}


def _admin_user(u: User, ratings: int) -> AdminUser:
    return AdminUser(
        id=u.id,
        name=u.name,
        email=u.email or u.phone or "",
        role=u.role,
        status=u.status,
        joined=u.created_at.date(),
        last_active=(u.last_active_at or u.created_at).date(),
        ratings=ratings,
    )


def _ratings_count():
    return (
        select(func.count())
        .where(Rating.user_id == User.id, Rating.excluded_at.is_(None))
        .scalar_subquery()
    )


@router.get("/users", response_model=None)
async def list_admin_users(
    q: str | None = None,
    role: str | None = None,
    status: str | None = None,
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_admin),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    conditions = [User.deleted_at.is_(None)]
    if q:
        needle = f"%{q.strip()}%"
        conditions.append(
            or_(User.name.ilike(needle), User.email.ilike(needle), User.phone.ilike(needle))
        )
    if role:
        conditions.append(User.role == role)
    if status:
        conditions.append(User.status == status)

    total = (
        await db.execute(select(func.count()).select_from(User).where(*conditions))
    ).scalar_one()
    rows = await db.execute(
        select(User, _ratings_count())
        .where(*conditions)
        .order_by(User.created_at, User.id)
        .offset((params.page - 1) * params.per_page)
        .limit(params.per_page)
    )
    return {
        "data": [_dump(_admin_user(u, n)) for u, n in rows],
        "page": params.page,
        "perPage": params.per_page,
        "total": total,
    }


@router.patch("/users/{id}", response_model=AdminUser)
async def update_admin_user(
    id: str,  # noqa: A002
    request: Request,
    body: dict = Body(...),  # noqa: B008
    user: UserProfile = Depends(_admin),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """FR-ADMIN-02: change a user's role or status. Takes effect on the user's very next request
    (roles are read from the database on every request), and every change is audited."""
    target = await db.get(User, id)
    if target is None or target.deleted_at is not None:
        raise ApiError("not_found", f"No user '{id}'.")
    new_role = body.get("role", target.role)
    new_status = body.get("status", target.status)
    if new_role not in _ROLE_LABELS or new_status not in ("active", "suspended", "pending"):
        raise ApiError("bad_request", "Unknown role or status.")
    changing = new_role != target.role or new_status != target.status
    if changing and target.id == user.id:
        # An admin locking themselves out (or demoting the last admin) is never intended.
        raise ApiError("bad_request", "You can't change your own role or status.")

    if new_role != target.role:
        audit.record(
            db,
            actor=user,
            action="user.role_change",
            target=target.name,
            detail=f"{_ROLE_LABELS[target.role]} → {_ROLE_LABELS[new_role]}",
            request=request,
        )
        target.role = new_role
    if new_status != target.status:
        if new_status == "suspended":
            audit.record(db, actor=user, action="user.suspend", target=target.name, request=request)
            await revoke_sessions(db, target.id)  # signed out everywhere, immediately
        elif target.status == "suspended":
            audit.record(
                db, actor=user, action="user.reinstate", target=target.name, request=request
            )
        target.status = new_status
    await db.commit()

    ratings = (
        await db.execute(
            select(func.count()).where(Rating.user_id == target.id, Rating.excluded_at.is_(None))
        )
    ).scalar_one()
    return _admin_user(target, ratings)


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
async def list_audit_log(
    actor_role: str | None = Query(None, alias="actorRole"),
    action: str | None = None,
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_admin),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    conditions = []
    if actor_role:
        conditions.append(AuditLogEntry.actor_role == actor_role)
    if action:
        conditions.append(AuditLogEntry.action == action)
    total = (
        await db.execute(select(func.count()).select_from(AuditLogEntry).where(*conditions))
    ).scalar_one()
    rows = await db.scalars(
        select(AuditLogEntry)
        .where(*conditions)
        .order_by(AuditLogEntry.at.desc(), AuditLogEntry.id.desc())
        .offset((params.page - 1) * params.per_page)
        .limit(params.per_page)
    )
    entries = [
        AuditEntry(
            id=f"a{e.id}",
            at=e.at,
            actor=e.actor_name,
            actor_role=e.actor_role,
            action=e.action,
            target=e.target,
            detail=e.detail,
            ip=e.ip,
        )
        for e in rows
    ]
    return {
        "data": [_dump(e) for e in entries],
        "page": params.page,
        "perPage": params.per_page,
        "total": total,
    }


@router.get("/settings", response_model=PlatformSettings)
def get_platform_settings(user: UserProfile = Depends(_admin)):  # noqa: B008
    return DEFAULT_SETTINGS


@router.patch("/settings", response_model=PlatformSettings)
def update_platform_settings(body: PlatformSettings, user: UserProfile = Depends(_admin)):  # noqa: B008
    return body
