import asyncio

from app.realtime import redis_client
from app.realtime.submissions import (
    load_state,
    new_state,
    publish_done,
    publish_step,
    save_state,
    subscribe,
)


def test_state_round_trips_through_redis():
    r = redis_client.get_redis()
    state = new_state("ZL-STATE-1", content_type="text", language="English")
    save_state(r, "ZL-STATE-1", state)
    loaded = load_state(r, "ZL-STATE-1")
    assert loaded == state


def test_load_state_missing_returns_none():
    assert load_state(redis_client.get_redis(), "ZL-NOPE-00") is None


async def test_subscribe_yields_published_step_event():
    tracking_id = "ZL-PUBSUB-1"
    async_r = redis_client.get_async_redis()
    gen = subscribe(async_r, tracking_id)

    # anext() only returns once the subscription is actually attached server-side, so
    # publishing from a task scheduled right after starting it is safe — there's no need for
    # an artificial delay to "let the subscriber attach first".
    async def consume():
        return await anext(gen)

    consumer = asyncio.ensure_future(consume())
    await asyncio.sleep(0.05)
    publish_step(
        redis_client.get_redis(), tracking_id, {"step": "received", "status": "done", "seconds": 0.6}
    )

    message = await consumer
    await gen.aclose()

    assert message == {"type": "step", "step": {"step": "received", "status": "done", "seconds": 0.6}}


async def test_subscribe_yields_published_done_event():
    tracking_id = "ZL-PUBSUB-2"
    async_r = redis_client.get_async_redis()
    gen = subscribe(async_r, tracking_id)

    async def consume():
        return await anext(gen)

    consumer = asyncio.ensure_future(consume())
    await asyncio.sleep(0.05)
    publish_done(redis_client.get_redis(), tracking_id, {"trackingId": tracking_id, "status": "completed"})

    message = await consumer
    await gen.aclose()

    assert message["type"] == "done"
    assert message["state"]["trackingId"] == tracking_id
