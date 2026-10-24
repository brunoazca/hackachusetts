"""Supabase Postgres access for every job. Uses SUPABASE_DB_URL (session pooler)."""
from __future__ import annotations

import os
from contextlib import contextmanager
from datetime import datetime, timezone

import psycopg


def connect() -> psycopg.Connection:
    return psycopg.connect(os.environ["SUPABASE_DB_URL"], autocommit=False)


def upsert_source(conn: psycopg.Connection, id: str, name: str, url: str, notes: str | None = None) -> None:
    """Register a source. Its live/daily/static mode comes from ingest/update_modes.py (required)."""
    from .ingest.update_modes import mode_for

    mode, mode_note = mode_for(id)
    conn.execute(
        """insert into sources (id, name, url, retrieved_at, notes, update_mode, update_note)
           values (%s, %s, %s, now(), %s, %s, %s)
           on conflict (id) do update set name = excluded.name, url = excluded.url,
             retrieved_at = excluded.retrieved_at, notes = coalesce(excluded.notes, sources.notes),
             update_mode = excluded.update_mode, update_note = excluded.update_note""",
        (id, name, url, notes, mode, mode_note),
    )


@contextmanager
def ingest_run(conn: psycopg.Connection, source_id: str):
    """Record one load in ingest_runs. The body sets run["rows"] and run["newest"]."""
    row = conn.execute(
        "insert into ingest_runs (source_id) values (%s) returning id", (source_id,)
    ).fetchone()
    conn.commit()
    run = {"rows": 0, "newest": None}
    try:
        yield run
        conn.execute(
            "update ingest_runs set finished_at = now(), rows_upserted = %s, newest_record_at = %s, ok = true where id = %s",
            (run["rows"], run["newest"], row[0]),
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.execute(
            "update ingest_runs set finished_at = now(), ok = false, message = %s where id = %s",
            (str(e)[:500], row[0]),
        )
        conn.commit()
        raise


def ping() -> dict:
    with connect() as conn:
        n = conn.execute("select count(*) from information_schema.tables where table_schema = 'public'").fetchone()[0]
        import hashlib, pathlib
        h = hashlib.md5((pathlib.Path(__file__).parent / "jobs.py").read_bytes()).hexdigest()
        return {"ok": True, "jobs_md5": h, "public_tables": n, "at": datetime.now(timezone.utc).isoformat()}
