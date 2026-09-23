"""Uploads and integrations end to end (P3 PR 5), through the contract-validating client:
media arrives as multipart and is stored, then scanned by the worker; WhatsApp and
Telegram calls are verified; the captcha goes to Cloudflare; codes and alerts leave through
the message dispatcher."""

import hashlib
import hmac
import json

import httpx
import respx
from sqlalchemy import select

from app.adapters import clamav, email
from app.adapters.storage import StubObjectStorage
from app.adapters.turnstile import SITEVERIFY_URL
from app.core import rules
from app.db import models as m
from tests.contract.conftest import PARTNER_KEY, PUBLIC

PNG = b"\x89PNG\r\n\x1a\n" + b"\0" * 64


def upload(client, content: bytes = PNG, content_type: str = "image/png", **headers):
    return client.post(
        "/api/v1/submissions",
        data={"type": "media", "headline": "A photo from a WhatsApp group"},
        files={"file": ("photo.png", content, content_type)},
        headers={**PUBLIC, **headers},
    )


def status_of(client, tracking_id: str) -> dict:
    return client.get(f"/api/v1/submissions/{tracking_id}").json()


class TestMediaUploads:
    def test_an_upload_is_stored_scanned_and_checked(self, core_client):
        r = upload(core_client)
        assert r.status_code == 202
        status = status_of(core_client, r.json()["trackingId"])
        assert status["status"] == "completed"
        assert status["steps"][1]["step"] == "scan"
        assert status["result"]["contentType"] == "image"

        async def stored(session):
            return await session.get(m.Submission, r.json()["trackingId"])

        s = core_client.run_db(stored)
        assert s.media_content_type == "image/png"
        assert StubObjectStorage.OBJECTS[s.media_object_key] == (PNG, "image/png")

    def test_audio_is_reported_as_audio(self, core_client):
        r = upload(core_client, b"ID3" + b"\0" * 64, "audio/mpeg")
        assert status_of(core_client, r.json()["trackingId"])["result"]["contentType"] == "audio"

    def test_unsupported_types_are_415(self, core_client):
        r = upload(core_client, b"%PDF-1.7", "application/pdf")
        assert r.status_code == 415
        assert not StubObjectStorage.OBJECTS

    def test_oversized_files_are_413(self, core_client, monkeypatch):
        monkeypatch.setattr(rules, "MAX_MEDIA_BYTES", 32)
        assert upload(core_client).status_code == 413
        assert not StubObjectStorage.OBJECTS

    def test_media_without_a_file_is_422(self, core_client):
        r = core_client.post("/api/v1/submissions", json={"type": "media"}, headers=PUBLIC)
        assert r.status_code == 422

    def test_an_infected_file_fails_and_is_deleted(self, core_client, monkeypatch):
        class Infected:
            async def scan(self, data):
                return clamav.ScanResult(clean=False, signature="Eicar-Test-Signature")

        monkeypatch.setattr("app.worker.pipeline.get_clamav_scanner", Infected)
        r = upload(core_client)
        status = status_of(core_client, r.json()["trackingId"])
        assert status["status"] == "failed"
        assert status["error"]["error"]["code"] == "invalid_content"
        assert "result" not in status
        assert not StubObjectStorage.OBJECTS  # deleted, never analysed

    def test_an_unreachable_scanner_fails_closed(self, core_client, monkeypatch):
        class Down:
            async def scan(self, data):
                raise clamav.ScanError("clamd is down")

        monkeypatch.setattr("app.worker.pipeline.get_clamav_scanner", Down)
        status = status_of(core_client, upload(core_client).json()["trackingId"])
        assert status["status"] == "failed"
        assert status["error"]["error"]["code"] == "server_error"

    def test_partners_can_upload_too(self, partner_client):
        r = partner_client.post(
            "/v1/checks",
            data={"type": "media"},
            files={"file": ("clip.mp4", b"\0\0\0\x18ftypmp42", "video/mp4")},
            headers=PARTNER_KEY,
        )
        assert r.status_code == 202
        status = partner_client.get(f"/v1/checks/{r.json()['trackingId']}", headers=PARTNER_KEY)
        assert status.json()["result"]["contentType"] == "video"


