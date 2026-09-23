"""Credentials, sessions and one-time codes (FR-AUTH-01…07). ADR 0002 §5.

- Passwords: bcrypt (cost `rules.BCRYPT_ROUNDS`). bcrypt only reads 72 bytes, so every
  password is SHA-256'd and base64'd first (44 bytes) — a long passphrase isn't silently
  truncated.
- Sessions: 256 random bits, handed to the client once (cookie or bearer), stored only as a
  SHA-256. Revocation is a column update, effective on the next request.
- One-time codes (sign-up, two-factor, password reset): 6 digits, stored as an HMAC keyed by
  ZUULA_SECRET_KEY and bound to the challenge id, single-use, `rules.OTP_TTL_SECONDS` to live,
  `rules.OTP_MAX_ATTEMPTS` guesses.
- Sign-in lockout: a Redis counter per identifier and per client IP;
  `rules.SIGN_IN_MAX_FAILURES` failures inside `rules.SIGN_IN_LOCKOUT_WINDOW_SECONDS` → 429.
"""

import base64
import hashlib
import hmac
import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import bcrypt
from fastapi import Request, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.email import get_email_sender
from app.adapters.sms import get_sms_sender
from app.core import rules
from app.core.config import get_settings
from app.core.errors import ApiError
from app.db.base import new_id
from app.db.models import AuthChallenge, Session, User
from app.realtime import redis_client
from app.schemas.account import UserProfile

# ---- Passwords ----

# A valid hash to compare against when the account doesn't exist, at the same cost as real
# ones, so a sign-in for an unknown identifier takes as long as a wrong password (no timing
# oracle for "does this account exist").
_DUMMY_HASH = bcrypt.hashpw(b"zuula-timing-equaliser", bcrypt.gensalt(rules.BCRYPT_ROUNDS)).decode()
PASSWORD_MAX_LENGTH = 1024  # anything longer is abuse, not a passphrase


def _prehash(password: str) -> bytes:
    return base64.b64encode(hashlib.sha256(password.encode()).digest())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prehash(password), bcrypt.gensalt(rounds=rules.BCRYPT_ROUNDS)).decode()


def verify_password(password: str, password_hash: str | None) -> bool:
    ok = bcrypt.checkpw(_prehash(password), (password_hash or _DUMMY_HASH).encode())
    return ok and password_hash is not None


def check_password_policy(password: str) -> None:
    """FR-AUTH-04: at least `rules.PASSWORD_MIN_LENGTH` characters. The strength meter's other
    rules (apps/web/lib/auth.ts) only guide users; length is the one the server enforces."""
    if not isinstance(password, str) or len(password) < rules.PASSWORD_MIN_LENGTH:
        raise ApiError(
            "bad_request", f"Use at least {rules.PASSWORD_MIN_LENGTH} characters for your password."
        )
    if len(password) > PASSWORD_MAX_LENGTH:
        raise ApiError("bad_request", "That password is too long.")


# ---- Identifiers (email or Ugandan phone number, FR-AUTH-01) ----

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# 07XXXXXXXX, 7XXXXXXXX, 2567XXXXXXXX or +2567XXXXXXXX (spaces/dashes ignored).
_UG_PHONE_RE = re.compile(r"^(?:\+?256|0)?(7\d{8})$")


@dataclass(frozen=True)
class Identifier:
    kind: str  # "email" | "phone"
    value: str  # lower-cased email, or E.164 phone


def parse_identifier(raw: str) -> Identifier | None:
    raw = (raw or "").strip()
    if "@" in raw:
        email = raw.lower()
        return Identifier("email", email) if _EMAIL_RE.match(email) else None
    digits = re.sub(r"[\s\-()]", "", raw)
    m = _UG_PHONE_RE.match(digits)
    return Identifier("phone", f"+256{m.group(1)}") if m else None


def mask(value: str) -> str:
    """`am•••@example.com` / `••••••••678`, as the frontend's check-your-inbox screens show."""
    if "@" in value:
        user, domain = value.split("@", 1)
        return f"{user[:2]}{'•' * max(1, len(user) - 2)}@{domain}"
    return f"{'•' * max(0, len(value) - 3)}{value[-3:]}"


async def find_user(db: AsyncSession, ident: Identifier) -> User | None:
    column = User.email if ident.kind == "email" else User.phone
    return (
        await db.scalars(select(User).where(column == ident.value, User.deleted_at.is_(None)))
    ).first()


async def identifier_taken(db: AsyncSession, ident: Identifier) -> bool:
    column = User.email if ident.kind == "email" else User.phone
    n = (await db.execute(select(func.count()).where(column == ident.value))).scalar_one()
    return n > 0


