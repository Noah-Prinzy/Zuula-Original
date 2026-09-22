from fastapi import APIRouter

from app.api.v1 import (
    account,
    admin,
    api_keys,
    auth,
    fact_checks,
    notifications,
    ratings,
    review,
    submissions,
)

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(account.router)
router.include_router(api_keys.router)
router.include_router(submissions.router)
router.include_router(fact_checks.router)
router.include_router(ratings.router)
router.include_router(review.router)
router.include_router(notifications.router)
router.include_router(admin.router)
