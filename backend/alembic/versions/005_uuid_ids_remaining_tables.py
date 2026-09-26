"""Convert remaining tables to UUID-based primary keys.

Revision ID: 005_uuid_ids_remaining_tables
Revises: 004_observations_uuid_id
Create Date: 2026-09-24
"""

from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op

revision: str = "005_uuid_ids_remaining_tables"
down_revision: Union[str, None] = "004_observations_uuid_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _convert_table_to_uuid(table_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns(table_name)}

    if "new_id" in columns:
        return
    if "id" not in columns:
        return

    op.add_column(table_name, sa.Column("new_id", sa.Uuid(), nullable=True))
    rows = bind.execute(sa.text(f"SELECT id FROM {table_name} ORDER BY id")).fetchall()
    for (old_id,) in rows:
        bind.execute(
            sa.text(f"UPDATE {table_name} SET new_id = :new_uuid WHERE id = :old_id"),
            {"new_uuid": str(uuid.uuid4()), "old_id": old_id},
        )

    op.execute(sa.text(f"ALTER TABLE {table_name} DROP CONSTRAINT IF EXISTS {table_name}_pkey CASCADE;"))
    op.drop_index(op.f(f"ix_{table_name}_id"), table_name=table_name)
    op.alter_column(table_name, "new_id", new_column_name="id", existing_type=sa.Uuid(), nullable=False)
    op.create_primary_key(f"{table_name}_pkey", table_name, ["id"])
    op.create_index(op.f(f"ix_{table_name}_id"), table_name, ["id"], unique=False)


def upgrade() -> None:
    for table_name in ("reviews", "monitoring_sites", "basin_analytics"):
        if table_name in sa.inspect(op.get_bind()).get_table_names():
            _convert_table_to_uuid(table_name)


def downgrade() -> None:
    for table_name in ("reviews", "monitoring_sites", "basin_analytics"):
        if table_name in sa.inspect(op.get_bind()).get_table_names():
            bind = op.get_bind()
            columns = {col["name"] for col in sa.inspect(bind).get_columns(table_name)}
            if "id" in columns and "legacy_id" not in columns:
                op.add_column(table_name, sa.Column("legacy_id", sa.Integer(), nullable=True))
                op.execute(sa.text(f"ALTER TABLE {table_name} DROP CONSTRAINT IF EXISTS {table_name}_pkey CASCADE;"))
                op.drop_index(op.f(f"ix_{table_name}_id"), table_name=table_name)
                op.alter_column(table_name, "legacy_id", new_column_name="id", existing_type=sa.Integer(), nullable=False)
                op.create_primary_key(f"{table_name}_pkey", table_name, ["id"])
