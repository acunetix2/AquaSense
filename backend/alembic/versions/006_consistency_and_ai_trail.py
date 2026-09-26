"""Add consistency_flags and ai_trail to observations.

Revision ID: 006_consistency_and_ai_trail
Revises: 005_uuid_ids_remaining_tables
Create Date: 2026-09-25
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_consistency_and_ai_trail"
down_revision: Union[str, None] = "005_uuid_ids_remaining_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "observations",
        sa.Column("consistency_flags", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.add_column(
        "observations",
        sa.Column("ai_trail", sa.JSON(), nullable=False, server_default="{}"),
    )


def downgrade() -> None:
    op.drop_column("observations", "ai_trail")
    op.drop_column("observations", "consistency_flags")
