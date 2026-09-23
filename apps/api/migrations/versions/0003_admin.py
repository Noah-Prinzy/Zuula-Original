"""P3 PR 4 (admin) schema changes.

- content_flags.comment_id: which rating comment a flag is about. Moderation's "remove" hides
  the reported comments; before this, a flag only carried the comment id in its free text.
- audit_log.action gains `ratings.exclude`: an admin dropping or restoring a user's past
  ratings (decision 6a) is its own audited action.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-23 13:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_ACTIONS_0002 = (
    "verdict.override",
    "verdict.confirm",
    "user.role_change",
    "user.suspend",
    "source.add",
    "source.deactivate",
    "broadcast.send",
    "settings.update",
    "moderation.remove",
    "user.reinstate",
)
_ACTIONS_0003 = (*_ACTIONS_0002, "ratings.exclude")


def _action_check(actions: tuple[str, ...]) -> str:
    return "action IN ({})".format(", ".join(f"'{a}'" for a in actions))


def upgrade() -> None:
    op.add_column("content_flags", sa.Column("comment_id", sa.Text(), nullable=True))
    op.create_foreign_key(
        op.f("fk_content_flags_comment_id_rating_comments"),
        "content_flags",
        "rating_comments",
        ["comment_id"],
        ["id"],
    )
    op.drop_constraint(op.f("ck_audit_log_action"), "audit_log", type_="check")
    op.create_check_constraint(
        op.f("ck_audit_log_action"), "audit_log", _action_check(_ACTIONS_0003)
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_audit_log_action"), "audit_log", type_="check")
    op.create_check_constraint(
        op.f("ck_audit_log_action"), "audit_log", _action_check(_ACTIONS_0002)
    )
    op.drop_constraint(
        op.f("fk_content_flags_comment_id_rating_comments"), "content_flags", type_="foreignkey"
    )
    op.drop_column("content_flags", "comment_id")
