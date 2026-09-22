"""Every route below is hit through openapi_core's FastAPI middleware, which validates both
the request and the response against apps/api/openapi.yaml and raises on any mismatch. If a
test here fails, either the code doesn't match the contract or the contract doesn't match the
code — both are bugs. This is the check Step 1 promised: "every endpoint returns stub data
that validates against openapi.yaml."
"""

from pathlib import Path

import pytest
from openapi_core import OpenAPI
from openapi_core.contrib.fastapi.middlewares import FastAPIOpenAPIMiddleware
from starlette.testclient import TestClient

from app.main import app as _app

SPEC_PATH = Path(__file__).parent.parent.parent / "openapi.yaml"


@pytest.fixture(scope="session")
def validated_app():
    # Wrap _app instead of calling _app.add_middleware(...): that would mutate the shared
    # module-level app singleton in place, which would also affect
    # test_health_endpoints_not_in_contract_but_still_ok's supposedly-unvalidated plain client
    # below (import order/fixture caching would make that test order-dependent otherwise).
    spec = OpenAPI.from_file_path(str(SPEC_PATH))
    return FastAPIOpenAPIMiddleware(_app, openapi=spec)


@pytest.fixture
def core_client(validated_app):
    # Matches the `https://zuula.ug` server entry openapi.yaml declares for /api/v1/*.
    # openapi.yaml's sessionAuth scheme is an apiKey cookie — openapi-core enforces the
    # cookie's mere *presence* on any operation that doesn't override security, independently
    # of app.core.security's own (unrelated, P2-stub) X-Zuula-Role header check. Without this
    # dummy cookie, openapi-core would short-circuit every authenticated request itself before
    # it ever reaches our app, so the app's own 401/403 logic (what these tests exercise) would
    # never run. The app doesn't read this cookie at all — it only decides auth via the role
    # header, so its absence still correctly yields the app's own 401.
    client = TestClient(validated_app, base_url="https://zuula.ug", raise_server_exceptions=True)
    client.cookies.set("zuula_session", "stub")
    return client


@pytest.fixture
def partner_client(validated_app):
    # Matches the `https://api.zuula.ug` server override openapi.yaml declares for /v1/*.
    # Same reasoning as core_client's cookie: a default (deliberately invalid) bearer token
    # satisfies openapi-core's presence check for the partnerApiKey scheme so requests reach
    # app.core.security.require_partner_key, which still correctly rejects it with 401 — same
    # outcome as no key at all, which is what TestPartnerApi.test_no_key_rejected checks.
    client = TestClient(validated_app, base_url="https://api.zuula.ug", raise_server_exceptions=True)
    client.headers.update({"Authorization": "Bearer stub_unauthenticated"})
    return client


ADMIN = {"X-Zuula-Role": "admin"}
EXPERT = {"X-Zuula-Role": "expert"}
JOURNALIST = {"X-Zuula-Role": "journalist"}
PUBLIC = {"X-Zuula-Role": "public"}
PARTNER_KEY = {"Authorization": "Bearer zl_live_testkey1234567890abcdef"}

REPORT_IDS = [
    "fc-2026-0142",
    "fc-2026-0157",
    "fc-2026-0161",
    "fc-2026-0156",  # authentic verdict, exercises a different code path
    "fc-2026-0158",  # unverifiable verdict, no claims
]


class TestPublicCore:
    def test_search(self, core_client):
        r = core_client.get("/api/v1/fact-checks", params={"q": "internet"})
        assert r.status_code == 200

    def test_search_all_sorts(self, core_client):
        for sort in ("relevance", "newest", "most-rated"):
            r = core_client.get("/api/v1/fact-checks", params={"sort": sort})
            assert r.status_code == 200, sort

    def test_facets(self, core_client):
        assert core_client.get("/api/v1/fact-checks/facets").status_code == 200

    def test_home_feed(self, core_client):
        assert core_client.get("/api/v1/fact-checks/home-feed").status_code == 200

    @pytest.mark.parametrize("report_id", REPORT_IDS)
    def test_get_fact_check(self, core_client, report_id):
        r = core_client.get(f"/api/v1/fact-checks/{report_id}")
        assert r.status_code == 200, r.text

    @pytest.mark.parametrize("report_id", REPORT_IDS)
    def test_related(self, core_client, report_id):
        r = core_client.get(f"/api/v1/fact-checks/{report_id}/related")
        assert r.status_code == 200, r.text

    def test_get_fact_check_not_found(self, core_client):
        assert core_client.get("/api/v1/fact-checks/does-not-exist").status_code == 404

    def test_comments(self, core_client):
        r = core_client.get("/api/v1/fact-checks/fc-2026-0142/comments")
        assert r.status_code == 200, r.text


