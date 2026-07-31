"""Create demo users for every workspace role.

Run from the backend directory:
    DATABASE_URL=... SECRET_KEY=... python -m scripts.seed_demo_users

Or set SEED_DEMO_USERS=true to run this automatically on app startup.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")
os.environ.setdefault("DEBUG", "False")


def _require_env() -> None:
    missing = [name for name in ("DATABASE_URL", "SECRET_KEY") if not os.getenv(name)]
    if missing:
        names = ", ".join(missing)
        raise RuntimeError(
            f"Missing required environment variable(s): {names}. "
            "Set them or add them to backend/.env before running the seed."
        )


async def seed_demo_users() -> None:
    _require_env()

    import app.models  # noqa: F401
    from app.core.database import engine, init_database
    from app.core.demo_seed import format_demo_credentials
    from app.core.demo_seed import seed_demo_users as seed_users

    await init_database()
    result = await seed_users()

    await engine.dispose()
    print(format_demo_credentials(result))


if __name__ == "__main__":
    try:
        asyncio.run(seed_demo_users())
    except Exception as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
