"""Remove the integer profiles.id column in favor of user_id as the canonical profile key.

Revision ID: 003_remove_profiles_integer_id
Revises: 002_profiles_and_observations_v2
Create Date: 2026-09-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_remove_profiles_integer_id"
down_revision: Union[str, None] = "002_profiles_and_observations_v2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f("ix_profiles_id"), table_name="profiles")
    op.drop_constraint("profiles_pkey", "profiles", type_="primary")
    op.drop_column("profiles", "id")
    op.create_primary_key("profiles_pkey", "profiles", ["user_id"])


def downgrade() -> None:
    op.drop_constraint("profiles_pkey", "profiles", type_="primary")
    op.add_column("profiles", sa.Column("id", sa.Integer(), nullable=False, server_default=sa.text("nextval('profiles_id_seq'::regclass)")))
    op.create_primary_key("profiles_pkey", "profiles", ["id"])
    op.create_index(op.f("ix_profiles_id"), "profiles", ["id"], unique=False)