class TestAuth:
    def test_sign_up(self, core_client):
        r = core_client.post(
            "/api/v1/auth/sign-up",
            json={"name": "Test User", "identifier": "test@example.com", "password": "x" * 12, "consent": True},
        )
        assert r.status_code == 202

    def test_sign_in_public(self, core_client):
        r = core_client.post(
            "/api/v1/auth/sign-in", json={"identifier": "user@example.com", "password": "x"}
        )
        assert r.status_code == 200

    def test_sign_in_needs_two_factor(self, core_client):
        r = core_client.post(
            "/api/v1/auth/sign-in", json={"identifier": "expert@zuula.ug", "password": "x"}
        )
        assert r.status_code == 200

    def test_sign_in_unauthorized(self, core_client):
        r = core_client.post("/api/v1/auth/sign-in", json={"identifier": "", "password": ""})
        assert r.status_code == 401

    def test_two_factor_verify(self, core_client):
        r = core_client.post(
            "/api/v1/auth/two-factor/verify", json={"challengeId": "tfc_admin", "code": "123456"}
        )
        assert r.status_code == 200

    def test_forgot_password(self, core_client):
        r = core_client.post("/api/v1/auth/forgot-password", json={"identifier": "a@b.com"})
        assert r.status_code == 202

    def test_reset_password(self, core_client):
        r = core_client.post(
            "/api/v1/auth/reset-password",
            json={"identifier": "a@b.com", "code": "123456", "password": "x" * 12},
        )
        assert r.status_code == 200

    def test_sign_out(self, core_client):
        assert core_client.post("/api/v1/auth/sign-out").status_code == 204


class TestAccount:
    def test_me_requires_auth(self, core_client):
        assert core_client.get("/api/v1/me").status_code == 401

    def test_me(self, core_client):
        r = core_client.get("/api/v1/me", headers=PUBLIC)
        assert r.status_code == 200

    def test_update_me(self, core_client):
        r = core_client.patch("/api/v1/me", json={"name": "New Name"}, headers=PUBLIC)
        assert r.status_code == 200

    def test_change_password(self, core_client):
        r = core_client.post(
            "/api/v1/me/password",
            json={"currentPassword": "old", "newPassword": "x" * 12},
            headers=PUBLIC,
        )
        assert r.status_code == 200

    def test_sessions(self, core_client):
        assert core_client.get("/api/v1/me/sessions", headers=PUBLIC).status_code == 200

    def test_revoke_session(self, core_client):
        assert core_client.delete("/api/v1/me/sessions/d1", headers=PUBLIC).status_code == 204

    def test_data_export(self, core_client):
        assert core_client.get("/api/v1/me/data-export", headers=PUBLIC).status_code == 200

    def test_verification(self, core_client):
        assert core_client.get("/api/v1/me/verification", headers=PUBLIC).status_code == 200

    def test_my_submissions(self, core_client):
        assert core_client.get("/api/v1/me/submissions", headers=PUBLIC).status_code == 200

    def test_my_ratings(self, core_client):
        assert core_client.get("/api/v1/me/ratings", headers=PUBLIC).status_code == 200

    def test_api_usage(self, core_client):
        assert core_client.get("/api/v1/me/api-usage", headers=PUBLIC).status_code == 200


class TestApiKeys:
    def test_forbidden_for_public(self, core_client):
        assert core_client.get("/api/v1/me/api-keys", headers=PUBLIC).status_code == 403

    def test_list(self, core_client):
        assert core_client.get("/api/v1/me/api-keys", headers=JOURNALIST).status_code == 200

    def test_create(self, core_client):
        r = core_client.post(
            "/api/v1/me/api-keys", json={"name": "x", "scopes": ["read"]}, headers=JOURNALIST
        )
        assert r.status_code == 201

    def test_revoke(self, core_client):
        assert core_client.delete("/api/v1/me/api-keys/k1", headers=JOURNALIST).status_code == 204


class TestSubmissions:
    def test_create(self, core_client):
        r = core_client.post("/api/v1/submissions", json={"type": "text", "content": "x" * 30})
        assert r.status_code == 202

    def test_status(self, core_client):
        r = core_client.get("/api/v1/submissions/ZL-7K3P-Q9")
        assert r.status_code == 200

    def test_status_not_found(self, core_client):
        # Valid TrackingId shape (^ZL-[A-Z2-9]{4}-[A-Z2-9]{2}$ excludes 0/1/O/I to avoid
        # ambiguous characters) but a tracking id that doesn't exist.
        assert core_client.get("/api/v1/submissions/ZL-9999-99").status_code == 404


