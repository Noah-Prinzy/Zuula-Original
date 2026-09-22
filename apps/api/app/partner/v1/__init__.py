from fastapi import APIRouter

from app.partner.v1 import checks, fact_checks

router = APIRouter(prefix="/v1")
router.include_router(checks.router)
router.include_router(fact_checks.router)
