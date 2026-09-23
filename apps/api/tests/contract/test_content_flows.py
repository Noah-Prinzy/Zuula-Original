"""Content behaviour end to end, through the contract-validating client (P3 PR 3, ADR 0002
§4 and §6): votes move scores, thresholds open review cases, suspended reports leave the
listings, decisions are audited and reach raters, submissions persist.

Setup the public API can't do (hundreds of other people's votes, flags from other users)
goes straight into the test's transaction with `client.run_db`.
"""

from datetime import UTC, datetime

from sqlalchemy import select

from app.db import models as m
from tests.contract.conftest import ADMIN, EXPERT, PARTNER_KEY, PUBLIC


def add_votes(client, report_id: str, vote: str, count: int, *, role: str = "public"):
    """`count` votes from sample raters who haven't voted on `report_id` yet."""

    async def insert(session):
        voted = select(m.Rating.user_id).where(m.Rating.report_id == report_id)
        users = await session.scalars(
            select(m.User.id)
            .where(m.User.id.like(f"seed-{role[0]}%"), m.User.id.not_in(voted))
            .limit(count)
        )
        now = datetime.now(UTC)
        session.add_all(
            m.Rating(
                report_id=report_id,
                user_id=u,
                vote=vote,
                rater_role=role,
                created_at=now,
                updated_at=now,
            )
            for u in users
        )

    client.run_db(insert)


def listed_ids(client, **params) -> set[str]:
    data = client.get("/api/v1/fact-checks", params={"perPage": 50, **params}).json()["data"]
    return {r["id"] for r in data}


class TestRatings:
    def test_a_vote_counts_once_and_can_change_or_be_retracted(self, core_client):
        url = "/api/v1/fact-checks/fc-2026-0142/ratings"
        before = core_client.get("/api/v1/fact-checks/fc-2026-0142").json()["community"]["score"]

        cast = core_client.post(url, json={"vote": "inaccurate"}, headers=PUBLIC).json()
        assert cast["inaccurateCount"] == before["inaccurateCount"] + 1
        again = core_client.post(url, json={"vote": "inaccurate"}, headers=PUBLIC).json()
        assert again == cast  # one person, one vote

        changed = core_client.post(url, json={"vote": "accurate"}, headers=PUBLIC).json()
        assert changed["inaccurateCount"] == before["inaccurateCount"]
        assert changed["accurateCount"] == before["accurateCount"] + 1

        retracted = core_client.delete(url, headers=PUBLIC).json()
        assert retracted["total"] == before["total"]

    def test_votes_are_weighted_by_role(self, core_client):
        url = "/api/v1/fact-checks/fc-2026-0142/ratings"
        before = core_client.get("/api/v1/fact-checks/fc-2026-0142").json()["community"]["score"]
        after = core_client.post(url, json={"vote": "accurate"}, headers=EXPERT).json()
        assert after["weightedAccurate"] == before["weightedAccurate"] + 5  # §9.1: expert 5×

    def test_admins_rate_at_the_public_weight(self, core_client):
        url = "/api/v1/fact-checks/fc-2026-0142/ratings"
        before = core_client.get("/api/v1/fact-checks/fc-2026-0142").json()["community"]["score"]
        after = core_client.post(url, json={"vote": "accurate"}, headers=ADMIN).json()
        assert after["weightedAccurate"] == before["weightedAccurate"] + 1

    def test_a_comment_is_also_a_rating(self, core_client):
        r = core_client.post(
            "/api/v1/fact-checks/fc-2026-0154/comments",
            json={"vote": "inaccurate", "body": "The photo is from 2020."},
            headers=PUBLIC,
        )
        assert r.status_code == 201
        comment = r.json()
        assert comment["author"] == "Amina Nakato" and comment["role"] == "public"
        listed = core_client.get("/api/v1/fact-checks/fc-2026-0154/comments").json()["data"]
        assert listed[0]["id"] == comment["id"]
        mine = core_client.get("/api/v1/me/ratings", headers=PUBLIC).json()["data"]
        assert any(r["reportId"] == "fc-2026-0154" and r["vote"] == "inaccurate" for r in mine)

    def test_rating_an_unknown_report_is_404(self, core_client):
        r = core_client.post(
            "/api/v1/fact-checks/fc-2026-9999/ratings", json={"vote": "accurate"}, headers=PUBLIC
        )
        assert r.status_code == 404


