"""Initial schema — observations table

Revision ID: 001_initial_observations
Revises:
Create Date: 2026-09-24

This migration creates the core `observations` table that stores all citizen
stream assessment data, AI assessment outputs, and reviewer workflow state.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_observations"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "observations",
        # Primary key
        sa.Column("id", sa.Integer(), nullable=False),

        # Location
        sa.Column("site_name", sa.String(length=255), nullable=False),
        sa.Column("location_address", sa.String(length=500), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),

        # Observation data
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("water_appearance", sa.String(length=100), nullable=True),
        sa.Column("odour", sa.String(length=100), nullable=True),
        sa.Column("waste_visible", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("flow_rate", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("assessment_answers", sa.JSON(), nullable=False, server_default="{}"),

        # AI assessment
        sa.Column("signal", sa.String(length=32), nullable=False, server_default="normal"),
        sa.Column("confidence", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("key_evidence", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("suggested_steps", sa.JSON(), nullable=False, server_default="[]"),

        # Review / verification workflow
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("reviewer_notes", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.String(length=255), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),

        # Timestamps
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.PrimaryKeyConstraint("id"),
    )

    # Indexes for common query patterns
    op.create_index(op.f("ix_observations_id"), "observations", ["id"], unique=False)
    op.create_index(op.f("ix_observations_site_name"), "observations", ["site_name"], unique=False)
    op.create_index(op.f("ix_observations_signal"), "observations", ["signal"], unique=False)
    op.create_index(op.f("ix_observations_status"), "observations", ["status"], unique=False)
    op.create_index(op.f("ix_observations_created_at"), "observations", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_observations_created_at"), table_name="observations")
    op.drop_index(op.f("ix_observations_status"), table_name="observations")
    op.drop_index(op.f("ix_observations_signal"), table_name="observations")
    op.drop_index(op.f("ix_observations_site_name"), table_name="observations")
    op.drop_index(op.f("ix_observations_id"), table_name="observations")
    op.drop_table("observations")
