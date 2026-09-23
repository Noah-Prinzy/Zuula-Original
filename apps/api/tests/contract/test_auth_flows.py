"""Real auth and server-side roles, end to end through the contract-validating client (P3 PR 2,
ADR 0002 §5). Every request and response here is still checked against openapi.yaml.

The P2 suite (test_openapi_contract.py) checks each endpoint's shape; these check that the
security properties hold: sessions are real and revocable, codes are single-use, roles come
from the database and changes apply immediately, and partner keys are scoped and limited.
"""

import re
from urllib.parse import parse_qs, urlparse

from app.adapters import email
from app.core import rules
from app.db import models as m
from tests.contract.conftest import (
    ADMIN,
    JOURNALIST,
    PARTNER_KEY,
    PUBLIC,
    SAMPLE_PASSWORD,
)


def code_from(outbox) -> str:
    message = outbox[-1]
    return re.search(r"\b(\d{6})\b", message.get("body") or message.get("message")).group(1)


def sign_in(client, identifier: str, password: str = SAMPLE_PASSWORD):
    return client.post(
        "/api/v1/auth/sign-in", json={"identifier": identifier, "password": password}
    )


def bearer(response) -> dict:
    return {"Authorization": f"Bearer {response.cookies['zuula_session']}"}


def cookie(response) -> dict:
    return {"Cookie": f"zuula_session={response.cookies['zuula_session']}"}


class TestSignUp:
    def test_sign_up_verify_creates_a_signed_in_account(self, core_client):
        r = core_client.post(
            "/api/v1/auth/sign-up",
            json={
                "name": "Okot Peter",
                "identifier": "Okot@Example.com",
                "password": "a long enough password",
                "consent": True,
            },
        )
        assert r.status_code == 202
        assert r.json()["maskedIdentifier"].endswith("@example.com")
        assert email.OUTBOX[-1]["to"] == "okot@example.com"  # identifiers are normalised

        verified = core_client.post(
            "/api/v1/auth/sign-up/verify", json={"code": code_from(email.OUTBOX)}
        )
        assert verified.status_code == 200, verified.text
        assert verified.json()["user"] == {
            **verified.json()["user"],
            "name": "Okot Peter",
            "email": "okot@example.com",
            "role": "public",
        }
        me = core_client.get("/api/v1/me", headers=cookie(verified))
        assert me.status_code == 200
        assert me.json()["email"] == "okot@example.com"

    def test_a_sign_up_code_works_once(self, core_client):
        core_client.post(
            "/api/v1/auth/sign-up",
            json={"name": "Once", "identifier": "once@example.com", "password": "x" * 12, "consent": True},
        )
        code = code_from(email.OUTBOX)
        assert core_client.post("/api/v1/auth/sign-up/verify", json={"code": code}).status_code == 200
        assert core_client.post("/api/v1/auth/sign-up/verify", json={"code": code}).status_code == 400

    def test_existing_identifier_conflicts(self, core_client):
        r = core_client.post(
            "/api/v1/auth/sign-up",
            json={"name": "Amina", "identifier": "amina@example.com", "password": "x" * 12, "consent": True},
        )
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "conflict"


class TestSignIn:
    def test_wrong_password_is_401(self, core_client):
        assert sign_in(core_client, "amina@example.com", "not-the-password").status_code == 401

    def test_unknown_account_is_the_same_401(self, core_client):
        r = sign_in(core_client, "nobody@example.com")
        assert r.status_code == 401
        assert r.json()["error"]["message"] == sign_in(
            core_client, "amina@example.com", "wrong-password"
        ).json()["error"]["message"]

    def test_repeated_failures_lock_the_account_out(self, core_client):
        for _ in range(rules.SIGN_IN_MAX_FAILURES):
            assert sign_in(core_client, "amina@example.com", "wrong-password").status_code == 401
        locked = sign_in(core_client, "amina@example.com")  # even the right password now
        assert locked.status_code == 429
        assert int(locked.headers["Retry-After"]) > 0

    def test_session_cookie_attributes(self, core_client):
        r = sign_in(core_client, "amina@example.com")
        set_cookie = r.headers["set-cookie"].lower()
        assert "httponly" in set_cookie and "secure" in set_cookie and "samesite=lax" in set_cookie

    def test_bearer_and_cookie_both_authenticate(self, core_client):
        r = sign_in(core_client, "amina@example.com")
        assert core_client.get("/api/v1/me", headers=bearer(r)).status_code == 200
        assert core_client.get("/api/v1/me", headers=cookie(r)).status_code == 200

    def test_sign_out_revokes_the_session(self, core_client):
        r = sign_in(core_client, "amina@example.com")
        assert core_client.post("/api/v1/auth/sign-out", headers=bearer(r)).status_code == 204
        assert core_client.get("/api/v1/me", headers=bearer(r)).status_code == 401


