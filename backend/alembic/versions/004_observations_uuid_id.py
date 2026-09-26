"""Use UUID-based row ids for observations.

Revision ID: 004_observations_uuid_id
Revises: 003_remove_profiles_integer_id
Create Date: 2026-09-24
"""

from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op

revision: str = "004_observations_uuid_id"
down_revision: Union[str, None] = "003_remove_profiles_integer_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    observations_columns = {col["name"] for col in inspector.get_columns("observations")}

    if "new_id" not in observations_columns and "id" in observations_columns:
        op.add_column("observations", sa.Column("new_id", sa.Uuid(), nullable=True))

        rows = bind.execute(sa.text("SELECT id FROM observations ORDER BY created_at, id")).fetchall()
        for (old_id,) in rows:
            generated = str(uuid.uuid4())
            bind.execute(
                sa.text("UPDATE observations SET new_id = :new_uuid WHERE id = :old_id"),
                {"new_uuid": generated, "old_id": old_id},
            )

        op.execute(sa.text("ALTER TABLE observations DROP CONSTRAINT IF EXISTS observations_pkey CASCADE;"))
        op.drop_index(op.f("ix_observations_id"), table_name="observations")
        op.alter_column("observations", "new_id", new_column_name="id", existing_type=sa.Uuid(), nullable=False)
        op.create_primary_key("observations_pkey", "observations", ["id"])
        op.create_index(op.f("ix_observations_id"), "observations", ["id"], unique=False)

    if "reviews" in sa.inspect(bind).get_table_names():
        review_columns = {col["name"] for col in inspector.get_columns("reviews")}
        if "observation_id" in review_columns and "observation_uuid" not in review_columns:
            op.add_column("reviews", sa.Column("observation_uuid", sa.Uuid(), nullable=True))
            rows = bind.execute(sa.text("SELECT id, observation_id FROM reviews")).fetchall()
            for review_id, observation_id in rows:
                if observation_id is None:
                    continue
                generated = bind.execute(
                    sa.text("SELECT new_id FROM observations WHERE id = :old_id"),
                    {"old_id": observation_id},
                ).scalar()
                if generated is not None:
                    bind.execute(
                        sa.text("UPDATE reviews SET observation_uuid = :new_uuid WHERE id = :review_id"),
                        {"new_uuid": str(generated), "review_id": review_id},
                    )
            op.drop_constraint("reviews_observation_id_fkey", "reviews", type_="foreignkey")
            op.alter_column("reviews", "observation_uuid", new_column_name="observation_id", existing_type=sa.Uuid(), nullable=False)
            op.create_foreign_key(
                "fk_reviews_observation_id_observations",
                "reviews",
                "observations",
                ["observation_id"],
                ["id"],
                ondelete="CASCADE",
            )


def downgrade() -> None:
    bind = op.get_bind()
    observation_columns = {col["name"] for col in sa.inspect(bind).get_columns("observations")}

    if "id" in observation_columns and "legacy_id" not in observation_columns:
        op.add_column("observations", sa.Column("legacy_id", sa.Integer(), nullable=True))
        rows = bind.execute(sa.text("SELECT id FROM observations ORDER BY created_at, id")).fetchall()
        for (uuid_id,) in rows:
            bind.execute(sa.text("UPDATE observations SET legacy_id = nextval('observations_id_seq'::regclass) WHERE id = :uuid_id"), {"uuid_id": uuid_id})
        op.drop_constraint("observations_pkey", "observations", type_="primary")
        op.drop_index(op.f("ix_observations_id"), table_name="observations")
        op.alter_column("observations", "legacy_id", new_column_name="id", existing_type=sa.Integer(), nullable=False)
        op.create_primary_key("observations_pkey", "observations", ["id"])

    if "reviews" in sa.inspect(bind).get_table_names():
        review_columns = {col["name"] for col in sa.inspect(bind).get_columns("reviews")}
        if "observation_id" in review_columns and "observation_uuid" in review_columns:
            op.drop_constraint("fk_reviews_observation_id_observations", "reviews", type_="foreignkey")
            op.alter_column("reviews", "observation_id", new_column_name="observation_uuid", existing_type=sa.Uuid(), nullable=True)
