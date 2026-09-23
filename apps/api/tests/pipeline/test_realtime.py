import asyncio

from app.realtime import redis_client
from app.realtime.submissions import publish_done, publish_step, subscribe


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