class TestTwoFactor:
    def test_expert_and_admin_always_get_a_challenge(self, core_client):
        for identifier in ("david@example.com", "mary@example.com"):
            r = sign_in(core_client, identifier)
            assert "challengeId" in r.json()
            assert "zuula_session" not in r.cookies  # not signed in until the code is checked

    def test_wrong_codes_use_up_the_challenge(self, core_client):
        challenge = sign_in(core_client, "mary@example.com").json()["challengeId"]
        right = code_from(email.OUTBOX)
        wrong = "000000" if right != "000000" else "111111"
        for _ in range(rules.OTP_MAX_ATTEMPTS):
            r = core_client.post(
                "/api/v1/auth/two-factor/verify", json={"challengeId": challenge, "code": wrong}
            )
            assert r.status_code == 400
        r = core_client.post(
            "/api/v1/auth/two-factor/verify", json={"challengeId": challenge, "code": right}
        )
        assert r.status_code == 400  # locked: even the right code no longer works

    def test_resend_has_a_cooldown(self, core_client):
        challenge = sign_in(core_client, "mary@example.com").json()["challengeId"]
        r = core_client.post("/api/v1/auth/two-factor/resend", json={"challengeId": challenge})
        assert r.status_code == 429

    def test_experts_cannot_turn_two_factor_off(self, core_client):
        r = core_client.post("/api/v1/me/two-factor", json={"enabled": False}, headers=ADMIN)
        assert r.status_code == 400

    def test_public_users_can_opt_in(self, core_client):
        assert (
            core_client.post("/api/v1/me/two-factor", json={"enabled": True}, headers=PUBLIC).status_code
            == 200
        )
        assert "challengeId" in sign_in(core_client, "amina@example.com").json()


class TestAccountSecurity:
    def test_password_change_needs_the_current_password(self, core_client):
        r = core_client.post(
            "/api/v1/me/password",
            json={"currentPassword": "wrong-password", "newPassword": "y" * 12},
            headers=PUBLIC,
        )
        assert r.status_code == 401

    def test_password_change_signs_other_devices_out(self, core_client):
        other_device = sign_in(core_client, "amina@example.com")
        r = core_client.post(
            "/api/v1/me/password",
            json={"currentPassword": SAMPLE_PASSWORD, "newPassword": "a brand new password"},
            headers=PUBLIC,
        )
        assert r.status_code == 200
        assert core_client.get("/api/v1/me", headers=PUBLIC).status_code == 200  # this device
        assert core_client.get("/api/v1/me", headers=bearer(other_device)).status_code == 401
        assert sign_in(core_client, "amina@example.com", "a brand new password").status_code == 200

    def test_password_reset_signs_everything_out(self, core_client):
        core_client.post("/api/v1/auth/forgot-password", json={"identifier": "amina@example.com"})
        r = core_client.post(
            "/api/v1/auth/reset-password",
            json={
                "identifier": "amina@example.com",
                "code": code_from(email.OUTBOX),
                "password": "reset to something new",
            },
        )
        assert r.status_code == 200
        assert core_client.get("/api/v1/me", headers=PUBLIC).status_code == 401

    def test_sessions_list_marks_this_device(self, core_client):
        sessions = core_client.get("/api/v1/me/sessions", headers=PUBLIC).json()
        current = [s for s in sessions if s["current"]]
        assert len(current) == 1 and current[0]["id"] == "ses-test-public"

    def test_revoking_other_sessions(self, core_client):
        other = sign_in(core_client, "amina@example.com")
        assert core_client.delete("/api/v1/me/sessions/others", headers=PUBLIC).status_code == 204
        assert core_client.get("/api/v1/me", headers=bearer(other)).status_code == 401
        assert core_client.get("/api/v1/me", headers=PUBLIC).status_code == 200

    def test_deleting_the_account_anonymises_it_and_signs_out(self, core_client):
        assert core_client.delete("/api/v1/me", headers=PUBLIC).status_code == 202
        assert core_client.get("/api/v1/me", headers=PUBLIC).status_code == 401
        assert sign_in(core_client, "amina@example.com").status_code == 401

    def test_cross_site_cookie_writes_are_refused(self, core_client):
        r = sign_in(core_client, "amina@example.com")
        evil = core_client.patch(
            "/api/v1/me",
            json={"name": "Hijacked"},
            headers={**cookie(r), "Origin": "https://evil.example"},
        )
        assert evil.status_code == 401  # the cookie doesn't authenticate a cross-site write
        ours = core_client.patch(
            "/api/v1/me",
            json={"name": "Amina N."},
            headers={**cookie(r), "Origin": "http://localhost:3000"},
        )
        assert ours.status_code == 200


