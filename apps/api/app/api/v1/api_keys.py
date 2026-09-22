import secrets

from fastapi import Body, Depends

from app.core.errors import ApiError
from app.core.router import APIRouter
from app.core.security import require_roles
from app.schemas.account import ApiKeyCreated, UserProfile, dump_api_key
from app.stubs.account import SAMPLE_API_KEYS

router = APIRouter(prefix="/me/api-keys", tags=["api-keys"])

# FR-API-02: Journalist, Admin only.
_can_manage_keys = require_roles("journalist", "admin")


@router.get("", response_model=None)
def list_api_keys(user: UserProfile = Depends(_can_manage_keys)):  # noqa: B008
    return [dump_api_key(k) for k in SAMPLE_API_KEYS]


@router.post("", response_model=None, status_code=201)
def create_api_key(body: dict = Body(...), user: UserProfile = Depends(_can_manage_keys)):  # noqa: B008
    name = body.get("name")
    scopes = body.get("scopes")
    if not name or not scopes:
        raise ApiError("bad_request", "name and scopes are required.")
    secret = f"zl_live_{secrets.token_hex(16)}"
    return dump_api_key(
        ApiKeyCreated(
            id=f"k{secrets.token_hex(4)}",
            name=name,
            prefix=secret[:12],
            scopes=scopes,
            created_at="2026-09-22",
            last_used_at=None,
            secret=secret,
        )
    )


@router.delete("/{id}", status_code=204)
def revoke_api_key(id: str, user: UserProfile = Depends(_can_manage_keys)):  # noqa: A002, B008
    return None
