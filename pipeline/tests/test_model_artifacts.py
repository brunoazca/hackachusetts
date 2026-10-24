"""Tests for rat_audit.model.artifacts.

Round-trip tests are pure. The DB test runs inside a transaction that is rolled
back, and is skipped when SUPABASE_DB_URL is not set.
"""
import os

import numpy as np
import pytest
from sklearn.ensemble import HistGradientBoostingRegressor

from rat_audit.model import artifacts


def _fitted():
    rng = np.random.default_rng(0)
    X = rng.normal(size=(200, 3))
    y = rng.poisson(np.exp(0.3 * X[:, 0]))
    return HistGradientBoostingRegressor(loss="poisson", max_iter=20).fit(X, y), X


def test_roundtrip_preserves_predictions():
    model, X = _fitted()
    again = artifacts.loads(artifacts.dumps({"gbm": model, "features": ["a", "b", "c"]}))
    assert again["features"] == ["a", "b", "c"]
    np.testing.assert_allclose(again["gbm"].predict(X), model.predict(X))


def test_loads_accepts_memoryview():
    blob = artifacts.dumps({"k": 1})
    assert artifacts.loads(memoryview(blob)) == {"k": 1}


@pytest.mark.skipif(not os.environ.get("SUPABASE_DB_URL"), reason="needs SUPABASE_DB_URL")
def test_save_and_load_against_db():
    import psycopg

    model, X = _fitted()
    run_id = "test-artifacts-rollback"
    with psycopg.connect(os.environ["SUPABASE_DB_URL"], autocommit=False) as conn:
        try:
            conn.execute(
                "insert into model_runs (id, model) values (%s, 'cell_week_poisson_gbm')",
                (run_id,),
            )
            assert artifacts.save_model(conn, run_id, model) > 0
            assert artifacts.save_model(conn, run_id, model) > 0  # upsert, no PK error
            np.testing.assert_allclose(artifacts.load_model(conn, run_id).predict(X), model.predict(X))
            got = artifacts.load_latest(conn, "cell_week_poisson_gbm")
            assert got is not None and got[0] == run_id
            assert artifacts.load_model(conn, "no-such-run") is None
        finally:
            conn.rollback()
