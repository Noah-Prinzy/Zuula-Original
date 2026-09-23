"""Creating submissions and reading their status (FR-SUBMIT-01…07). ADR 0002 §6.

Every channel — the website, the partner API, WhatsApp, Telegram — creates a submission the
same way: a `submissions` row committed first, then the pipeline dispatched
(app/worker/dispatch.py), which runs it in the Celery worker and writes the report.
"""

import secrets
import uuid

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# What request.form() returns (fastapi.UploadFile is a subclass of it).
from starlette.datastructures import UploadFile

from app.adapters.storage import get_object_storage
from app.core import rules
from app.core.errors import ApiError
from app.db.models import FactCheckReport, Submission
from app.schemas.fact_check import dump_report
from app.schemas.submission import SubmissionAccepted
from app.services.pipeline_steps import PIPELINES, STEP_SECONDS
from app.services.reports import full_report, public_report

# Excludes 0/1 (and nothing else) — matches openapi.yaml's TrackingId pattern
# ^ZL-[A-Z2-9]{4}-[A-Z2-9]{2}$ exactly.
_TRACKING_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789"


def generate_tracking_id() -> str:
    part1 = "".join(secrets.choice(_TRACKING_ALPHABET) for _ in range(4))
    part2 = "".join(secrets.choice(_TRACKING_ALPHABET) for _ in range(2))
    return f"ZL-{part1}-{part2}"


def estimated_seconds(sub_type: str) -> int:
    return round(sum(STEP_SECONDS[s] for s in PIPELINES[sub_type]))


def validate_input(body: dict) -> dict:
    """SubmissionInput's rules (openapi.yaml, apps/web/lib/submission.ts). Returns the fields
    the row needs. Invalid content is 422 invalid_content; an unknown type is 400."""
    sub_type = body.get("type")
    if sub_type not in PIPELINES:
        raise ApiError("bad_request", f"type must be one of {sorted(PIPELINES)}.")
    content = (body.get("content") or "").strip()
    url = (body.get("url") or "").strip()
    headline = (body.get("headline") or "").strip()
    if len(headline) > rules.HEADLINE_MAX_CHARS:
        raise ApiError("invalid_content", "The headline is too long.")

    if sub_type == "text" and not rules.TEXT_MIN_CHARS <= len(content) <= rules.TEXT_MAX_CHARS:
        raise ApiError(
            "invalid_content",
            f"Paste between {rules.TEXT_MIN_CHARS} and {rules.TEXT_MAX_CHARS:,} characters.",
        )
    if sub_type == "article" and not (
        rules.ARTICLE_MIN_CHARS <= len(content) <= rules.ARTICLE_MAX_CHARS
    ):
        raise ApiError(
            "invalid_content",
            f"Paste between {rules.ARTICLE_MIN_CHARS} and {rules.ARTICLE_MAX_CHARS:,} characters.",
        )
    if sub_type == "url" and not url.startswith(("http://", "https://")):
        raise ApiError("invalid_content", "Enter a link starting with http:// or https://.")

    if sub_type == "text":
        preview = content[:120]
    elif sub_type == "url":
        preview = url
    elif sub_type == "article":
        preview = headline or content[:120]
    else:
        preview = headline or "Media upload"
    return {
        "type": sub_type,
        "content": content or None,
        "url": url or None,
        "headline": headline or None,
        "article_url": (body.get("articleUrl") or "").strip() or None,
        "language": body.get("language") or "auto",
        "preview": preview,
    }


_TOO_LARGE = "Files must be 50 MB or smaller."
# Room for the form's other fields and the multipart framing around the file.
_FORM_OVERHEAD_BYTES = 1024 * 1024


async def read_input(request: Request) -> tuple[dict, UploadFile | None]:
    """SubmissionInput as JSON or as multipart/form-data (the only way to send a file)."""
    content_type = request.headers.get("content-type", "")
    if not content_type.startswith("multipart/form-data"):
        try:
            body = await request.json()
        except ValueError as exc:
            raise ApiError(
                "invalid_content", "The body must be JSON or multipart/form-data."
            ) from exc
        if not isinstance(body, dict):
            raise ApiError("invalid_content", "The body must be a JSON object.")
        return body, None
    # Refuse an oversized upload before reading it, when the client says how big it is.
    declared = request.headers.get("content-length", "")
    if declared.isdigit() and int(declared) > rules.MAX_MEDIA_BYTES + _FORM_OVERHEAD_BYTES:
        raise ApiError("file_too_large", _TOO_LARGE)
    form = await request.form()
    upload = form.get("file")
    fields = {k: v for k, v in form.items() if isinstance(v, str)}
    return fields, upload if isinstance(upload, UploadFile) else None


