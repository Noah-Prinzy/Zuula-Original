"""Community ratings, rating comments and "report an issue" (FR-RATE-01…07). ADR 0002 §4."""

from datetime import UTC, datetime

from fastapi import Body, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rules
from app.core.errors import ApiError
from app.core.pagination import PageParams, page_params
from app.core.router import APIRouter
from app.core.security import require_roles
from app.db.base import new_id
from app.db.models import ContentFlag, ContentReport, FactCheckReport, RatingComment, User
from app.db.session import get_db
from app.schemas.account import UserProfile
from app.schemas.fact_check import CommunityScore
from app.schemas.fact_check import RatingComment as CommentSchema
from app.services import escalation, ratings
from app.services.platform_settings import get_platform_settings
from app.services.reports import comment_of

router = APIRouter(prefix="/fact-checks", tags=["ratings"])

_signed_in = require_roles()
_VOTES = ("accurate", "inaccurate")
_COMMENT_MAX = 2000


@router.post("/{id}/ratings", response_model=CommunityScore)
async def rate_fact_check(
    id: str,  # noqa: A002
    body: dict = Body(...),  # noqa: B008
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    vote = body.get("vote")
    if vote not in _VOTES:
        raise ApiError("bad_request", "vote must be 'accurate' or 'inaccurate'.")
    report = await ratings.lock_report(db, id)
    score = await ratings.set_vote(db, report, user, vote)
    await db.commit()
    return score


@router.delete("/{id}/ratings", response_model=CommunityScore)
async def retract_rating(
    id: str,  # noqa: A002
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    report = await ratings.lock_report(db, id)
    score = await ratings.set_vote(db, report, user, None)
    await db.commit()
    return score


async def _report_exists(db: AsyncSession, report_id: str) -> None:
    if await db.get(FactCheckReport, report_id) is None:
        raise ApiError("not_found", f"No fact-check with id '{report_id}'.")


@router.get("/{id}/comments", response_model=None)
async def list_comments(
    id: str,  # noqa: A002
    params: PageParams = Depends(page_params),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    await _report_exists(db, id)
    visible = (RatingComment.report_id == id, RatingComment.removed_at.is_(None))
    total = (await db.execute(select(func.count()).where(*visible))).scalar_one()
    rows = await db.execute(
        select(RatingComment, User.name)
        .join(User, User.id == RatingComment.user_id)
        .where(*visible)
        .order_by(RatingComment.created_at.desc())
        .offset((params.page - 1) * params.per_page)
        .limit(params.per_page)
    )
    return {
        "data": [
            comment_of(c, name).model_dump(by_alias=True, mode="json", exclude_none=True)
            for c, name in rows
        ],
        "page": params.page,
        "perPage": params.per_page,
        "total": total,
    }


@router.post("/{id}/comments", response_model=CommentSchema, status_code=201)
async def add_comment(
    id: str,  # noqa: A002
    body: dict = Body(...),  # noqa: B008
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """'Rate with a comment': the comment's vote is also the user's rating."""
    vote = body.get("vote")
    text = (body.get("body") or "").strip()
    if vote not in _VOTES or not text:
        raise ApiError("bad_request", "vote and body are required.")
    if len(text) > _COMMENT_MAX:
        raise ApiError("bad_request", f"Keep comments under {_COMMENT_MAX:,} characters.")

    report = await ratings.lock_report(db, id)
    await ratings.set_vote(db, report, user, vote)
    comment = RatingComment(
        id=new_id("cmt"),
        report_id=report.id,
        user_id=user.id,
        vote=vote,
        rater_role=ratings.rater_role(user),
        body=text,
        created_at=datetime.now(UTC),
    )
    db.add(comment)
    await db.commit()
    return comment_of(comment, user.name)


@router.post("/{id}/report-issue", status_code=202)
async def report_issue(
    id: str,  # noqa: A002
    body: dict = Body(...),  # noqa: B008
    user: UserProfile = Depends(_signed_in),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """FR-RATE-07. One open moderation item per report gathers every reader's flag; once
    `rules.USER_REPORTS_CASE_THRESHOLD` people have flagged the verdict, it goes to expert
    review. Reporting the same thing twice counts once."""
    reason = (body.get("reason") or "").strip()
    if not reason:
        raise ApiError("bad_request", "reason is required.")
    report = await ratings.lock_report(db, id)  # serialises concurrent reports
    comment_id = body.get("commentId")
    detail = None
    if comment_id:
        comment = await db.get(RatingComment, comment_id)
        if comment is None or comment.report_id != report.id:
            raise ApiError("not_found", f"No comment '{comment_id}' on this report.")
        detail = f"Comment {comment_id}: {comment.body[:200]}"

    item = (
        await db.scalars(
            select(ContentReport).where(
                ContentReport.report_id == report.id, ContentReport.resolved_at.is_(None)
            )
        )
    ).first()
    now = datetime.now(UTC)
    if item is None:
        item = ContentReport(
            id=new_id("cr"),
            report_id=report.id,
            reason=reason,
            sample=detail or reason,
            reported_at=now,
        )
        db.add(item)
        await db.flush()

    already = await db.scalars(
        select(ContentFlag.id).where(
            ContentFlag.content_report_id == item.id, ContentFlag.user_id == user.id
        )
    )
    if already.first() is None:
        db.add(
            ContentFlag(
                id=new_id("flg"),
                content_report_id=item.id,
                user_id=user.id,
                reason=reason,
                body=detail,
                created_at=now,
            )
        )
        await db.flush()

    flags = (
        await db.execute(select(func.count()).where(ContentFlag.content_report_id == item.id))
    ).scalar_one()
    # Flags about a comment are moderation (the admin Moderation screen); flags about the
    # verdict itself go to expert review once there are enough of them.
    if not comment_id and flags >= rules.USER_REPORTS_CASE_THRESHOLD:
        await escalation.open_case(
            db, report, "user-reports", await get_platform_settings(db), content_report_id=item.id
        )
    await db.commit()
    return {}
