"""Add notifications table for the in-app notification engine.

Revision ID: 009_notifications
Revises: 008_observation_views
Create Date: 2026-09-26
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009_notifications"
down_revision: Union[str, None] = "008_observation_views"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The dev app's create_all may have already created this table on startup;
    # skip creation in that case so the revision can still be recorded.
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("notifications"):
        return

    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column(
            "observation_id",
            sa.Uuid(),
            sa.ForeignKey("observations.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("actor_id", sa.String(255), nullable=True),
        sa.Column("actor_name", sa.String(255), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_type", "notifications", ["type"])
    op.create_index("ix_notifications_observation_id", "notifications", ["observation_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])


def downgrade() -> None:
    op.drop_table("notifications")