class TestRatings:
    def test_rate(self, core_client):
        r = core_client.post(
            "/api/v1/fact-checks/fc-2026-0142/ratings", json={"vote": "accurate"}, headers=PUBLIC
        )
        assert r.status_code == 200

    def test_retract(self, core_client):
        r = core_client.delete("/api/v1/fact-checks/fc-2026-0142/ratings", headers=PUBLIC)
        assert r.status_code == 200

    def test_add_comment(self, core_client):
        r = core_client.post(
            "/api/v1/fact-checks/fc-2026-0142/comments",
            json={"vote": "accurate", "body": "a test comment"},
            headers=PUBLIC,
        )
        assert r.status_code == 201

    def test_report_issue(self, core_client):
        r = core_client.post(
            "/api/v1/fact-checks/fc-2026-0142/report-issue", json={"reason": "test"}, headers=PUBLIC
        )
        assert r.status_code == 202


class TestReview:
    def test_forbidden_for_public(self, core_client):
        assert core_client.get("/api/v1/review/overview", headers=PUBLIC).status_code == 403

    def test_overview(self, core_client):
        assert core_client.get("/api/v1/review/overview", headers=EXPERT).status_code == 200

    def test_queue(self, core_client):
        assert core_client.get("/api/v1/review/queue", headers=EXPERT).status_code == 200

    def test_queue_filtered(self, core_client):
        r = core_client.get("/api/v1/review/queue", params={"assignee": "unassigned"}, headers=EXPERT)
        assert r.status_code == 200

    def test_case(self, core_client):
        r = core_client.get("/api/v1/review/cases/rc-0418", headers=EXPERT)
        assert r.status_code == 200

    def test_case_not_found(self, core_client):
        assert core_client.get("/api/v1/review/cases/nope", headers=EXPERT).status_code == 404

    def test_assign(self, core_client):
        r = core_client.post("/api/v1/review/cases/rc-0418/assign", json={}, headers=EXPERT)
        assert r.status_code == 200

    def test_decision_confirmed(self, core_client):
        r = core_client.post(
            "/api/v1/review/cases/rc-0418/decision",
            json={"outcome": "confirmed", "justification": "matches ground truth"},
            headers=EXPERT,
        )
        assert r.status_code == 200

    def test_decision_overridden(self, core_client):
        r = core_client.post(
            "/api/v1/review/cases/rc-0417/decision",
            json={"outcome": "overridden", "verdict": "likely-false", "justification": "context needed"},
            headers=EXPERT,
        )
        assert r.status_code == 200

    def test_history(self, core_client):
        assert core_client.get("/api/v1/review/history", headers=EXPERT).status_code == 200


class TestNotifications:
    def test_list(self, core_client):
        assert core_client.get("/api/v1/notifications", headers=PUBLIC).status_code == 200

    def test_mark_read(self, core_client):
        assert core_client.post("/api/v1/notifications/n1/read", headers=PUBLIC).status_code == 204

    def test_mark_all_read(self, core_client):
        assert core_client.post("/api/v1/notifications/read-all", headers=PUBLIC).status_code == 204

    def test_alert_settings_get(self, core_client):
        assert core_client.get("/api/v1/me/alert-settings", headers=PUBLIC).status_code == 200

    def test_alert_settings_patch(self, core_client):
        r = core_client.patch(
            "/api/v1/me/alert-settings", json={"topics": ["Health"]}, headers=PUBLIC
        )
        assert r.status_code == 200


