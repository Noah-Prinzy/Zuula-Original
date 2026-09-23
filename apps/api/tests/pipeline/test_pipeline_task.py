"""app/worker/pipeline.py's run_pipeline against the real test database (P3): step order per
submission type, the failure path, the report it writes, and what it triggers."""

import pytest
from sqlalchemy import select

from app.db import models as m
from app.services.submissions import chat_fields, create_submission, validate_input
from app.worker.pipeline import PIPELINES, run_pipeline

_INPUT = {
    "text": {"type": "text", "content": "Some submitted text long enough to check."},
    "url": {"type": "url", "url": "https://example.com/some-article"},
    "article": {"type": "article", "content": "An article body " * 5, "headline": "Headline"},
    "media": {"type": "media", "headline": "A photo"},
}


async def _submit(db, body, **kwargs):
    submission, _ = await create_submission(
        db, fields=validate_input(body), channel="web", **kwargs
    )
    await db.commit()
    return submission


@pytest.mark.parametrize("sub_type", sorted(PIPELINES))
async def test_pipeline_runs_expected_steps_and_writes_a_report(db, sub_type):
    s = await _submit(db, _INPUT[sub_type])
    await run_pipeline(db, s.tracking_id)

    await db.refresh(s)
    assert s.status == "completed"
    assert [step["step"] for step in s.steps] == PIPELINES[sub_type]
    assert all(step["status"] == "done" for step in s.steps)
    assert s.completed_at is not None

    report = (
        await db.scalars(
            select(m.FactCheckReport).where(m.FactCheckReport.tracking_id == s.tracking_id)
        )
    ).one()
    assert report.id.startswith("fc-")
    assert report.verdict in ("authentic", "likely-false", "false", "ai-generated", "unverifiable")
    assert report.ccs is None and report.community_status == "standard"


async def test_unknown_submission_is_a_noop(db):
    await run_pipeline(db, "ZL-GONE-22")  # nothing to do, nothing raised


async def test_a_redelivered_task_does_not_run_twice(db):
    s = await _submit(db, _INPUT["text"])
    await run_pipeline(db, s.tracking_id)
    await run_pipeline(db, s.tracking_id)  # Celery redelivery: already completed
    reports = await db.scalars(
        select(m.FactCheckReport).where(m.FactCheckReport.tracking_id == s.tracking_id)
    )
    assert len(reports.all()) == 1


async def test_url_with_fail_in_it_fails(db):
    s = await _submit(db, {"type": "url", "url": "https://example.com/fail-demo"})
    await run_pipeline(db, s.tracking_id)
    await db.refresh(s)
    assert s.status == "failed"
    assert s.error["error"]["code"] == "invalid_content"
    # "received" ran to completion; "fetch" is where it fails, so it's never a done step.
    assert [step["step"] for step in s.steps] == ["received"]


async def test_signed_in_submitter_is_notified(db):
    s = await _submit(db, _INPUT["text"], user_id="u6")
    await run_pipeline(db, s.tracking_id)
    note = (
        await db.scalars(
            select(m.Notification)
            .where(m.Notification.user_id == "u6", m.Notification.kind == "verdict-ready")
            .order_by(m.Notification.created_at.desc())
        )
    ).first()
    assert note is not None and note.href.startswith("/fact-checks/fc-")


async def test_low_confidence_verdicts_open_a_review_case(db, monkeypatch):
    from app.providers import analysis

    real = analysis.StubAnalysisProvider.analyze

    def low_confidence(self, **kwargs):
        result = real(self, **kwargs)
        result.confidence = 42
        return result

    monkeypatch.setattr(analysis.StubAnalysisProvider, "analyze", low_confidence)
    s = await _submit(db, _INPUT["text"])
    await run_pipeline(db, s.tracking_id)
    report = (
        await db.scalars(
            select(m.FactCheckReport).where(m.FactCheckReport.tracking_id == s.tracking_id)
        )
    ).one()
    case = (
        await db.scalars(select(m.ReviewCase).where(m.ReviewCase.report_id == report.id))
    ).one()
    assert case.reason == "low-confidence" and case.status == "open"


async def test_chat_messages_become_submissions():
    assert chat_fields("https://example.com/story")["type"] == "url"
    assert chat_fields("Is it true schools close next week?")["type"] == "text"
