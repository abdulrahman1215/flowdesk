from app.core.config import normalize_database_url


def test_normalize_render_postgres_url_to_asyncpg() -> None:
    url = "postgres://user:pass@example.com:5432/flowdesk"

    assert (
        normalize_database_url(url)
        == "postgresql+asyncpg://user:pass@example.com:5432/flowdesk"
    )


def test_keeps_asyncpg_database_url() -> None:
    url = "postgresql+asyncpg://user:pass@example.com:5432/flowdesk"

    assert normalize_database_url(url) == url


def test_normalize_sync_postgres_url_to_asyncpg() -> None:
    url = "postgresql://user:pass@example.com:5432/flowdesk"

    assert (
        normalize_database_url(url)
        == "postgresql+asyncpg://user:pass@example.com:5432/flowdesk"
    )