class TestEscalation:
    def test_crossing_the_escalation_threshold_opens_a_case(self, core_client):
        # fc-2026-0154: 72 ratings, no open case. 100 more "inaccurate" and one real vote
        # push it past 100 ratings with CCS ≤ 39 (§9.2).
        add_votes(core_client, "fc-2026-0154", "inaccurate", 100)
        score = core_client.post(
            "/api/v1/fact-checks/fc-2026-0154/ratings", json={"vote": "inaccurate"}, headers=PUBLIC
        ).json()
        assert score["status"] == "escalated"
        queue = core_client.get(
            "/api/v1/review/queue", params={"reason": "community-escalation"}, headers=EXPERT
        ).json()["data"]
        case = next(c for c in queue if c["reportId"] == "fc-2026-0154")
        assert case["priority"] == "high" and case["slaState"] == "on-track"

    def test_suspension_upgrades_the_open_case_and_hides_the_report(self, core_client):
        # fc-2026-0155 is escalated with open case rc-0417; enough "inaccurate" votes suspend it.
        assert "fc-2026-0155" in listed_ids(core_client)
        add_votes(core_client, "fc-2026-0155", "inaccurate", 200)
        score = core_client.post(
            "/api/v1/fact-checks/fc-2026-0155/ratings", json={"vote": "inaccurate"}, headers=PUBLIC
        ).json()
        assert score["status"] == "suspended"
        case = core_client.get("/api/v1/review/cases/rc-0417", headers=EXPERT).json()["case"]
        assert case["reason"] == "suspended"
        assert "fc-2026-0155" not in listed_ids(core_client)  # hidden from the Library …
        assert core_client.get("/api/v1/fact-checks/fc-2026-0155").status_code == 200  # … not gone

    def test_enough_user_reports_open_a_case(self, core_client):
        async def four_other_flags(session):
            now = datetime.now(UTC)
            session.add(
                m.ContentReport(
                    id="cr-test", report_id="fc-2026-0156", reason="Wrong", reported_at=now
                )
            )
            await session.flush()
            session.add_all(
                m.ContentFlag(
                    id=f"flag-{i}",
                    content_report_id="cr-test",
                    user_id=f"seed-p{i:03d}",
                    reason="Wrong",
                    created_at=now,
                )
                for i in range(1, 5)
            )

        core_client.run_db(four_other_flags)
        r = core_client.post(
            "/api/v1/fact-checks/fc-2026-0156/report-issue",
            json={"reason": "This verdict is wrong"},
            headers=PUBLIC,
        )
        assert r.status_code == 202
        queue = core_client.get(
            "/api/v1/review/queue", params={"reason": "user-reports"}, headers=EXPERT
        ).json()["data"]
        case = next(c for c in queue if c["reportId"] == "fc-2026-0156")
        assert case["reports"] == 5

    def test_reporting_twice_counts_once(self, core_client):
        for _ in range(2):
            core_client.post(
                "/api/v1/fact-checks/fc-2026-0142/report-issue",
                json={"reason": "x"},
                headers=PUBLIC,
            )

        async def count(session):
            return len(
                (
                    await session.scalars(
                        select(m.ContentFlag).where(m.ContentFlag.user_id == "u6")
                    )
                ).all()
            )

        assert core_client.run_db(count) == 1


