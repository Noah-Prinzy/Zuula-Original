from fastapi import APIRouter

from app.webhooks import telegram, whatsapp

router = APIRouter()
router.include_router(whatsapp.router)
router.include_router(telegram.router)
