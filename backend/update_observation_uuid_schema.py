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


async def main() -> None:
    url = build_url()
    if not url:
        raise RuntimeError('DATABASE_URL is not set.')

    engine = create_async_engine(url, echo=False)

    async with engine.begin() as conn:
        columns = (await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='observations' ORDER BY ordinal_position"))).fetchall()
        names = {row[0] for row in columns}

        if 'new_id' not in names and 'id' in names:
            await conn.execute(text("ALTER TABLE observations ADD COLUMN new_id UUID;"))
            rows = (await conn.execute(text("SELECT id FROM observations ORDER BY created_at, id"))).fetchall()
            for (old_id,) in rows:
                new_uuid = str(uuid.uuid4())
                await conn.execute(
                    text("UPDATE observations SET new_id = :new_uuid WHERE id = :old_id"),
                    {"new_uuid": new_uuid, "old_id": old_id},
                )

            await conn.execute(text("ALTER TABLE observations DROP CONSTRAINT IF EXISTS observations_pkey CASCADE;"))
            await conn.execute(text("DROP INDEX IF EXISTS ix_observations_id;"))
            await conn.execute(text("ALTER TABLE observations DROP COLUMN id;"))
            await conn.execute(text("ALTER TABLE observations RENAME COLUMN new_id TO id;"))
            await conn.execute(text("ALTER TABLE observations ALTER COLUMN id SET NOT NULL;"))
            await conn.execute(text("ALTER TABLE observations ADD PRIMARY KEY (id);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_observations_id ON observations (id);"))

        review_exists = (await conn.execute(text("SELECT to_regclass('public.reviews')"))).scalar()
        if review_exists:
            review_columns = (await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='reviews' ORDER BY ordinal_position"))).fetchall()
            review_names = {row[0] for row in review_columns}
            if 'observation_uuid' not in review_names and 'observation_id' in review_names:
                await conn.execute(text("ALTER TABLE reviews ADD COLUMN observation_uuid UUID;"))
                rows = (await conn.execute(text("SELECT id, observation_id FROM reviews WHERE observation_id IS NOT NULL ORDER BY id"))).fetchall()
                for review_id, old_obs_id in rows:
                    if old_obs_id is None:
                        continue
                    uuid_value = (await conn.execute(text("SELECT new_id FROM observations WHERE id = :old_id"), {"old_id": old_obs_id})).scalar()
                    if uuid_value is not None:
                        await conn.execute(
                            text("UPDATE reviews SET observation_uuid = :new_uuid WHERE id = :review_id"),
                            {"new_uuid": str(uuid_value), "review_id": review_id},
                        )
                await conn.execute(text("ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_observation_id_fkey;"))
                await conn.execute(text("ALTER TABLE reviews DROP COLUMN observation_id;"))
                await conn.execute(text("ALTER TABLE reviews RENAME COLUMN observation_uuid TO observation_id;"))
                await conn.execute(text("ALTER TABLE reviews ALTER COLUMN observation_id TYPE UUID USING observation_id::uuid;"))
                await conn.execute(text("ALTER TABLE reviews ALTER COLUMN observation_id SET NOT NULL;"))
                await conn.execute(text("ALTER TABLE reviews ADD CONSTRAINT fk_reviews_observation_id_observations FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE;"))

    await engine.dispose()
    print('observations schema updated: UUID record ids enabled')


if __name__ == '__main__':
    asyncio.run(main())
