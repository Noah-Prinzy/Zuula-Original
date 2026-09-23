"""Live submission progress over Redis pub/sub: the Celery worker (app/worker/pipeline.py)
publishes each step as it runs, and the API's SSE endpoint
(GET /api/v1/submissions/{trackingId}/events) forwards them to the browser.

Submission *state* lives in PostgreSQL since P3 (the `submissions` table; ADR 0002 §6) —
Redis carries only the live events, so nothing here expires or needs to be durable. Every
function takes its redis client as a parameter, so tests can pass a fakeredis client.
"""

import json
from typing import Any


def _channel(tracking_id: str) -> str:
    return f"zuula:submission:{tracking_id}:events"


def publish_step(redis_client, tracking_id: str, step: dict[str, Any]) -> None:
    redis_client.publish(_channel(tracking_id), json.dumps({"type": "step", "step": step}))


def publish_done(redis_client, tracking_id: str, state: dict[str, Any]) -> None:
    redis_client.publish(_channel(tracking_id), json.dumps({"type": "done", "state": state}))


def publish_failed(redis_client, tracking_id: str, state: dict[str, Any]) -> None:
    redis_client.publish(_channel(tracking_id), json.dumps({"type": "failed", "state": state}))


async def subscribe(async_redis_client, tracking_id: str):
    """Async generator yielding decoded pub/sub messages ({"type": "step"|"done"|"failed",
    ...}) for one submission's channel, until the connection is closed by the caller
    (breaking out of a `async for` over this stops iteration and tears the subscription
    down via the `async with` below)."""
    pubsub = async_redis_client.pubsub()
    async with pubsub:
        await pubsub.subscribe(_channel(tracking_id))
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            yield json.loads(message["data"])
