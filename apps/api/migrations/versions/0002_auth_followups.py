"""Auth follow-ups found while building P3 PR 2.

- auth_challenges.pending_signup -> payload: it carries more than a pending sign-up now (a
  two-factor sign-in stores its `remember` choice there). The has_subject CHECK follows the
  rename automatically.
- accreditation_applications: the contract's applyForVerification takes several `documents`
  and a `pressCardNumber`, so the single document_key becomes document_keys text[] and
  press_card_number is added. No rows exist yet outside seed data (which sets neither).
- audit_log.action gains `user.reinstate`: lifting a suspension is an admin action with no
  P2 action to record it under.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-23 07:10:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_ACTIONS_0001 = (
    "verdict.override",
    "verdict.confirm",
    "user.role_change",
    "user.suspend",
    "source.add",
    "source.deactivate",
    "broadcast.send",
    "settings.update",
    "moderation.remove",
)
_ACTIONS_0002 = (*_ACTIONS_0001, "user.reinstate")


def _action_check(actions: tuple[str, ...]) -> str:
    return "action IN ({})".format(", ".join(f"'{a}'" for a in actions))


def upgrade() -> None:
    op.alter_column("auth_challenges", "pending_signup", new_column_name="payload")
    op.drop_column("accreditation_applications", "document_key")
    op.add_column(
        "accreditation_applications",
        sa.Column(
            "document_keys",
            sa.ARRAY(sa.Text()),
            server_default=sa.text("'{}'::text[]"),
            nullable=False,
        ),
    )
    op.add_column(
        "accreditation_applications", sa.Column("press_card_number", sa.Text(), nullable=True)
    )
    op.drop_constraint(op.f("ck_audit_log_action"), "audit_log", type_="check")
    op.create_check_constraint(
        op.f("ck_audit_log_action"), "audit_log", _action_check(_ACTIONS_0002)
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_audit_log_action"), "audit_log", type_="check")
    op.create_check_constraint(
        op.f("ck_audit_log_action"), "audit_log", _action_check(_ACTIONS_0001)
    )
    op.drop_column("accreditation_applications", "press_card_number")
    op.drop_column("accreditation_applications", "document_keys")
    op.add_column("accreditation_applications", sa.Column("document_key", sa.Text(), nullable=True))
    op.alter_column("auth_challenges", "payload", new_column_name="pending_signup")