def needs_two_factor(user: User) -> bool:
    """FR-AUTH-05: always for Expert Reviewers and Admins; opt-in for everyone else."""
    return user.role in rules.TWO_FACTOR_ROLES or user.two_factor_enabled


def to_profile(user: User) -> UserProfile:
    return UserProfile(
        id=user.id,
        name=user.name,
        # openapi.yaml requires `email`; a phone-only account has none, so it's "" there.
        email=user.email or "",
        phone=user.phone,
        role=user.role,
        preferred_language=user.preferred_language,
        district=user.district,
        two_factor_enabled=needs_two_factor(user),
        created_at=user.created_at,
    )


# ---- Sessions ----


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def client_ip(request: Request) -> str | None:
    # Behind the production proxy, uvicorn's --proxy-headers sets request.client from
    # X-Forwarded-For; this function never parses that header itself.
    return request.client.host if request.client else None


_BROWSERS = (
    ("Edg/", "Edge"),
    ("OPR/", "Opera"),
    ("Chrome/", "Chrome"),
    ("Firefox/", "Firefox"),
    ("Safari/", "Safari"),
)
_SYSTEMS = (
    ("Android", "Android"),
    ("iPhone", "iPhone"),
    ("iPad", "iPad"),
    ("Windows", "Windows"),
    ("Mac OS X", "macOS"),
    ("Linux", "Linux"),
)


def describe_device(user_agent: str | None) -> str:
    """The DeviceSession label the Account page lists, e.g. "Chrome on Windows". Deliberately
    coarse: enough to recognise your own devices, not a fingerprint."""
    ua = user_agent or ""
    if "Zuula" in ua:
        return "Zuula app"
    browser = next((name for token, name in _BROWSERS if token in ua), None)
    system = next((name for token, name in _SYSTEMS if token in ua), None)
    if browser and system:
        return f"{browser} on {system}"
    return browser or system or "Unknown device"


async def start_session(
    db: AsyncSession, user: User, request: Request, *, remember: bool
) -> tuple[Session, str]:
    """Create a session row and return it with the raw token (the only time it exists)."""
    token = secrets.token_urlsafe(32)
    now = datetime.now(UTC)
    ttl = rules.SESSION_TTL_REMEMBER_SECONDS if remember else rules.SESSION_TTL_SECONDS
    session = Session(
        id=new_id("ses"),
        user_id=user.id,
        token_hash=token_hash(token),
        device=describe_device(request.headers.get("user-agent")),
        ip=client_ip(request),
        location=None,  # no geo-IP lookup; the Account page shows "Unknown location"
        created_at=now,
        last_active_at=now,
        expires_at=now + timedelta(seconds=ttl),
    )
    db.add(session)
    user.last_active_at = now
    return session, token


def set_session_cookie(response: Response, token: str, *, remember: bool) -> None:
    settings = get_settings()
    response.set_cookie(
        settings.session_cookie_name,
        token,
        # No max_age without `remember`: a browser-session cookie, gone when the browser closes
        # (the server-side row still expires after rules.SESSION_TTL_SECONDS regardless).
        max_age=rules.SESSION_TTL_REMEMBER_SECONDS if remember else None,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        domain=settings.session_cookie_domain or None,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        settings.session_cookie_name,
        domain=settings.session_cookie_domain or None,
        path="/",
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite="lax",
    )


async def revoke_sessions(db: AsyncSession, user_id: str, *, except_id: str | None = None) -> None:
    """Sign a user out everywhere (password change/reset, suspension, account deletion), or
    everywhere but the current device (`except_id`)."""
    query = select(Session).where(Session.user_id == user_id, Session.revoked_at.is_(None))
    if except_id:
        query = query.where(Session.id != except_id)
    now = datetime.now(UTC)
    for s in await db.scalars(query):
        s.revoked_at = now


# ---- One-time codes ----


def _code_hash(challenge_id: str, code: str) -> str:
    key = get_settings().secret_key.encode()
    return hmac.new(key, f"{challenge_id}:{code}".encode(), hashlib.sha256).hexdigest()


def _new_code() -> str:
    return f"{secrets.randbelow(10**rules.OTP_LENGTH):0{rules.OTP_LENGTH}d}"


_MESSAGES = {
    "signup": ("Confirm your Zuula account", "Your Zuula verification code is {code}."),
    "two_factor": ("Your Zuula sign-in code", "Your Zuula sign-in code is {code}."),
    "password_reset": ("Reset your Zuula password", "Your Zuula password reset code is {code}."),
}


