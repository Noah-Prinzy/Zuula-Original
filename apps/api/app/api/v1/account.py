from fastapi import Body, Depends

from app.core.errors import ApiError
from app.core.pagination import PageParams, page_params, paginate
from app.core.router import APIRouter
from app.core.security import require_roles
from app.schemas.account import AccreditationStatus, UserProfile
from app.stubs.account import SAMPLE_API_USAGE, SAMPLE_RATINGS, SAMPLE_SESSIONS, SAMPLE_SUBMISSIONS

router = APIRouter(tags=["account"])

_signed_in = require_roles()  # any signed-in role


@router.get("/me", response_model=UserProfile)
def get_me(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return user


@router.patch("/me", response_model=UserProfile)
def update_me(body: dict = Body(...), user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return user.model_copy(update={k: v for k, v in body.items() if k in UserProfile.model_fields})


@router.delete("/me", status_code=202)
def delete_me(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return {}


@router.post("/me/password")
def change_password(body: dict = Body(...), user: UserProfile = Depends(_signed_in)):  # noqa: B008
    if not body.get("currentPassword") or not body.get("newPassword"):
        raise ApiError("bad_request", "currentPassword and newPassword are required.")
    return {}


@router.post("/me/two-factor")
def set_two_factor(body: dict = Body(...), user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return {}


@router.get("/me/sessions", response_model=list)
def list_sessions(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return [s.model_dump(by_alias=True, exclude_none=True) for s in SAMPLE_SESSIONS]


@router.delete("/me/sessions/{id}", status_code=204)
def revoke_session(id: str, user: UserProfile = Depends(_signed_in)):  # noqa: A002, B008
    return None


@router.get("/me/data-export")
def export_my_data(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return {
        "profile": user.model_dump(by_alias=True, exclude_none=True),
        "submissions": [],
        "ratings": [],
        "comments": [],
    }


@router.get("/me/verification", response_model=AccreditationStatus)
def get_verification(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return AccreditationStatus(status="none")


@router.post("/me/verification", status_code=202)
async def apply_for_verification(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return {}


@router.get("/me/submissions", response_model=None)
def list_my_submissions(
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_signed_in),  # noqa: B008
):
    items, meta = paginate(SAMPLE_SUBMISSIONS, params)
    return {
        "data": [i.model_dump(by_alias=True, mode="json", exclude_none=True) for i in items],
        **meta,
    }


@router.get("/me/ratings", response_model=None)
def list_my_ratings(
    params: PageParams = Depends(page_params),  # noqa: B008
    user: UserProfile = Depends(_signed_in),  # noqa: B008
):
    items, meta = paginate(SAMPLE_RATINGS, params)
    return {
        "data": [i.model_dump(by_alias=True, mode="json", exclude_none=True) for i in items],
        **meta,
    }


@router.get("/me/api-usage")
def get_api_usage(user: UserProfile = Depends(_signed_in)):  # noqa: B008
    return SAMPLE_API_USAGE
