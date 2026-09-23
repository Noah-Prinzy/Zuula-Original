"""Spotting coordinated rating ("brigading") for the admin Moderation screen (FR-ADMIN,
manipulation signals). ADR 0002 §4.

A deliberately simple heuristic, run every few minutes by Celery beat: many brand-new
accounts voting the same way on one report within a short window. Each finding becomes a
`manipulation_signals` row for an admin to look at; nothing is excluded automatically — the
admin decides (and can drop the accounts' ratings with `excludeRatings`, decision 6a). P4
can replace the heuristic behind the same function.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import new_id
from app.db.models import ManipulationSignal, Rating, User

WINDOW = timedelta(minutes=15)
NEW_ACCOUNT_AGE = timedelta(hours=48)
MIN_ACCOUNTS = 25


async def detect(db: AsyncSession, *, now: datetime | None = None) -> list[ManipulationSignal]:
    now = now or datetime.now(UTC)
    rows = await db.execute(
        select(Rating.report_id, Rating.vote, func.count())
        .join(User, User.id == Rating.user_id)
        .where(
            Rating.created_at >= now - WINDOW,
            User.created_at >= now - NEW_ACCOUNT_AGE,
            Rating.excluded_at.is_(None),
        )
        .group_by(Rating.report_id, Rating.vote)
        .having(func.count() >= MIN_ACCOUNTS)
    )
    found = []
    for report_id, vote, accounts in rows:
        already = (
            await db.scalars(
                select(ManipulationSignal.id).where(
                    ManipulationSignal.report_id == report_id,
                    ManipulationSignal.direction == vote,
                    ManipulationSignal.resolved_at.is_(None),
                )
            )
        ).first()
        if already:
            continue
        signal = ManipulationSignal(
            id=new_id("ms"),
            report_id=report_id,
            pattern=f"Accounts created in the last {int(NEW_ACCOUNT_AGE.total_seconds() // 3600)}h "
            "voting the same way",
            accounts=accounts,
            window=f"{int(WINDOW.total_seconds() // 60)} minutes",
            direction=vote,
            confidence=round(min(0.99, 0.5 + accounts / 200), 2),
            detected_at=now,
        )
        db.add(signal)
        found.append(signal)
    return found