def deliver_code(channel: str, destination: str, purpose: str, code: str) -> None:
    subject, template = _MESSAGES[purpose]
    body = template.format(code=code) + f" It expires in {rules.OTP_TTL_SECONDS // 60} minutes."
    if channel == "sms":
        get_sms_sender().send(to=destination, message=body)
    else:
        get_email_sender().send(to=destination, subject=subject, body=body)


async def create_challenge(
    db: AsyncSession,
    *,
    purpose: str,
    ident: Identifier,
    user: User | None = None,
    payload: dict | None = None,
) -> AuthChallenge:
    """Create a challenge and send its code over the identifier's own channel."""
    now = datetime.now(UTC)
    challenge_id = new_id("chl")
    code = _new_code()
    challenge = AuthChallenge(
        id=challenge_id,
        user_id=user.id if user else None,
        payload=payload,
        purpose=purpose,
        channel="sms" if ident.kind == "phone" else "email",
        destination=ident.value,
        code_hash=_code_hash(challenge_id, code),
        attempts=0,
        created_at=now,
        last_sent_at=now,
        expires_at=now + timedelta(seconds=rules.OTP_TTL_SECONDS),
    )
    db.add(challenge)
    deliver_code(challenge.channel, ident.value, purpose, code)
    return challenge


async def resend_challenge(challenge: AuthChallenge) -> None:
    """A fresh code (the old one stops working) and a fresh expiry, after the cooldown."""
    now = datetime.now(UTC)
    wait = rules.OTP_RESEND_COOLDOWN_SECONDS - (now - challenge.last_sent_at).total_seconds()
    if wait > 0:
        raise ApiError(
            "rate_limited",
            "Wait a moment before asking for another code.",
            retry_after=int(wait) + 1,
        )
    code = _new_code()
    challenge.code_hash = _code_hash(challenge.id, code)
    challenge.last_sent_at = now
    challenge.expires_at = now + timedelta(seconds=rules.OTP_TTL_SECONDS)
    deliver_code(challenge.channel, challenge.destination, challenge.purpose, code)


def challenge_usable(challenge: AuthChallenge | None, purpose: str) -> bool:
    return (
        challenge is not None
        and challenge.purpose == purpose
        and challenge.consumed_at is None
        and challenge.attempts < rules.OTP_MAX_ATTEMPTS
        and challenge.expires_at > datetime.now(UTC)
    )


def check_code(challenge: AuthChallenge, code: str) -> bool:
    """Counts the attempt either way; consumes the challenge on success. The caller commits —
    including on failure, so a wrong guess still uses up one of the attempts."""
    challenge.attempts += 1
    ok = hmac.compare_digest(challenge.code_hash, _code_hash(challenge.id, code or ""))
    if ok:
        challenge.consumed_at = datetime.now(UTC)
    return ok


# ---- Sign-in lockout (Redis) ----


def _lock_keys(ident_value: str, ip: str | None) -> list[tuple[str, int]]:
    """(redis key, failure threshold) pairs: one per identifier, one per client IP."""
    digest = hashlib.sha256(ident_value.encode()).hexdigest()
    keys = [(f"zuula:signin-fail:id:{digest}", rules.SIGN_IN_MAX_FAILURES)]
    if ip:
        keys.append((f"zuula:signin-fail:ip:{ip}", rules.SIGN_IN_MAX_FAILURES_PER_IP))
    return keys


async def sign_in_retry_after(ident_value: str, ip: str | None) -> int | None:
    """Seconds until sign-in (or code entry) is allowed again, or None if allowed now."""
    r = redis_client.get_async_redis()
    for key, threshold in _lock_keys(ident_value, ip):
        count = int(await r.get(key) or 0)
        if count >= threshold:
            ttl = await r.ttl(key)
            return max(1, ttl if ttl and ttl > 0 else rules.SIGN_IN_LOCKOUT_WINDOW_SECONDS)
    return None


async def record_sign_in_failure(ident_value: str, ip: str | None) -> None:
    r = redis_client.get_async_redis()
    for key, _ in _lock_keys(ident_value, ip):
        count = await r.incr(key)
        if count == 1:
            await r.expire(key, rules.SIGN_IN_LOCKOUT_WINDOW_SECONDS)


async def clear_sign_in_failures(ident_value: str) -> None:
    # Only the identifier's counter: a shared IP (a newsroom, a school) keeps its own count.
    r = redis_client.get_async_redis()
    await r.delete(_lock_keys(ident_value, None)[0][0])