class TestReviewDecisions:
    def test_override_changes_the_verdict_audits_and_tells_raters(self, core_client):
        # rc-0415 is on fc-2026-0159, which Amina (PUBLIC) has rated.
        r = core_client.post(
            "/api/v1/review/cases/rc-0415/decision",
            json={
                "outcome": "overridden",
                "verdict": "unverifiable",
                "justification": "No primary source either way yet.",
            },
            headers=EXPERT,
        )
        assert r.status_code == 200
        decision = r.json()
        assert decision["from"] == "likely-false" and decision["to"] == "unverifiable"
        assert decision["reviewer"] == "David Okello"

        report = core_client.get("/api/v1/fact-checks/fc-2026-0159").json()
        assert report["verdict"] == "unverifiable"
        assert report["humanReview"]["outcome"] == "overridden"
        assert report["humanReview"]["previousVerdict"] == "likely-false"

        audit = core_client.get(
            "/api/v1/admin/audit-log", params={"action": "verdict.override"}, headers=ADMIN
        ).json()["data"][0]
        assert audit["target"] == "fc-2026-0159" and audit["actorRole"] == "expert"
        assert audit["detail"].startswith("Likely False → Unverifiable")

        notes = core_client.get("/api/v1/notifications", headers=PUBLIC).json()["data"]
        assert notes[0]["kind"] == "review-outcome"
        assert "Unverifiable" in notes[0]["body"]

        history = core_client.get("/api/v1/review/history", headers=EXPERT).json()["data"]
        assert history[0]["id"] == decision["id"]

    def test_a_case_is_decided_once(self, core_client):
        body = {"outcome": "confirmed", "justification": "Checked against the source."}
        url = "/api/v1/review/cases/rc-0416/decision"
        assert core_client.post(url, json=body, headers=EXPERT).status_code == 200
        second = core_client.post(url, json=body, headers=EXPERT)
        assert second.status_code == 409 and second.json()["error"]["code"] == "conflict"

    def test_a_decision_does_not_relist_a_suspended_report(self, core_client):
        # Decision 7: rc-0418 is on the suspended fc-2026-0152.
        core_client.post(
            "/api/v1/review/cases/rc-0418/decision",
            json={"outcome": "confirmed", "justification": "The clip is synthetic."},
            headers=EXPERT,
        )
        assert "fc-2026-0152" not in listed_ids(core_client)

    def test_assigning_to_a_non_reviewer_is_refused(self, core_client):
        r = core_client.post(
            "/api/v1/review/cases/rc-0418/assign", json={"assigneeId": "u6"}, headers=EXPERT
        )
        assert r.status_code == 404
        mine = core_client.post("/api/v1/review/cases/rc-0418/assign", json={}, headers=EXPERT)
        assert mine.json()["assignee"] == "David Okello"


