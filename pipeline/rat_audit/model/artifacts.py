"""Persist / load trained models in `model_artifacts` (blob bytea).

Modal has no shared disk, so `train` pickles the fitted model into Postgres and
`score` / `simulate` reload it from there. One blob per `model_runs.id`; the
`model_runs` row must exist first (FK). Never commits — the caller owns the
transaction, like every other model helper.

Schema: `supabase/migrations/20261024500001_model_artifacts.sql`.
"""
from __future__ import annotations

import pickle
from typing import Any

import psycopg

PROTOCOL = pickle.HIGHEST_PROTOCOL


def dumps(obj: Any) -> bytes:
    """Serialize a model (any picklable object, e.g. a dict of estimators)."""
    return pickle.dumps(obj, protocol=PROTOCOL)


def loads(blob: bytes | memoryview) -> Any:
    """Inverse of `dumps`. Only ever called on blobs this module wrote."""
    return pickle.loads(bytes(blob))


def save_model(conn: psycopg.Connection, model_run_id: str, obj: Any) -> int:
    """Upsert the pickled `obj` for `model_run_id`. Returns the blob size in bytes."""
    blob = dumps(obj)
    conn.execute(
        """
        insert into model_artifacts (model_run_id, blob)
        values (%s, %s)
        on conflict (model_run_id)
        do update set blob = excluded.blob, created_at = now()
        """,
        (model_run_id, blob),
    )
    return len(blob)


def load_model(conn: psycopg.Connection, model_run_id: str) -> Any | None:
    """Load the model saved for `model_run_id`, or None if there is none."""
    row = conn.execute(
        "select blob from model_artifacts where model_run_id = %s", (model_run_id,)
    ).fetchone()
    return loads(row[0]) if row else None


def load_latest(
    conn: psycopg.Connection, model: str | None = None
) -> tuple[str, Any] | None:
    """Return `(model_run_id, obj)` for the newest run that has an artifact.

    `model` filters on `model_runs.model` (e.g. 'cell_week_poisson_gbm').
    Newest = latest `model_runs.created_at`. None when nothing is stored yet.
    """
    row = conn.execute(
        """
        select a.model_run_id, a.blob
        from model_artifacts a
        join model_runs r on r.id = a.model_run_id
        where %(model)s::text is null or r.model = %(model)s::text
        order by r.created_at desc, a.created_at desc
        limit 1
        """,
        {"model": model},
    ).fetchone()
    return (row[0], loads(row[1])) if row else None


__all__ = ["dumps", "loads", "save_model", "load_model", "load_latest"]
