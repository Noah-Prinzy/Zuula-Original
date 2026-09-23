"""A real PostgreSQL (+ pgvector) test database, for tests that need one.

Once per test session: drop and recreate the database named by TEST_DATABASE_URL, run every
Alembic migration (`upgrade head` — the same path production takes, not `create_all`), and load
the sample data (app/db/seed.py). Each test then gets a `db` session bound to one connection
inside an outer transaction that is rolled back afterwards, so tests can write freely without
seeing each other's changes and without reseeding.

Needs a reachable server whose user may create databases — CI runs `pgvector/pgvector:pg16`
as a service container (.github/workflows/api-ci.yml); locally, `docker compose up postgres`.
"""

import asyncio
import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.seed import seed

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+asyncpg://zuula:zuula@localhost:5432/zuula_test"
)
API_ROOT = Path(__file__).resolve().parents[2]


def alembic_config(url: str) -> Config:
    cfg = Config(str(API_ROOT / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", url)
    cfg.attributes["configure_logger"] = False  # keep pytest's own logging setup
    return cfg


async def recreate_database(url: str) -> None:
    target = make_url(url)
    admin = create_async_engine(
        target.set(database="postgres"), isolation_level="AUTOCOMMIT", poolclass=NullPool
    )
    async with admin.connect() as conn:
        await conn.execute(text(f'DROP DATABASE IF EXISTS "{target.database}" WITH (FORCE)'))
        await conn.execute(text(f'CREATE DATABASE "{target.database}"'))
    await admin.dispose()


async def _seed(url: str) -> None:
    engine = create_async_engine(url, poolclass=NullPool)
    async with AsyncSession(engine) as session:
        await seed(session)
        await session.commit()
    await engine.dispose()


@pytest.fixture(scope="session")
def migrated_db_url() -> str:
    asyncio.run(recreate_database(TEST_DATABASE_URL))
    command.upgrade(alembic_config(TEST_DATABASE_URL), "head")
    asyncio.run(_seed(TEST_DATABASE_URL))
    return TEST_DATABASE_URL


@pytest.fixture
async def db(migrated_db_url):
    engine = create_async_engine(migrated_db_url, poolclass=NullPool)
    async with engine.connect() as conn:
        outer = await conn.begin()
        # create_savepoint: a test's own session.commit() only releases a savepoint, so the
        # rollback below still undoes everything the test wrote.
        session = AsyncSession(
            bind=conn, join_transaction_mode="create_savepoint", expire_on_commit=False
        )
        try:
            yield session
        finally:
            await session.close()
            await outer.rollback()
    await engine.dispose()
