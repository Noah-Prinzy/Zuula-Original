"""Celery tasks for admin work that shouldn't hold up a request: recomputing every score after
a settings change, delivering a broadcast's SMS/email, and the periodic brigading check.
Each runs on the worker's own database connection (one event loop per task)."""

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_database_settings
from app.services import brigading, broadcasts
from app.services.recompute import recompute_reports
from app.worker import celery_app


async def _with_session(fn):
    engine = create_async_engine(get_database_settings().database_url, poolclass=NullPool)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as db:
            result = await fn(db)
            await db.commit()
            return result
    finally:
        await engine.dispose()


@celery_app.task(name="zuula.recompute_scores")
def recompute_scores(report_ids: list[str] | None = None) -> int:
    return asyncio.run(_with_session(lambda db: recompute_reports(db, report_ids)))


@celery_app.task(name="zuula.deliver_broadcast")
def deliver_broadcast(broadcast_id: str) -> dict:
    return asyncio.run(_with_session(lambda db: broadcasts.deliver_channels(db, broadcast_id)))


@celery_app.task(name="zuula.detect_brigading")
def detect_brigading() -> int:
    async def run(db):
        return len(await brigading.detect(db))

    return asyncio.run(_with_session(run))
