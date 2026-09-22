"""Session-wide test setup, shared by tests/contract/ and tests/pipeline/:

- A fake Redis (sync + async, same underlying FakeServer so both sides see the same data)
  in place of a live server — app.api.v1.submissions and app.worker.pipeline both go through
  app.realtime.redis_client's get_redis()/get_async_redis(), so patching those two functions
  covers every call site.
- Celery running tasks synchronously ("eager") instead of needing a live worker — every POST
  /api/v1/submissions call in tests/contract/ enqueues a real pipeline task, and the tests
  expect its result to be visible immediately after the request returns.
"""

import fakeredis
import pytest

from app.core.config import get_analysis_settings
from app.realtime import redis_client
from app.worker import celery_app


@pytest.fixture(autouse=True, scope="session")
def _fake_redis_and_eager_celery():
    server = fakeredis.FakeServer()
    fake_sync = fakeredis.FakeRedis(server=server, decode_responses=True)
    fake_async = fakeredis.FakeAsyncRedis(server=server, decode_responses=True)

    redis_client.get_redis.cache_clear()
    redis_client.get_async_redis.cache_clear()
    redis_client.get_redis = lambda: fake_sync
    redis_client.get_async_redis = lambda: fake_async

    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True

    # Real per-step sleeps (up to ~3s each) would make the suite take minutes; 0 still
    # exercises every branch of app/worker/pipeline.py without the wait.
    get_analysis_settings.cache_clear()
    get_analysis_settings().pipeline_step_scale = 0.0

    yield
