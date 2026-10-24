"""Tests for rat_audit.model.explain and the baseline (pure, synthetic panel)."""
import numpy as np
import pandas as pd

from rat_audit.model import INTERVENTIONS, explain
from rat_audit.model.backtest import top_capture
from rat_audit.model.baseline import Mean4Baseline
from rat_audit.model.features import CORE
from rat_audit.model.gbm import PoissonGBM


def _panel(n_cells=60, n_weeks=40, seed=0):
    rng = np.random.default_rng(seed)
    rows = []
    hot = rng.random(n_cells) < 0.2
    for c in range(n_cells):
        for w in range(n_weeks):
            rows.append({"cell_id": f"g250_{c}_0", "week_start": pd.Timestamp("2026-01-05") + pd.Timedelta(weeks=w)})
    p = pd.DataFrame(rows)
    for f in CORE:
        p[f] = rng.random(len(p)).astype(np.float32) * 0.1
    cell_hot = p["cell_id"].str.split("_").str[1].astype(int).map(lambda c: hot[c])
    p.loc[cell_hot, "rodent_m12"] = 2.0
    p.loc[cell_hot, "rodent_m4"] = 2.0
    p["y"] = rng.poisson(np.where(cell_hot, 2.0, 0.05)).astype(float)
    return p


def test_p_any_and_bands_monotonic():
    exp = pd.Series(np.linspace(0, 3, 100))
    np.testing.assert_allclose(explain.p_any([0.0, 1.0]), [0.0, 1 - np.exp(-1)])
    bands = explain.risk_bands(exp, pd.Series(["w"] * 100))
    order = {"low": 0, "elevated": 1, "high": 2, "very_high": 3}
    ranks = bands.map(order).to_numpy()
    assert (np.diff(ranks) >= 0).all()
    assert bands.value_counts().to_dict() == {"low": 60, "elevated": 25, "high": 10, "very_high": 5}


def test_gbm_drivers_and_capture():
    p = _panel()
    gbm = PoissonGBM(CORE, max_iter=50).fit(p)
    pred = gbm.predict(p)
    assert (pred >= 0).all()
    p["gbm"], p["baseline"] = pred, Mean4Baseline().predict(p)
    assert top_capture(p, "gbm") > 0.5
    hot_row = p.loc[[p["rodent_m12"].idxmax()]]
    d = explain.drivers(gbm, hot_row, p)[0]
    assert d and d[0]["feature"] == "rodent_history" and d[0]["contribution"] > 0
    assert set(d[0]) == {"feature", "label", "contribution", "value"}


def test_interventions_reference_real_features():
    for name, feats in INTERVENTIONS.items():
        assert set(feats) <= set(CORE), name
