import os
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
        await conn.execute(text("DROP INDEX IF EXISTS ix_profiles_id;"))
        await conn.execute(text("ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;"))
        await conn.execute(text("ALTER TABLE profiles DROP COLUMN IF EXISTS id;"))
        await conn.execute(text("ALTER TABLE profiles ADD PRIMARY KEY (user_id);"))
        print('profiles schema updated: removed numeric id and keyed by user_id')

    await engine.dispose()


if __name__ == '__main__':
    asyncio.run(main())