class TestServerSideRoles:
    def test_role_changes_apply_immediately_and_are_audited(self, core_client):
        assert core_client.get("/api/v1/review/overview", headers=PUBLIC).status_code == 403
        r = core_client.patch("/api/v1/admin/users/u6", json={"role": "expert"}, headers=ADMIN)
        assert r.status_code == 200 and r.json()["role"] == "expert"
        # Same session, no sign-in again: the role is read from the database every request.
        assert core_client.get("/api/v1/review/overview", headers=PUBLIC).status_code == 200

        log = core_client.get(
            "/api/v1/admin/audit-log", params={"action": "user.role_change"}, headers=ADMIN
        ).json()["data"]
        assert log[0]["target"] == "Amina Nakato"
        assert log[0]["detail"] == "Public User → Expert Reviewer"
        assert log[0]["actor"] == "Mary Akello"

    def test_suspension_signs_the_user_out_and_is_audited(self, core_client):
        r = core_client.patch("/api/v1/admin/users/u6", json={"status": "suspended"}, headers=ADMIN)
        assert r.status_code == 200
        assert core_client.get("/api/v1/me", headers=PUBLIC).status_code == 401
        assert sign_in(core_client, "amina@example.com").status_code == 401

        core_client.patch("/api/v1/admin/users/u6", json={"status": "active"}, headers=ADMIN)
        actions = [
            e["action"]
            for e in core_client.get("/api/v1/admin/audit-log", headers=ADMIN).json()["data"][:2]
        ]
        assert actions == ["user.reinstate", "user.suspend"]

    def test_admins_cannot_change_their_own_role(self, core_client):
        r = core_client.patch("/api/v1/admin/users/u1", json={"role": "public"}, headers=ADMIN)
        assert r.status_code == 400

    def test_audit_log_is_newest_first_with_contract_ids(self, core_client):
        data = core_client.get("/api/v1/admin/audit-log", headers=ADMIN).json()["data"]
        assert data[0]["id"] == "a12"  # the seeded entries, a3…a12


class TestPartnerKeys:
    def test_a_created_key_works_until_revoked(self, core_client, partner_client):
        created = core_client.post(
            "/api/v1/me/api-keys", json={"name": "CMS", "scopes": ["read"]}, headers=JOURNALIST
        ).json()
        assert created["secret"].startswith("zl_live_") and created["lastUsedAt"] is None
        key = {"Authorization": f"Bearer {created['secret']}"}
        assert partner_client.get("/v1/fact-checks/fc-2026-0142", headers=key).status_code == 200

        listed = core_client.get("/api/v1/me/api-keys", headers=JOURNALIST).json()
        assert "secret" not in next(k for k in listed if k["id"] == created["id"])

        assert (
            core_client.delete(f"/api/v1/me/api-keys/{created['id']}", headers=JOURNALIST).status_code
            == 204
        )
        assert partner_client.get("/v1/fact-checks/fc-2026-0142", headers=key).status_code == 401

    def test_scopes_are_enforced(self, core_client, partner_client):
        read_only = core_client.post(
            "/api/v1/me/api-keys", json={"name": "Reader", "scopes": ["read"]}, headers=JOURNALIST
        ).json()["secret"]
        r = partner_client.post(
            "/v1/checks",
            json={"type": "text", "content": "x" * 30},
            headers={"Authorization": f"Bearer {read_only}"},
        )
        assert r.status_code == 403

    def test_unknown_key_is_rejected(self, partner_client):
        fake = {"Authorization": "Bearer zl_live_00000000000000000000000000000000"}
        assert partner_client.get("/v1/fact-checks", headers=fake).status_code == 401

    def test_a_demoted_journalists_keys_stop_working(self, core_client, partner_client):
        core_client.patch("/api/v1/admin/users/u4", json={"role": "public"}, headers=ADMIN)
        assert partner_client.get("/v1/fact-checks", headers=PARTNER_KEY).status_code == 401

    def test_headers_count_down(self, partner_client):
        r = partner_client.get("/v1/fact-checks", headers=PARTNER_KEY)
        limit = int(r.headers["X-RateLimit-Limit"])
        assert limit == rules.PARTNER_RATE_LIMIT_PER_HOUR
        assert int(r.headers["X-RateLimit-Remaining"]) == limit - 1

    def test_rate_limit_is_enforced_from_platform_settings(self, partner_client):
        async def lower_limit(session):
            row = await session.get(m.PlatformSettings, 1)
            row.settings = {**row.settings, "apiRateLimit": 2}

        partner_client.run_db(lower_limit)  # FR-ADMIN-06: admins set the live limit
        for _ in range(2):
            assert partner_client.get("/v1/fact-checks", headers=PARTNER_KEY).status_code == 200
        r = partner_client.get("/v1/fact-checks", headers=PARTNER_KEY)
        assert r.status_code == 429
        assert r.json()["error"]["code"] == "rate_limited"
        assert r.headers["X-RateLimit-Remaining"] == "0"
        assert int(r.headers["Retry-After"]) > 0

    def test_usage_is_recorded(self, core_client, partner_client):
        for _ in range(3):
            partner_client.get("/v1/fact-checks", headers=PARTNER_KEY)
        usage = core_client.get("/api/v1/me/api-usage", headers=JOURNALIST).json()
        assert usage["usedThisHour"] >= 3


