"""
clear_seed_data.py – Removes all seeded/test data from the AquaSense database.
Keeps the table structure intact; only deletes rows.
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "")


async def clear_all_tables() -> None:
    conn_url = DATABASE_URL.replace("postgresql://", "postgresql://").replace(
        "postgresql+asyncpg://", "postgresql://"
    )
    
    print(f"Connecting to database...")
    conn = await asyncpg.connect(conn_url, statement_cache_size=0)

    tables = [
        "observations",
        "reviews",
        "basin_analytics",
        "monitoring_sites",
        "profiles",
    ]

    try:
        for table in tables:
            try:
                result = await conn.execute(f'DELETE FROM "{table}"')
                print(f"  [OK] Cleared table: {table} - {result}")
            except Exception as e:
                print(f"  [SKIP] Could not clear {table}: {e}")
    finally:
        await conn.close()

    print("\nAll seed data removed. Database is now empty and ready for real observations.")


if __name__ == "__main__":
    asyncio.run(clear_all_tables())
