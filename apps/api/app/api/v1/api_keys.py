"""Partner API keys (FR-API-02: Verified Journalists and Admins). The secret is shown exactly
once, in the create response; only its SHA-256 is stored."""

import secrets
from datetime import UTC, datetime

from fastapi import Body, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rules
from app.core.errors import ApiError
from app.core.router import APIRouter
from app.core.security import require_roles
from app.db.base import new_id
from app.db.models import ApiKey as ApiKeyRow
from app.db.session import get_db
from app.schemas.account import ApiKey, ApiKeyCreated, UserProfile, dump_api_key
from app.services.auth import token_hash

router = APIRouter(prefix="/me/api-keys", tags=["api-keys"])

_can_manage_keys = require_roles(*sorted(rules.API_KEY_ROLES))
_SCOPES = {"submit", "read"}
_MAX_ACTIVE_KEYS = 10


def _to_schema(k: ApiKeyRow) -> ApiKey:
    return ApiKey(
        id=k.id,
        name=k.name,
        prefix=k.prefix,
        scopes=k.scopes,
        created_at=k.created_at.date().isoformat(),
        last_used_at=k.last_used_at,
    )


@router.get("", response_model=None)
async def list_api_keys(
    user: UserProfile = Depends(_can_manage_keys),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    rows = await db.scalars(
        select(ApiKeyRow)
        .where(ApiKeyRow.user_id == user.id, ApiKeyRow.revoked_at.is_(None))
        .order_by(ApiKeyRow.created_at.desc())
    )
    return [dump_api_key(_to_schema(k)) for k in rows]


@router.post("", response_model=None, status_code=201)
async def create_api_key(
    body: dict = Body(...),  # noqa: B008
    user: UserProfile = Depends(_can_manage_keys),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    name = (body.get("name") or "").strip()
    scopes = body.get("scopes")
    if not name or not isinstance(scopes, list) or not scopes or not set(scopes) <= _SCOPES:
        raise ApiError("bad_request", "A name and at least one scope (submit, read) are required.")
    active = await db.scalars(
        select(ApiKeyRow.id).where(ApiKeyRow.user_id == user.id, ApiKeyRow.revoked_at.is_(None))
    )
    if len(active.all()) >= _MAX_ACTIVE_KEYS:
        raise ApiError("bad_request", f"Revoke a key first: {_MAX_ACTIVE_KEYS} is the maximum.")

    secret = f"zl_live_{secrets.token_hex(16)}"  # 128 random bits
    row = ApiKeyRow(
        id=new_id("key"),
        user_id=user.id,
        name=name,
        prefix=secret[:12],
        secret_hash=token_hash(secret),
        scopes=sorted(set(scopes), key=["submit", "read"].index),
        created_at=datetime.now(UTC),
    )
    db.add(row)
    await db.commit()
    return dump_api_key(ApiKeyCreated(**_to_schema(row).model_dump(), secret=secret))


@router.delete("/{id}", status_code=204)
async def revoke_api_key(
    id: str,  # noqa: A002
    user: UserProfile = Depends(_can_manage_keys),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    row = await db.get(ApiKeyRow, id)
    if row is None or row.user_id != user.id or row.revoked_at is not None:
        raise ApiError("not_found", f"No API key '{id}'.")
    row.revoked_at = datetime.now(UTC)
    await db.commit()
    return None