async def store_upload(upload: UploadFile | None) -> dict:
    """A media submission's file: checked (415/413), then put in object storage. The worker
    scans it with ClamAV before anything else reads it."""
    if upload is None:
        raise ApiError("invalid_content", "Choose an image, audio or video file.")
    content_type = (upload.content_type or "").split(";")[0].strip().lower()
    if content_type not in rules.ACCEPTED_MEDIA_TYPES:
        raise ApiError("unsupported_media", "This file type isn't supported.")
    data = await upload.read(rules.MAX_MEDIA_BYTES + 1)
    if len(data) > rules.MAX_MEDIA_BYTES:
        raise ApiError("file_too_large", _TOO_LARGE)
    if not data:
        raise ApiError("invalid_content", "That file is empty.")
    key = f"submissions/{uuid.uuid4().hex}/original"
    await get_object_storage().put(key=key, data=data, content_type=content_type)
    return {"media_object_key": key, "media_content_type": content_type}


def chat_fields(text: str) -> dict:
    """A WhatsApp/Telegram message as a submission: a link on its own is checked as a URL,
    anything else as text. No minimum length — chat messages are short, and this channel
    has no form to show a validation error on."""
    text = text.strip()
    is_url = text.startswith(("http://", "https://")) and " " not in text
    return {
        "type": "url" if is_url else "text",
        "content": None if is_url else text,
        "url": text if is_url else None,
        "headline": None,
        "article_url": None,
        "language": "auto",
        "preview": text[:120],
    }


async def create_submission(
    db: AsyncSession,
    *,
    fields: dict,
    channel: str,
    user_id: str | None = None,
    api_key_id: str | None = None,
    channel_ref: str | None = None,
    idempotency_key: str | None = None,
) -> tuple[Submission, bool]:
    """(submission, created). With an Idempotency-Key from a signed-in user or partner key, a
    retry returns the original submission instead of creating a second one."""
    if idempotency_key and (user_id or api_key_id):
        owner = Submission.user_id == user_id if user_id else Submission.api_key_id == api_key_id
        existing = (
            await db.scalars(
                select(Submission).where(owner, Submission.idempotency_key == idempotency_key)
            )
        ).first()
        if existing is not None:
            return existing, False

    for _ in range(5):  # 34^6 ids; a collision is vanishingly rare, but check anyway
        tracking_id = generate_tracking_id()
        if await db.get(Submission, tracking_id) is None:
            break
    submission = Submission(
        tracking_id=tracking_id,
        user_id=user_id,
        api_key_id=api_key_id,
        channel=channel,
        channel_ref=channel_ref,
        status="queued",
        steps=[],
        idempotency_key=idempotency_key if (user_id or api_key_id) else None,
        **fields,
    )
    db.add(submission)
    await db.flush()
    return submission, True


def accepted(submission: Submission, *, status_url: str) -> SubmissionAccepted:
    return SubmissionAccepted(
        tracking_id=submission.tracking_id,
        status="queued",
        estimated_seconds=estimated_seconds(submission.type),
        status_url=status_url,
    )


async def report_for(db: AsyncSession, tracking_id: str) -> FactCheckReport | None:
    return (
        await db.scalars(select(FactCheckReport).where(FactCheckReport.tracking_id == tracking_id))
    ).first()


async def status_of(db: AsyncSession, submission: Submission, *, public: bool = False) -> dict:
    """SubmissionStatusResponse (core) or PartnerCheckStatus (`public=True`: the partner
    report shape), as JSON."""
    data = {
        "trackingId": submission.tracking_id,
        "status": submission.status,
        "submittedAt": submission.submitted_at.isoformat(),
    }
    if not public:
        data["steps"] = list(submission.steps)
    if submission.completed_at:
        data["completedAt"] = submission.completed_at.isoformat()
    if submission.status == "completed":
        report = await report_for(db, submission.tracking_id)
        if report is not None:
            if public:
                data["result"] = dump_report(await public_report(db, report))
            else:
                data["result"] = dump_report(await full_report(db, report))
    if submission.error:
        data["error"] = submission.error
    return data
