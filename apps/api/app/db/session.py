"""Async engine/session wiring.

`get_db()` is the FastAPI dependency routers use from PR 2 on: one `AsyncSession` per
request, committed by the caller's service code, rolled back if the request raises. Tests
override it (tests/db/conftest.py) to bind every session to one connection inside an outer
transaction that is rolled back after each test.
"""

from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_database_settings


@lru_cache
def get_engine() -> AsyncEngine:
    settings = get_database_settings()
    return create_async_engine(
        settings.database_url,
        pool_size=settings.database_pool_size,
        pool_pre_ping=True,
        echo=settings.database_echo,
    )


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    # expire_on_commit=False: routers serialize ORM objects after committing; expiring them
    # would force a lazy reload, which async sessions can't do implicitly.
    return async_sessionmaker(get_engine(), expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with get_sessionmaker()() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
