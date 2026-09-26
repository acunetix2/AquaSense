"""Add profiles table and extend observations with new columns

Revision ID: 002_profiles_and_observations_v2
Revises: 001_initial_observations
Create Date: 2026-09-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_profiles_and_observations_v2"
down_revision: Union[str, None] = "001_initial_observations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. profiles table
    op.create_table(
        "profiles",
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("role", sa.String(length=32), server_default="citizen", nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("organization", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("observations_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("verified_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("followers_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("following_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("likes_received", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_profiles_user_id", "profiles", ["user_id"], unique=True)
    op.create_index("ix_profiles_email", "profiles", ["email"], unique=True)

    # 2. New observations columns
    op.add_column("observations", sa.Column("image_urls", sa.JSON(), server_default="[]", nullable=False))
    op.add_column("observations", sa.Column("user_id", sa.String(length=255), nullable=True))
    op.create_foreign_key(
        "fk_observations_user_id_profiles",
        "observations", "profiles",
        ["user_id"], ["user_id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_observations_user_id", "observations", ["user_id"], unique=False)
    op.add_column("observations", sa.Column("observer_name", sa.String(length=255), nullable=True))
    op.add_column("observations", sa.Column("observer_email", sa.String(length=255), nullable=True))
    op.add_column("observations", sa.Column("observer_avatar", sa.String(length=500), nullable=True))
    op.add_column("observations", sa.Column("observer_location", sa.String(length=255), nullable=True))
    op.add_column("observations", sa.Column("observer_role", sa.String(length=100), nullable=True))
    op.add_column("observations", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("observations", "updated_at")
    op.drop_column("observations", "observer_role")
    op.drop_column("observations", "observer_location")
    op.drop_column("observations", "observer_avatar")
    op.drop_column("observations", "observer_email")
    op.drop_column("observations", "observer_name")
    op.drop_constraint("fk_observations_user_id_profiles", "observations", type_="foreignkey")
    op.drop_index("ix_observations_user_id", table_name="observations")
    op.drop_column("observations", "user_id")
    op.drop_column("observations", "image_urls")
    op.drop_index("ix_profiles_email", table_name="profiles")
    op.drop_index("ix_profiles_user_id", table_name="profiles")
    op.drop_table("profiles")
