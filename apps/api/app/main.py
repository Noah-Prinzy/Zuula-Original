from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as api_v1_router
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.partner.v1 import router as partner_v1_router
from app.webhooks import router as webhooks_router

settings = get_settings()

app = FastAPI(
    title="Zuula API",
    version="0.1.0",
    description=(
        "P2 skeleton — every endpoint returns stub data that validates against "
        "apps/api/openapi.yaml. See that file for the full contract."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(api_v1_router)
app.include_router(partner_v1_router)
app.include_router(webhooks_router)


@app.get("/healthz", tags=["health"])
def healthz():
    """Liveness — the process is up."""
    return {"status": "ok"}


@app.get("/readyz", tags=["health"])
def readyz():
    """Readiness — dependencies are reachable. Postgres/Redis checks land in P3 alongside
    the real database and worker; for now this just confirms the app itself is serving."""
    return {"status": "ok", "checks": {"app": "ok"}}
