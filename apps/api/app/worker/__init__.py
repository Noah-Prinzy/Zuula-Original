"""Celery app. The real submit-flow pipeline lives in app/worker/pipeline.py (P2 Step 3);
imported at the bottom of this module so `celery -A app.worker.celery_app worker` (see
docker-compose.yml) registers its task without every caller needing to import it directly.
"""

from celery import Celery

from app.adapters.readiness import assert_production_ready
from app.core.config import get_celery_settings

# Same guard as the API (app/main.py): no stub adapters in production.
assert_production_ready()

_settings = get_celery_settings()

celery_app = Celery(
    "zuula",
    broker=_settings.celery_broker_url,
    backend=_settings.celery_result_backend,
)


@celery_app.task(name="zuula.ping")
def ping() -> str:
    return "pong"


# Periodic jobs, run by the `beat` service (docker-compose.yml).
celery_app.conf.beat_schedule = {
    "detect-brigading": {"task": "zuula.detect_brigading", "schedule": 300.0},
}

# After celery_app, so their `from app.worker import celery_app` resolves against this
# (already-populated) module.
from app.worker import admin_tasks, messaging, pipeline  # noqa: E402,F401
