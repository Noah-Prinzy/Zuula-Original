"""Celery app. P2 Step 2 scope: just enough to prove `docker compose up` runs a working
worker process end to end. The real submit-flow pipeline (ClamAV/S3/Whisper/analysis/verdict
stages, emitting SubmissionStepEvent-shaped progress) is P2 Step 3 — see the P2 brief, §3
Step 3 and §4's "pipeline" agent scope (app/worker/**, app/realtime/**, app/providers/analysis*).
"""

from celery import Celery

from app.core.config import get_celery_settings

_settings = get_celery_settings()

celery_app = Celery(
    "zuula",
    broker=_settings.celery_broker_url,
    backend=_settings.celery_result_backend,
)


@celery_app.task(name="zuula.ping")
def ping() -> str:
    return "pong"
