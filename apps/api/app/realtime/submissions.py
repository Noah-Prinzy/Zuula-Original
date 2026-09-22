"""Shared submission-progress state: written by the Celery worker (app/worker/pipeline.py)
as it runs a submission through the pipeline, read by the API process
(app/api/v1/submissions.py) to answer GET /api/v1/submissions/{trackingId} and stream
GET .../events. The two run as separate processes (docker-compose.yml's api vs worker
services), so this can't be an in-memory dict — Redis is the only thing both sides share,
and doubles as pub/sub so the SSE endpoint doesn't have to poll.

Every function here takes its redis client as a parameter rather than resolving one itself
(see app/realtime/redis_client.py for that), so tests can pass a fakeredis client without
needing a live Redis server.
"""

import json
from datetime import UTC, datetime
from typing import Any

# No DB yet (P3 adds one) — state disappears after an hour. Fine for a demo; a real
# submission's row would simply outlive this cache.
STATE_TTL_SECONDS = 3600


def _state_key(tracking_id: str) -> str:
    return f"zuula:submission:{tracking_id}:state"


def _channel(tracking_id: str) -> str:
    return f"zuula:submission:{tracking_id}:events"


def new_state(tracking_id: str, *, content_type: str, language: str) -> dict[str, Any]:
    return {
        "trackingId": tracking_id,
        "status": "queued",
        "contentType": content_type,
        "language": language,
        "submittedAt": datetime.now(UTC).isoformat(),
        "completedAt": None,
        "steps": [],
        "result": None,
        "error": None,
    }


def save_state(redis_client, tracking_id: str, state: dict[str, Any]) -> None:
    redis_client.set(_state_key(tracking_id), json.dumps(state), ex=STATE_TTL_SECONDS)


def load_state(redis_client, tracking_id: str) -> dict[str, Any] | None:
    raw = redis_client.get(_state_key(tracking_id))
    return json.loads(raw) if raw else None


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
