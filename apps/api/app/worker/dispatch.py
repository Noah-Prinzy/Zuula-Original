"""Handing committed work to the Celery worker.

Production: Celery tasks, run by the worker process against its own database connection. The
rows a task reads must be committed first — callers commit, then dispatch.

The contract tests replace these functions (tests/contract/conftest.py) with ones that await
the same work inline on the test's own database connection, so a request's effects are
complete when it returns and everything stays inside the test's rolled-back transaction.
"""


async def dispatch_pipeline(tracking_id: str) -> None:
    from app.worker.pipeline import run_submission_pipeline

    run_submission_pipeline.delay(tracking_id)


async def dispatch_recompute(report_ids: list[str] | None = None) -> None:
    """Recompute community scores (all reports when None): after a weight/threshold change,
    or after a user's ratings were dropped or restored."""
    from app.worker.admin_tasks import recompute_scores

    recompute_scores.delay(report_ids)


async def dispatch_broadcast(broadcast_id: str) -> None:
    """Deliver a broadcast over its SMS/email channels (in-app is written synchronously)."""
    from app.worker.admin_tasks import deliver_broadcast

    deliver_broadcast.delay(broadcast_id)


async def dispatch_message(channel: str, to: str, body: str, subject: str | None = None) -> None:
    """Send one SMS ("sms") or email ("email") from the worker: codes, alerts, broadcasts."""
    from app.worker.messaging import send_message

    send_message.delay(channel, to, body, subject)
