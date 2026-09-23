"""Database-enforced rules: the ones that must hold even if application code gets them wrong."""

from datetime import UTC, datetime

import pytest
from sqlalchemy import delete, insert, select, update
from sqlalchemy.exc import DBAPIError, IntegrityError

from app.db import models as m
from app.db.ids import next_report_id
from app.services.community import recompute_report_community


async def test_audit_log_rejects_updates(db):
    with pytest.raises(DBAPIError, match="append-only"):
        async with db.begin_nested():
            await db.execute(update(m.AuditLogEntry).values(detail="tampered"))


async def test_audit_log_rejects_deletes(db):
    with pytest.raises(DBAPIError, match="append-only"):
        async with db.begin_nested():
            await db.execute(delete(m.AuditLogEntry))


async def test_audit_log_accepts_inserts_after_the_seeded_ids(db):
    entry = m.AuditLogEntry(
        actor_id="u1",
        actor_name="Mary Akello",
        actor_role="admin",
        action="settings.update",
        target="Escalation thresholds",
        detail="test",
        ip="196.43.x.x",
    )
    db.add(entry)
    await db.flush()
    assert entry.id == 13  # seeded a3…a12; the identity sequence continues after them


async def test_a_report_has_at_most_one_open_review_case(db):
    # fc-2026-0152 already has the open sample case rc-0418.
    with pytest.raises(IntegrityError):
        async with db.begin_nested():
            await db.execute(
                insert(m.ReviewCase).values(
                    id="rc-dup",
                    report_id="fc-2026-0152",
                    reason="community-escalation",
                    sla_due_at=datetime(2026, 9, 30, tzinfo=UTC),
                )
            )


async def test_tracking_ids_must_match_the_contract_pattern(db):
    with pytest.raises(IntegrityError):
        async with db.begin_nested():
            await db.execute(insert(m.Submission).values(tracking_id="ZL-0000-00", type="text"))


async def test_report_ids_continue_after_the_sample_reports(db):
    # Sequences aren't transactional, so don't assume this is the session's first nextval.
    year, number = (await next_report_id(db)).removeprefix("fc-").split("-")
    assert year == str(datetime.now(UTC).year)
    assert len(number) == 4 and int(number) > 161  # after fc-2026-0161, the last sample


async def test_a_vote_is_weighted_by_the_role_it_was_cast_with(db):
    """ADR 0002 §4 (6a): promoting a user doesn't re-weight their existing votes; an admin
    excluding a user's ratings removes them from the score."""
    report = await db.get(m.FactCheckReport, "fc-2026-0158", with_for_update=True)
    before = report.inaccurate_expert

    db.add(m.Rating(report_id=report.id, user_id="u9", vote="inaccurate", rater_role="public"))
    await db.flush()
    await db.execute(update(m.User).where(m.User.id == "u9").values(role="expert"))
    score, _ = await recompute_report_community(db, report)
    assert report.inaccurate_expert == before  # still counted as public
    assert report.inaccurate_public >= 1

    await db.execute(
        update(m.Rating)
        .where(m.Rating.user_id == "u9", m.Rating.report_id == report.id)
        .values(excluded_at=datetime(2026, 9, 22, tzinfo=UTC))
    )
    score_after, _ = await recompute_report_community(db, report)
    assert score_after.total == score.total - 1


async def test_crossing_a_threshold_reports_the_previous_status(db):
    """fc-2026-0155 is `escalated` (142 ratings, low CCS). Enough fresh "inaccurate" votes to
    pass 200 ratings with CCS under 20 must flip it to `suspended` and say it changed."""
    report = await db.get(m.FactCheckReport, "fc-2026-0155", with_for_update=True)
    assert report.community_status == "escalated"
    voters = (
        await db.scalars(
            select(m.User.id)
            .where(m.User.id.like("seed-p%"))
            .where(
                m.User.id.not_in(select(m.Rating.user_id).where(m.Rating.report_id == report.id))
            )
            .limit(200)
        )
    ).all()
    db.add_all(
        m.Rating(report_id=report.id, user_id=u, vote="inaccurate", rater_role="public")
        for u in voters
    )
    await db.flush()
    score, previous = await recompute_report_community(db, report)
    assert score.status == "suspended"
    assert previous == "escalated"
    assert report.status_changed_at is not None