class TestSubmissions:
    def test_signed_in_submissions_are_history_and_notify(self, core_client):
        created = core_client.post(
            "/api/v1/submissions",
            json={"type": "text", "content": "A claim that is long enough to be checked."},
            headers=PUBLIC,
        ).json()
        mine = core_client.get("/api/v1/me/submissions", headers=PUBLIC).json()["data"]
        assert mine[0]["trackingId"] == created["trackingId"]
        assert mine[0]["status"] == "complete" and mine[0]["reportId"].startswith("fc-")
        notes = core_client.get("/api/v1/notifications", headers=PUBLIC).json()["data"]
        assert notes[0]["kind"] == "verdict-ready"
        assert notes[0]["href"] == f"/fact-checks/{mine[0]['reportId']}"

    def test_idempotency_key_returns_the_same_submission(self, core_client):
        body = {"type": "text", "content": "The same claim, sent twice by a retry."}
        headers = {**PUBLIC, "Idempotency-Key": "retry-123"}
        first = core_client.post("/api/v1/submissions", json=body, headers=headers).json()
        second = core_client.post("/api/v1/submissions", json=body, headers=headers).json()
        assert first["trackingId"] == second["trackingId"]

    def test_too_short_text_is_rejected(self, core_client):
        r = core_client.post(
            "/api/v1/submissions", json={"type": "text", "content": "short"}, headers=PUBLIC
        )
        assert r.status_code == 422

    def test_partner_checks_are_stored_against_the_key(self, partner_client):
        created = partner_client.post(
            "/v1/checks",
            json={"type": "text", "content": "A partner newsroom's claim to check."},
            headers=PARTNER_KEY,
        ).json()
        status = partner_client.get(f"/v1/checks/{created['trackingId']}", headers=PARTNER_KEY)
        assert status.status_code == 200
        assert status.json()["status"] == "completed"
        assert "submittedText" not in status.json()["result"]  # the partner report shape

    def test_whatsapp_messages_become_submissions(self, core_client):
        payload = {
            "entry": [
                {
                    "changes": [
                        {
                            "value": {
                                "messages": [
                                    {
                                        "from": "256700000001",
                                        "text": {"body": "Is it true that exams are cancelled?"},
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }
        assert core_client.post("/webhooks/whatsapp", json=payload).status_code == 200

        async def chat_submission(session):
            return (
                await session.scalars(
                    select(m.Submission).where(m.Submission.channel_ref == "256700000001")
                )
            ).one()

        s = core_client.run_db(chat_submission)
        assert s.channel == "whatsapp" and s.status == "completed"


class TestLibrary:
    def test_search_matches_every_word(self, core_client):
        ids = listed_ids(core_client, q="free internet")
        assert "fc-2026-0142" in ids
        assert "fc-2026-0161" not in ids

    def test_filters_and_sort(self, core_client):
        data = core_client.get(
            "/api/v1/fact-checks", params={"verdict": "false,likely-false", "sort": "newest"}
        ).json()["data"]
        assert data and all(r["verdict"] in ("false", "likely-false") for r in data)
        dates = [r["checkedAt"] for r in data]
        assert dates == sorted(dates, reverse=True)

    def test_per_page_is_honoured(self, core_client):
        body = core_client.get("/api/v1/fact-checks", params={"perPage": 2}).json()
        assert len(body["data"]) == 2 and body["perPage"] == 2

    def test_related_share_a_topic_and_exclude_suspended(self, core_client):
        related = core_client.get(
            "/api/v1/fact-checks/fc-2026-0153/related", params={"limit": 10}
        ).json()
        assert related and all(r["id"] != "fc-2026-0152" for r in related)


class TestNotifications:
    def test_stream_resumes_after_the_last_event_seen(self, core_client):
        fresh = core_client.get("/api/v1/notifications/stream", headers=PUBLIC).text
        assert fresh.count("event: notification") == 3  # Amina's three unread (n1–n3)
        resumed = core_client.get(
            "/api/v1/notifications/stream", headers={**PUBLIC, "Last-Event-ID": "n2"}
        ).text
        assert resumed.count("event: notification") == 1 and "id: n1" in resumed

    def test_read_state(self, core_client):
        core_client.post("/api/v1/notifications/n1/read", headers=PUBLIC)
        unread = core_client.get(
            "/api/v1/notifications", params={"unreadOnly": True}, headers=PUBLIC
        ).json()
        assert {n["id"] for n in unread["data"]} == {"n2", "n3"}
        core_client.post("/api/v1/notifications/read-all", headers=PUBLIC)
        unread = core_client.get(
            "/api/v1/notifications", params={"unreadOnly": True}, headers=PUBLIC
        ).json()
        assert unread["total"] == 0

    def test_alert_settings_persist_and_emergencies_stay_on(self, core_client):
        r = core_client.patch(
            "/api/v1/me/alert-settings",
            json={"topics": ["Elections"], "notifyOn": {"emergencyBroadcasts": False}},
            headers=PUBLIC,
        ).json()
        assert r["topics"] == ["Elections"] and r["notifyOn"]["emergencyBroadcasts"] is True
        again = core_client.get("/api/v1/me/alert-settings", headers=PUBLIC).json()
        assert again["topics"] == ["Elections"]


class TestLeaderboard:
    def test_ranked_like_the_frontend(self, core_client):
        """apps/web/lib/library.ts's leaderboard(): the Wilson lower bound on the weighted CCS
        share, at least 25 ratings, suspended excluded."""
        import math

        def bound(score, z=1.96):
            n = score["total"]
            weighted = score["weightedAccurate"] + score["weightedInaccurate"]
            p = score["weightedAccurate"] / weighted
            z2 = z * z
            return (p + z2 / (2 * n) - z * math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / (
                1 + z2 / n
            )

        leaders = core_client.get("/api/v1/fact-checks/home-feed").json()["leaderboard"]
        assert leaders
        scores = [entry["score"] for entry in leaders]
        assert all(s["total"] >= 25 and s["status"] != "suspended" for s in scores)
        ranks = [bound(s) for s in scores]
        assert ranks == sorted(ranks, reverse=True)
