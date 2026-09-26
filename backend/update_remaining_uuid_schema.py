import os
import uuid
import asyncio
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv(Path(__file__).resolve().parent / '.env')


def build_url() -> str:
    url = os.environ.get('DATABASE_URL', '')
    if url.startswith('postgresql://'):
        return url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    if url.startswith('postgres://'):
        return url.replace('postgres://', 'postgresql+asyncpg://', 1)
    return url


async def convert_table_to_uuid(conn, table_name: str) -> None:
    columns = (await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name=:table_name ORDER BY ordinal_position"), {"table_name": table_name})).fetchall()
    names = {row[0] for row in columns}

    if "new_id" in names or "id" not in names:
        return

    await conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN new_id UUID;"))
    rows = (await conn.execute(text(f"SELECT id FROM {table_name} ORDER BY id"))).fetchall()
    for (old_id,) in rows:
        new_uuid = str(uuid.uuid4())
        await conn.execute(text(f"UPDATE {table_name} SET new_id = :new_uuid WHERE id = :old_id"), {"new_uuid": new_uuid, "old_id": old_id})

    await conn.execute(text(f"ALTER TABLE {table_name} DROP CONSTRAINT IF EXISTS {table_name}_pkey CASCADE;"))
    await conn.execute(text(f"DROP INDEX IF EXISTS ix_{table_name}_id;"))
    await conn.execute(text(f"ALTER TABLE {table_name} DROP COLUMN id;"))
    await conn.execute(text(f"ALTER TABLE {table_name} RENAME COLUMN new_id TO id;"))
    await conn.execute(text(f"ALTER TABLE {table_name} ALTER COLUMN id SET NOT NULL;"))
    await conn.execute(text(f"ALTER TABLE {table_name} ADD PRIMARY KEY (id);"))
    await conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table_name}_id ON {table_name} (id);"))


async def main() -> None:
    url = build_url()
    if not url:
        raise RuntimeError('DATABASE_URL is not set.')

    engine = create_async_engine(url, echo=False)
    async with engine.begin() as conn:
        for table_name in ("reviews", "monitoring_sites", "basin_analytics"):
            table_exists = (await conn.execute(text("SELECT to_regclass(:table_name)"), {"table_name": f'public.{table_name}'})).scalar()
            if table_exists:
                await convert_table_to_uuid(conn, table_name)

    await engine.dispose()
    print('remaining database tables updated to UUID primary keys')


if __name__ == '__main__':
    asyncio.run(main())