class TestCaptcha:
    @respx.mock
    def test_signed_out_submissions_are_verified_with_cloudflare(self, core_client, adapter_env):
        # respx only patches httpx's network transports; the TestClient's own requests pass.
        adapter_env(TURNSTILE_SECRET_KEY="turnstile-secret")
        siteverify = respx.post(SITEVERIFY_URL).mock(
            side_effect=[
                httpx.Response(200, json={"success": False, "error-codes": ["timeout-or-duplicate"]}),
                httpx.Response(200, json={"success": True}),
            ]
        )
        body = {"type": "text", "content": "A claim that is long enough to be checked.", "captchaToken": "tok"}
        assert core_client.post("/api/v1/submissions", json=body).status_code == 400
        assert core_client.post("/api/v1/submissions", json=body).status_code == 202
        sent = dict(httpx.QueryParams(siteverify.calls.last.request.content.decode()))
        assert sent["secret"] == "turnstile-secret" and sent["response"] == "tok"


def _whatsapp_payload(sender: str) -> bytes:
    return json.dumps(
        {"entry": [{"changes": [{"value": {"messages": [{"from": sender, "text": {"body": "Is this true?"}}]}}]}]}
    ).encode()


def _chat_submissions(client, ref: str) -> list:
    async def find(session):
        return (await session.scalars(select(m.Submission).where(m.Submission.channel_ref == ref))).all()

    return client.run_db(find)


class TestWebhookVerification:
    def test_whatsapp_calls_must_be_signed(self, core_client, adapter_env):
        adapter_env(WHATSAPP_APP_SECRET="app-secret")
        body = _whatsapp_payload("256700000009")
        headers = {"Content-Type": "application/json"}
        unsigned = core_client.post("/webhooks/whatsapp", content=body, headers=headers)
        assert unsigned.status_code == 403
        forged = core_client.post(
            "/webhooks/whatsapp", content=body, headers={**headers, "X-Hub-Signature-256": "sha256=00"}
        )
        assert forged.status_code == 403
        assert _chat_submissions(core_client, "256700000009") == []

        signature = "sha256=" + hmac.new(b"app-secret", body, hashlib.sha256).hexdigest()
        signed = core_client.post(
            "/webhooks/whatsapp", content=body, headers={**headers, "X-Hub-Signature-256": signature}
        )
        assert signed.status_code == 200
        assert len(_chat_submissions(core_client, "256700000009")) == 1

    def test_telegram_calls_must_carry_the_secret(self, core_client, adapter_env):
        adapter_env(TELEGRAM_WEBHOOK_SECRET="tg-secret")
        payload = {"message": {"chat": {"id": 4242}, "text": "Is this claim true?"}}
        assert core_client.post("/webhooks/telegram", json=payload).status_code == 403
        wrong = {"X-Telegram-Bot-Api-Secret-Token": "nope"}
        assert core_client.post("/webhooks/telegram", json=payload, headers=wrong).status_code == 403
        right = {"X-Telegram-Bot-Api-Secret-Token": "tg-secret"}
        assert core_client.post("/webhooks/telegram", json=payload, headers=right).status_code == 200
        assert len(_chat_submissions(core_client, "4242")) == 1

    def test_a_failed_acknowledgement_still_accepts_the_message(self, core_client, monkeypatch):
        # Otherwise Telegram would redeliver the update and create a second submission.
        from app.adapters.telegram import StubTelegramAdapter

        async def broken(self, **kwargs):
            raise RuntimeError("Telegram is down")

        monkeypatch.setattr(StubTelegramAdapter, "send_reply", broken)
        payload = {"message": {"chat": {"id": 4343}, "text": "Is this claim true?"}}
        assert core_client.post("/webhooks/telegram", json=payload).status_code == 200
        assert _chat_submissions(core_client, "4343")[0].status == "completed"


class TestMessages:
    def test_codes_leave_through_the_dispatcher(self, core_client, monkeypatch):
        from app.worker import dispatch

        sent = []
        real = dispatch.dispatch_message

        async def spy(channel, to, body, subject=None):
            sent.append((channel, to))
            await real(channel, to, body, subject)

        monkeypatch.setattr(dispatch, "dispatch_message", spy)
        r = core_client.post(
            "/api/v1/auth/forgot-password",
            json={"identifier": "amina@example.com"},
        )
        assert r.status_code == 202
        assert sent == [("email", "amina@example.com")]
        assert "reset code" in email.OUTBOX[-1]["body"]
