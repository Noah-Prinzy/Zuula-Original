"""Human-readable ids that need the database: fact-check report numbers."""

from datetime import UTC, datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def next_report_id(session: AsyncSession, *, now: datetime | None = None) -> str:
    """`fc-2026-0162`: the year it was checked plus a platform-wide running number (from the
    `fact_check_report_number_seq` sequence, so concurrent workers never collide). Library
    URLs are built from these, which is why they aren't random."""
    number = (
        await session.execute(text("SELECT nextval('fact_check_report_number_seq')"))
    ).scalar_one()
    year = (now or datetime.now(UTC)).year
    return f"fc-{year}-{number:04d}"
