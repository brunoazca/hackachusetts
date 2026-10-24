"""Tests for rat_audit.model.features helpers (pure) — mainly the no-leakage windows."""
import numpy as np
import pandas as pd

from rat_audit.model.features import (
    CANDIDATE, CANDIDATE_GROUPS, CORE, _cum, _future_tmax_m4, _ring, _window_sum, cell_ids_for, label,
)
from rat_audit.model.grid import build_grid
from shapely.geometry import box


def test_window_sum_uses_only_past_weeks():
    m = np.array([[1.0, 2.0, 3.0, 4.0, 5.0]])
    c = _cum(m)
    np.testing.assert_array_equal(_window_sum(c, 1, 1), [[0, 1, 2, 3, 4]])  # t-1
    np.testing.assert_array_equal(_window_sum(c, 1, 2), [[0, 1, 3, 5, 7]])  # t-1..t-2
    np.testing.assert_array_equal(_window_sum(c, 3, 3), [[0, 0, 0, 1, 2]])  # t-3


def test_changing_week_t_never_changes_features_at_t_or_before():
    rng = np.random.default_rng(0)
    m = rng.poisson(1.0, size=(3, 30)).astype(float)
    base = _window_sum(_cum(m), 1, 12)
    m2 = m.copy()
    m2[:, 20] += 100
    after = _window_sum(_cum(m2), 1, 12)
    np.testing.assert_array_equal(base[:, :21], after[:, :21])
    assert (after[:, 21] > base[:, 21]).all()


def test_ring_sums_eight_neighbours():
    cols = np.array([0, 1, 2, 1, 5])
    rows = np.array([0, 0, 0, 1, 5])
    m = np.ones((5, 1))
    np.testing.assert_array_equal(_ring(m, cols, rows)[:, 0], [2, 3, 2, 3, 0])


def test_point_ids_match_grid_ids():
    cells = build_grid(box(-71.065, 42.350, -71.053, 42.359))
    ids = cell_ids_for(np.array([c["lon"] for c in cells]), np.array([c["lat"] for c in cells]))
    assert list(ids) == [c["id"] for c in cells]


def test_every_feature_has_a_plain_label():
    for f in CORE + CANDIDATE:
        assert label(f) != f.replace("_", " "), f


def test_candidate_groups_are_candidates_with_labels():
    for fs in CANDIDATE_GROUPS.values():
        for f in fs:
            assert f in CANDIDATE or f in CORE, f
            assert label(f) != f.replace("_", " "), f


def test_future_tmax_never_reads_after_last_observed_week():
    weeks = pd.date_range("2023-01-02", periods=160, freq="7D")
    tmax = pd.Series(50 + 20 * np.sin(np.arange(160) / 52 * 2 * np.pi), index=weeks)
    last = weeks[120]
    target = weeks[123]  # needs weeks 119..122; 121 and 122 are not observed yet
    base = _future_tmax_m4(tmax, last, target)
    leaked = tmax.copy()
    leaked[leaked.index > last] = 999.0
    assert _future_tmax_m4(leaked, last, target) == base
    # unobserved weeks use same-ISO-week values from earlier years, not the last observed weeks
    clim = [tmax[(tmax.index <= last) & (tmax.index.isocalendar().week == w.isocalendar().week)].mean()
            for w in weeks[121:123]]
    assert np.isclose(base, np.mean([tmax[weeks[119]], tmax[weeks[120]], *clim]))
