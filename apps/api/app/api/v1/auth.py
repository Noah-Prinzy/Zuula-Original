import re

from fastapi import Body

from app.core.errors import ApiError
from app.core.router import APIRouter
from app.core.security import STUB_USERS
from app.schemas.account import Session, TwoFactorChallenge

router = APIRouter(prefix="/auth", tags=["auth"])

_CODE_RE = re.compile(r"^\d{6}$")
_NEEDS_2FA = {"expert", "admin"}  # FR-AUTH-05


def _role_for_identifier(identifier: str) -> str:
    # Mirrors apps/web/lib/auth.ts's demoRoleFor: the part before @ picks the role.
    local = identifier.strip().lower().split("@")[0]
    return local if local in STUB_USERS else "public"


@router.post("/sign-up", status_code=202)
def sign_up(body: dict = Body(...)):  # noqa: B008
    identifier = body.get("identifier", "")
    if not identifier:
        raise ApiError("bad_request", "identifier is required.")
    return {"maskedIdentifier": _mask(identifier)}


def _mask(identifier: str) -> str:
    if "@" in identifier:
        user, domain = identifier.split("@", 1)
        return f"{user[:2]}{'•' * max(1, len(user) - 2)}@{domain}"
    return f"{'•' * max(0, len(identifier) - 3)}{identifier[-3:]}"


@router.post("/sign-up/verify", response_model=Session)
def verify_sign_up(body: dict = Body(...)):  # noqa: B008
    code = body.get("code", "")
    if not _CODE_RE.match(code):
        raise ApiError("bad_request", "Enter the 6-digit code.")
    return Session(user=STUB_USERS["public"])


@router.post("/sign-in", response_model=None)
def sign_in(body: dict = Body(...)):  # noqa: B008
    identifier = body.get("identifier", "")
    if not identifier or not body.get("password"):
        raise ApiError("unauthorized", "Enter your email/phone and password.")
    role = _role_for_identifier(identifier)
    if role in _NEEDS_2FA:
        challenge = TwoFactorChallenge(
            challenge_id=f"tfc_{role}", masked_identifier=_mask(identifier)
        )
        return challenge.model_dump(by_alias=True, exclude_none=True)
    return Session(user=STUB_USERS[role]).model_dump(by_alias=True, exclude_none=True)


@router.post("/two-factor/verify", response_model=Session)
def verify_two_factor(body: dict = Body(...)):  # noqa: B008
    challenge_id = body.get("challengeId", "")
    code = body.get("code", "")
    if not _CODE_RE.match(code) or code == "000000":
        raise ApiError("bad_request", "That code didn't work. Try again.")
    role = challenge_id.removeprefix("tfc_") if challenge_id.startswith("tfc_") else "admin"
    return Session(user=STUB_USERS.get(role, STUB_USERS["admin"]))


@router.post("/two-factor/resend", status_code=202)
def resend_two_factor(body: dict = Body(...)):  # noqa: B008
    return {}


@router.post("/sign-out", status_code=204)
def sign_out():
    return None


@router.post("/forgot-password", status_code=202)
def forgot_password(body: dict = Body(...)):  # noqa: B008
    return {}


@router.post("/reset-password")
def reset_password(body: dict = Body(...)):  # noqa: B008
    code = body.get("code", "")
    if not _CODE_RE.match(code):
        raise ApiError("bad_request", "Enter the 6-digit code.")
    return {}


@router.get("/oauth/{provider}/start", status_code=302)
def start_oauth(provider: str, next: str | None = None):  # noqa: A002
    if provider not in ("google", "facebook"):
        raise ApiError("not_found", f"Unknown provider '{provider}'.")
    return {}


@router.get("/oauth/{provider}/callback", status_code=302)
def oauth_callback(provider: str):
    if provider not in ("google", "facebook"):
        raise ApiError("not_found", f"Unknown provider '{provider}'.")
    return {}
