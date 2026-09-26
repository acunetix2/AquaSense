"""Add social tables: observation comments, observation likes, profile follow/like edges.

Revision ID: 007_social_tables
Revises: 006_consistency_and_ai_trail
Create Date: 2026-09-26
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007_social_tables"
down_revision: Union[str, None] = "006_consistency_and_ai_trail"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "observation_comments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("observation_id", sa.Uuid(), sa.ForeignKey("observations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("author_name", sa.String(255), nullable=False),
        sa.Column("author_avatar", sa.String(500), nullable=True),
        sa.Column("author_role", sa.String(64), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_observation_comments_observation_id", "observation_comments", ["observation_id"])
    op.create_index("ix_observation_comments_user_id", "observation_comments", ["user_id"])

    op.create_table(
        "observation_likes",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("observation_id", sa.Uuid(), sa.ForeignKey("observations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("observation_id", "user_id", name="uq_observation_like"),
    )
    op.create_index("ix_observation_likes_observation_id", "observation_likes", ["observation_id"])
    op.create_index("ix_observation_likes_user_id", "observation_likes", ["user_id"])

    op.create_table(
        "profile_follows",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("follower_id", sa.String(128), nullable=False),
        sa.Column("followee_id", sa.String(128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("follower_id", "followee_id", name="uq_profile_follow"),
    )
    op.create_index("ix_profile_follows_follower_id", "profile_follows", ["follower_id"])
    op.create_index("ix_profile_follows_followee_id", "profile_follows", ["followee_id"])

    op.create_table(
        "profile_likes",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("target_id", sa.String(128), nullable=False),
        sa.Column("liker_id", sa.String(128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("target_id", "liker_id", name="uq_profile_like"),
    )
    op.create_index("ix_profile_likes_target_id", "profile_likes", ["target_id"])
    op.create_index("ix_profile_likes_liker_id", "profile_likes", ["liker_id"])


def downgrade() -> None:
    op.drop_table("profile_likes")
    op.drop_table("profile_follows")
    op.drop_table("observation_likes")
    op.drop_table("observation_comments")
