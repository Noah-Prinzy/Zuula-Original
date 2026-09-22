"""Stub auth for P2. Nothing here is real: no password hashing, no JWT signing, no session
store, no persisted API keys. P3 replaces this module's insides while keeping the same
dependency names, so routers don't change.

Core API: sessions are stubbed via an `X-Zuula-Role` header (mirrors the frontend's own
`zuula.mock-session` demo-role system) — defaults to "public" when absent, i.e. signed out.
Partner API: any bearer token shaped like `zl_live_*` is accepted; rate limiting is an
in-memory per-process counter, not the real Redis-backed limiter Step 4 will add.
"""

import time
from collections import defaultdict

from fastapi import Header, Request
from fastapi.security import HTTPBearer

from app.core.config import get_settings
from app.core.errors import ApiError
from app.schemas.account import UserProfile

ROLE_HIERARCHY = ["public", "journalist", "expert", "admin"]
_ROLE_HEADER_DESCRIPTION = "P2 stub auth — see app/core/security.py"

STUB_USERS: dict[str, UserProfile] = {
    "public": UserProfile(id="u6", name="Amina Nakato", email="amina@example.com", role="public"),
    "journalist": UserProfile(
        id="u4", name="Sarah Namutebi", email="sarah@example.com", role="journalist"
    ),
    "expert": UserProfile(id="u2", name="David Okello", email="david@example.com", role="expert"),
    "admin": UserProfile(id="u1", name="Mary Akello", email="mary@example.com", role="admin"),
}


async def get_current_user(
    x_zuula_role: str | None = Header(default=None, description=_ROLE_HEADER_DESCRIPTION),
) -> UserProfile | None:
    if not x_zuula_role:
        return None
    role = x_zuula_role.strip().lower()
    if role not in STUB_USERS:
        raise ApiError(
            "bad_request", f"Unknown stub role '{x_zuula_role}'. Use one of: {ROLE_HIERARCHY}."
        )
    return STUB_USERS[role]


def require_roles(*allowed: str):
    """Dependency factory: raises 401/403 unless the stub session has one of `allowed` roles.
    Empty `allowed` means "signed in, any role"."""

    async def _dep(
        x_zuula_role: str | None = Header(default=None, description=_ROLE_HEADER_DESCRIPTION),
    ) -> UserProfile:
        user = await get_current_user(x_zuula_role)
        if user is None:
            raise ApiError("unauthorized", "Sign in required.")
        if allowed and user.role not in allowed:
            raise ApiError("forbidden", f"Requires role: {', '.join(allowed)}.")
        return user

    return _dep


# ---- Partner API key auth + stub rate limiting (FR-API-01/02, 100 req/hour) ----

partner_bearer = HTTPBearer(auto_error=False)

_partner_request_log: dict[str, list[float]] = defaultdict(list)


class PartnerPrincipal:
    def __init__(self, key: str):
        self.key = key
        self.key_prefix = key[:12]


async def require_partner_key(request: Request) -> PartnerPrincipal:
    # `credentials` must come from partner_bearer(request), not a plain function parameter:
    # an untyped-as-Depends parameter shaped like a Pydantic model (HTTPAuthorizationCredentials
    # extends BaseModel) is treated by FastAPI as an *implicit request body field*, which then
    # merges with a route's own Body(...) param into a wrapped {"credentials": ..., "body": ...}
    # shape instead of the flat JSON payload callers actually send.
    credentials = await partner_bearer(request)
    if credentials is None or not credentials.credentials.startswith("zl_live_"):
        raise ApiError(
            "unauthorized", "Provide a partner API key: Authorization: Bearer zl_live_..."
        )

    key = credentials.credentials
    settings = get_settings()
    limit = settings.partner_rate_limit_per_hour
    now = time.time()
    window_start = now - 3600

    recent = [t for t in _partner_request_log[key] if t > window_start]
    if len(recent) >= limit:
        reset_at = int(recent[0] + 3600)
        raise ApiError(
            "rate_limited",
            f"This key has used its {limit} requests for this hour.",
            retry_after=max(1, reset_at - int(now)),
        )
    recent.append(now)
    _partner_request_log[key] = recent

    return PartnerPrincipal(key=key)


def rate_limit_headers(key: str) -> dict[str, str]:
    settings = get_settings()
    limit = settings.partner_rate_limit_per_hour
    now = time.time()
    recent = [t for t in _partner_request_log.get(key, []) if t > now - 3600]
    remaining = max(0, limit - len(recent))
    reset_at = int((recent[0] if recent else now) + 3600)
    return {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset_at),
    }
