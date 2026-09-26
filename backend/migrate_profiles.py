import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

raw_url = os.environ.get("DATABASE_URL", "")
if raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(raw_url, echo=False)

async def migrate():
    print("[*] Running migration on profiles table...")
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website VARCHAR(500);"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0 NOT NULL;"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0 NOT NULL;"))
        await conn.execute(text("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS likes_received INTEGER DEFAULT 0 NOT NULL;"))
        await conn.execute(text("ALTER TABLE observations ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE observations ADD COLUMN IF NOT EXISTS observer_name VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE observations ADD COLUMN IF NOT EXISTS observer_email VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE observations ADD COLUMN IF NOT EXISTS observer_avatar VARCHAR(500);"))
        await conn.execute(text("ALTER TABLE observations ADD COLUMN IF NOT EXISTS observer_location VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE observations ADD COLUMN IF NOT EXISTS observer_role VARCHAR(100);"))
        await conn.execute(text("ALTER TABLE observations ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb NOT NULL;"))
        await conn.execute(text("ALTER TABLE observations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;"))
    print("[+] Migration completed successfully!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
