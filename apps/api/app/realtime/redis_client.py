"""Production wiring for the shared Redis connection app/realtime/submissions.py's functions
need. Kept separate from that module (which takes its redis client as a parameter) so tests
can pass a fakeredis client directly instead of monkeypatching a cached singleton here.
"""

from functools import lru_cache

import redis
import redis.asyncio as redis_asyncio

from app.core.config import get_celery_settings


@lru_cache
def get_redis() -> redis.Redis:
    """Sync client — used by the Celery worker (app/worker/pipeline.py runs in a plain
    worker process, not an event loop)."""
    return redis.Redis.from_url(get_celery_settings().redis_url, decode_responses=True)


@lru_cache
def get_async_redis() -> redis_asyncio.Redis:
    """Async client — used by the API process's SSE endpoints (app/api/v1/submissions.py,
    app/api/v1/notifications.py)."""
    return redis_asyncio.Redis.from_url(get_celery_settings().redis_url, decode_responses=True)
