"""Tests for rat_audit.model.recurrence (pure, synthetic data)."""
import numpy as np
import pandas as pd

from rat_audit.model.recurrence import WINDOW_DAYS, build_cases, fit

T0 = pd.Timestamp("2025-01-06", tz="UTC")


def _rodent(rows):
    df = pd.DataFrame(rows, columns=["id", "address_key", "address_block", "opened_at", "closed_at", "action_tag"])
    df["opened_at"] = pd.to_datetime(df["opened_at"], utc=True)
    df["closed_at"] = pd.to_datetime(df["closed_at"], utc=True)
    return df


EMPTY_COSIG = pd.DataFrame({"address_block": pd.Series(dtype=str), "category": pd.Series(dtype=str),
                            "opened_at": pd.Series(dtype="datetime64[ns, UTC]")})


def test_label_counts_returns_inside_window_only():
    d = pd.Timedelta
    r = _rodent([
        ("a1", "A", "blk", T0, T0 + d(days=2), "unknown"),
        ("a2", "A", "blk", T0 + d(days=30), T0 + d(days=31), "unknown"),   # return within 60 d of a1
        ("b1", "B", "blk", T0, T0 + d(days=1), "unknown"),
        ("b2", "B", "blk", T0 + d(days=1, hours=12), None, "unknown"),      # <1 day after close: not a return
        ("c1", "C", "blk", T0, T0 + d(days=1), "unknown"),
        ("c2", "C", "blk", T0 + d(days=WINDOW_DAYS + 5), None, "unknown"),  # after the window
        ("z", "Z", "blk", T0 + d(days=400), None, "unknown"),               # pushes data_end out
    ])
    cases = build_cases(r, EMPTY_COSIG).set_index("id")
    assert cases.loc["a1", "y"] == 1
    assert cases.loc["b1", "y"] == 0
    assert cases.loc["c1", "y"] == 0
    assert cases.loc["a2", "prior_1"] == 1.0 and cases.loc["a1", "prior_0"] == 1.0
    assert bool(cases.loc["a1", "observed"])


def test_cosignals_only_count_before_closure():
    d = pd.Timedelta
    r = _rodent([("a1", "A", "blk", T0, T0 + d(days=10), "unknown"),
                 ("z", "Z", "x", T0 + d(days=400), None, "unknown")])
    cos = pd.DataFrame({"address_block": ["blk", "blk", "blk"], "category": ["trash_storage"] * 3,
                        "opened_at": pd.to_datetime([T0 - d(days=5), T0 + d(days=5), T0 + d(days=20)], utc=True)})
    cases = build_cases(r, cos).set_index("id")
    assert cases.loc["a1", "cosig_trash_storage"] == np.log1p(2)


def test_fit_learns_signal_and_beats_baseline():
    rng = np.random.default_rng(1)
    rows = []
    for i in range(1500):
        t = T0 + pd.Timedelta(days=int(rng.integers(0, 500)))
        key = f"k{i}"
        hot = rng.random() < 0.3
        n_prior = 6 if hot else 0
        for j in range(n_prior):
            # Prior reports left open so they add history without becoming training cases.
            rows.append((f"{key}p{j}", key, f"b{i}", t - pd.Timedelta(days=200 + j), None, "unknown"))
        rows.append((f"{key}c", key, f"b{i}", t, t + pd.Timedelta(days=1), "unknown"))
        if rng.random() < (0.6 if hot else 0.05):
            rows.append((f"{key}r", key, f"b{i}", t + pd.Timedelta(days=20), None, "unknown"))
    rows.append(("end", "END", "x", T0 + pd.Timedelta(days=700), None, "unknown"))
    res = fit(build_cases(_rodent(rows), EMPTY_COSIG))
    assert res["metrics"]["auc"] > 0.75
    assert res["metrics"]["beats_baseline"]
    assert "tag_unknown" not in res["features"]  # constant column dropped
    assert res["feature_importance"][0]["label"]
