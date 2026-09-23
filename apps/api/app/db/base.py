"""Declarative base, shared column helpers and id generation for every model in app/db/models/.

Primary keys are `text`, not integers or UUIDs, so the ids the contract, the frontend and
the P2 sample data already use (`u1`, `fc-2026-0142`, `ZL-7K3P-Q9`, `rc-0418`) are stored
as-is. New rows get a prefixed random id from `new_id()` (ADR 0002 §2).
"""

import secrets
from datetime import UTC, datetime

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Deterministic constraint names, so Alembic autogenerate produces stable, reviewable
# migrations instead of relying on Postgres' generated names.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def new_id(prefix: str) -> str:
    """`usr_3f9a0c1d2e4b5a6c` — 64 random bits, prefixed by kind so an id in a log line says
    what it points at."""
    return f"{prefix}_{secrets.token_hex(8)}"


def utcnow() -> datetime:
    return datetime.now(UTC)


def created_at_column() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), default=utcnow)


def in_check(column: str, values: tuple[str, ...] | list[str]) -> str:
    """SQL for a CHECK constraint limiting a text column to a fixed set. Plain CHECKs rather
    than Postgres ENUM types: adding a value later is a one-line constraint swap instead of
    an `ALTER TYPE` that can't run inside a transaction on older servers."""
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"{column} IN ({quoted})"
