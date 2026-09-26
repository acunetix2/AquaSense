"""Add observation_views table for deduplicated per-viewer view tracking.

Revision ID: 008_observation_views
Revises: 007_social_tables
Create Date: 2026-09-26
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008_observation_views"
down_revision: Union[str, None] = "007_social_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The dev app's create_all may have already created this table on startup;
    # skip creation in that case so the revision can still be recorded.
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("observation_views"):
        return

    op.create_table(
        "observation_views",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "observation_id",
            sa.Uuid(),
            sa.ForeignKey("observations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("viewer_id", sa.String(128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("observation_id", "viewer_id", name="uq_observation_view"),
    )
    op.create_index("ix_observation_views_observation_id", "observation_views", ["observation_id"])
    op.create_index("ix_observation_views_viewer_id", "observation_views", ["viewer_id"])


def downgrade() -> None:
    op.drop_table("observation_views")
