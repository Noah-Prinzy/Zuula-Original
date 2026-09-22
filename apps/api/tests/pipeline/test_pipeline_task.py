import pytest

from app.realtime import redis_client
from app.realtime.submissions import load_state, new_state, save_state
from app.worker.pipeline import PIPELINES, run_submission_pipeline


@pytest.fixture
def r():
    return redis_client.get_redis()


@pytest.mark.parametrize("sub_type", sorted(PIPELINES))
def test_pipeline_runs_expected_steps_in_order(r, sub_type):
    tracking_id = f"ZL-TEST-{sub_type[:2].upper()}"
    save_state(r, tracking_id, new_state(tracking_id, content_type=sub_type, language="English"))

    run_submission_pipeline(
        tracking_id,
        content_type=sub_type,
        text="some submitted text",
        language="English",
        report_id="fc-test-1",
        preview="some submitted text",
    )

    state = load_state(r, tracking_id)
    assert state["status"] == "completed"
    assert [s["step"] for s in state["steps"]] == PIPELINES[sub_type]
    assert all(s["status"] == "done" for s in state["steps"])
    assert state["completedAt"] is not None
    assert state["result"]["trackingId"] == tracking_id
    assert state["result"]["verdict"] in (
        "authentic",
        "likely-false",
        "false",
        "ai-generated",
        "unverifiable",
    )


def test_pipeline_missing_state_is_a_noop(r):
    # No save_state() first — simulates the state TTL (app/realtime/submissions.py) expiring
    # before the worker got to it.
    run_submission_pipeline(
        "ZL-GONE-00",
        content_type="text",
        text="x",
        language="English",
        report_id="fc-x",
        preview="x",
    )
    assert load_state(r, "ZL-GONE-00") is None


def test_pipeline_fails_url_with_fail_in_preview(r):
    tracking_id = "ZL-FAIL-01"
    save_state(r, tracking_id, new_state(tracking_id, content_type="url", language="English"))

    run_submission_pipeline(
        tracking_id,
        content_type="url",
        text="https://example.com/fail-demo",
        language="English",
        report_id="fc-test-2",
        preview="https://example.com/fail-demo",
    )

    state = load_state(r, tracking_id)
    assert state["status"] == "failed"
    assert state["error"]["error"]["code"] == "invalid_content"
    # "received" ran to completion; "fetch" (PIPELINES["url"][1]) is where it fails, so it
    # never gets appended as a done step.
    assert [s["step"] for s in state["steps"]] == ["received"]
    assert state["result"] is None


def test_pipeline_url_without_fail_succeeds(r):
    tracking_id = "ZL-OK-URL"
    save_state(r, tracking_id, new_state(tracking_id, content_type="url", language="English"))

    run_submission_pipeline(
        tracking_id,
        content_type="url",
        text="https://example.com/some-article",
        language="English",
        report_id="fc-test-3",
        preview="https://example.com/some-article",
    )

    state = load_state(r, tracking_id)
    assert state["status"] == "completed"