class TestAdmin:
    def test_forbidden_for_expert(self, core_client):
        assert core_client.get("/api/v1/admin/overview", headers=EXPERT).status_code == 403

    def test_overview(self, core_client):
        assert core_client.get("/api/v1/admin/overview", headers=ADMIN).status_code == 200

    def test_users(self, core_client):
        assert core_client.get("/api/v1/admin/users", headers=ADMIN).status_code == 200

    def test_users_filtered(self, core_client):
        r = core_client.get("/api/v1/admin/users", params={"role": "admin", "q": "mary"}, headers=ADMIN)
        assert r.status_code == 200

    def test_update_user(self, core_client):
        r = core_client.patch("/api/v1/admin/users/u1", json={"status": "active"}, headers=ADMIN)
        assert r.status_code == 200

    def test_update_user_not_found(self, core_client):
        r = core_client.patch("/api/v1/admin/users/does-not-exist", json={}, headers=ADMIN)
        assert r.status_code == 404

    def test_moderation_reports(self, core_client):
        assert core_client.get("/api/v1/admin/moderation/reports", headers=ADMIN).status_code == 200

    def test_resolve_report(self, core_client):
        r = core_client.post(
            "/api/v1/admin/moderation/reports/cr1/resolve", json={"action": "dismiss"}, headers=ADMIN
        )
        assert r.status_code == 200

    def test_moderation_signals(self, core_client):
        assert core_client.get("/api/v1/admin/moderation/signals", headers=ADMIN).status_code == 200

    def test_sources(self, core_client):
        assert core_client.get("/api/v1/admin/sources", headers=ADMIN).status_code == 200

    def test_add_source(self, core_client):
        r = core_client.post(
            "/api/v1/admin/sources",
            json={"name": "X", "domain": "x.com", "type": "media", "languages": ["English"], "tier": 1},
            headers=ADMIN,
        )
        assert r.status_code == 201

    def test_update_source(self, core_client):
        r = core_client.patch(
            "/api/v1/admin/sources/s1",
            json={"name": "X", "domain": "x.com", "type": "media", "languages": ["English"], "tier": 1},
            headers=ADMIN,
        )
        assert r.status_code == 200

    def test_remove_source(self, core_client):
        assert core_client.delete("/api/v1/admin/sources/s1", headers=ADMIN).status_code == 204

    def test_broadcasts(self, core_client):
        assert core_client.get("/api/v1/admin/broadcasts", headers=ADMIN).status_code == 200

    def test_send_broadcast(self, core_client):
        r = core_client.post(
            "/api/v1/admin/broadcasts",
            json={
                "title": "t",
                "message": "m",
                "severity": "high",
                "audience": "Everyone",
                "channels": ["in-app"],
            },
            headers=ADMIN,
        )
        assert r.status_code == 202

    def test_monthly_reports(self, core_client):
        assert core_client.get("/api/v1/admin/reports", headers=ADMIN).status_code == 200

    def test_audit_log(self, core_client):
        assert core_client.get("/api/v1/admin/audit-log", headers=ADMIN).status_code == 200

    def test_audit_log_filtered(self, core_client):
        r = core_client.get(
            "/api/v1/admin/audit-log", params={"actorRole": "admin"}, headers=ADMIN
        )
        assert r.status_code == 200

    def test_settings_get(self, core_client):
        assert core_client.get("/api/v1/admin/settings", headers=ADMIN).status_code == 200

    def test_settings_patch(self, core_client):
        current = core_client.get("/api/v1/admin/settings", headers=ADMIN).json()
        r = core_client.patch("/api/v1/admin/settings", json=current, headers=ADMIN)
        assert r.status_code == 200


class TestPartnerApi:
    def test_no_key_rejected(self, partner_client):
        assert partner_client.get("/v1/fact-checks/fc-2026-0142").status_code == 401

    def test_submit_check(self, partner_client):
        r = partner_client.post("/v1/checks", json={"type": "text", "content": "x" * 30}, headers=PARTNER_KEY)
        assert r.status_code == 202

    def test_check_status(self, partner_client):
        r = partner_client.get("/v1/checks/ZL-7K3P-Q9", headers=PARTNER_KEY)
        assert r.status_code == 200

    @pytest.mark.parametrize("report_id", REPORT_IDS)
    def test_get_fact_check(self, partner_client, report_id):
        r = partner_client.get(f"/v1/fact-checks/{report_id}", headers=PARTNER_KEY)
        assert r.status_code == 200, r.text

    def test_search(self, partner_client):
        r = partner_client.get("/v1/fact-checks", params={"q": "internet"}, headers=PARTNER_KEY)
        assert r.status_code == 200, r.text

    def test_rate_limit_headers_present(self, partner_client):
        r = partner_client.get("/v1/fact-checks/fc-2026-0142", headers=PARTNER_KEY)
        assert "X-RateLimit-Limit" in r.headers
        assert "X-RateLimit-Remaining" in r.headers
        assert "X-RateLimit-Reset" in r.headers


def test_health_endpoints_not_in_contract_but_still_ok():
    # /healthz and /readyz are infra endpoints, deliberately not part of the OpenAPI contract.
    plain_client = TestClient(_app)
    assert plain_client.get("/healthz").status_code == 200
    assert plain_client.get("/readyz").status_code == 200
