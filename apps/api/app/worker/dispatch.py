"""Handing a committed submission to the pipeline.

Production: a Celery task (`run_submission_pipeline.delay`), run by the worker process
against its own database connection. The submission row must be committed first — callers
commit, then dispatch.

The contract tests replace `dispatch_pipeline` (tests/contract/conftest.py) with one that
awaits app.worker.pipeline.run_pipeline directly on the test's own database connection, so a
POST is immediately followed by a completed submission without a live worker, and everything
stays inside the test's rolled-back transaction.
"""


async def dispatch_pipeline(tracking_id: str) -> None:
    from app.worker.pipeline import run_submission_pipeline

    run_submission_pipeline.delay(tracking_id)