class TestOAuth:
    def test_forged_state_is_refused(self, core_client):
        core_client.get("/api/v1/auth/oauth/google/start", follow_redirects=False)
        r = core_client.get(
            "/api/v1/auth/oauth/google/callback",
            params={"code": "stub-code", "state": "forged"},
            follow_redirects=False,
        )
        assert r.status_code == 302
        assert "error=oauth" in r.headers["location"]
        assert "zuula_session" not in r.cookies

    def test_open_redirects_are_blocked(self, core_client):
        start = core_client.get(
            "/api/v1/auth/oauth/google/start",
            params={"next": "//evil.example/steal"},
            follow_redirects=False,
        )
        state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
        r = core_client.get(
            "/api/v1/auth/oauth/google/callback",
            params={"code": "stub-code", "state": state},
            follow_redirects=False,
        )
        assert "evil.example" not in r.headers["location"]



class TestCodeGuessingIsCapped:
    def test_wrong_reset_codes_lock_the_identifier(self, core_client):
        core_client.post("/api/v1/auth/forgot-password", json={"identifier": "amina@example.com"})
        right = code_from(email.OUTBOX)
        wrong = "000000" if right != "000000" else "111111"
        body = {"identifier": "amina@example.com", "password": "x" * 12}
        for _ in range(rules.SIGN_IN_MAX_FAILURES):
            r = core_client.post("/api/v1/auth/reset-password", json={**body, "code": wrong})
            assert r.status_code == 400
        r = core_client.post("/api/v1/auth/reset-password", json={**body, "code": right})
        assert r.status_code == 400
        assert "Too many" in r.json()["error"]["message"]

    def test_restarting_sign_up_does_not_reset_the_guess_limit(self, core_client):
        body = {"name": "Target", "identifier": "target@example.com", "password": "x" * 12, "consent": True}
        for _ in range(rules.SIGN_IN_MAX_FAILURES):
            core_client.post("/api/v1/auth/sign-up", json=body)  # a fresh challenge each time
            right = code_from(email.OUTBOX)
            wrong = "000000" if right != "000000" else "111111"
            r = core_client.post("/api/v1/auth/sign-up/verify", json={"code": wrong})
            assert r.status_code == 400
        core_client.post("/api/v1/auth/sign-up", json=body)
        r = core_client.post("/api/v1/auth/sign-up/verify", json={"code": code_from(email.OUTBOX)})
        assert r.status_code == 400
        assert "Too many" in r.json()["error"]["message"]

    def test_one_ip_is_not_locked_out_by_a_few_failures(self, core_client):
        # Five failures on one account from this client's IP don't block other accounts.
        for _ in range(rules.SIGN_IN_MAX_FAILURES):
            sign_in(core_client, "james@example.com", "wrong-password")
        assert sign_in(core_client, "amina@example.com").status_code == 200
