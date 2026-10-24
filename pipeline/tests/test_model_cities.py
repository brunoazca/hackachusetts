"""Tests for the three-city experiment helpers (pure parts)."""
import pandas as pd

from rat_audit.model.cities import SHARED, WITH_ACS, per_city_metrics
from rat_audit.model.features import label


def test_per_city_metrics_ranks_within_each_city():
    rows = []
    for city, n in (("boston", 10), ("cambridge", 10)):
        for i in range(n):
            y = 5.0 if i == 0 else 0.0
            rows.append({"cell_id": f"{city}:g250_{i}_0", "week_start": "2026-01-05", "y": y,
                         "gbm": 1.0 if i == 0 else 0.1, "baseline": 0.5 if i == 1 else 0.0})
    m = per_city_metrics(pd.DataFrame(rows))
    assert set(m) == {"boston", "cambridge"}
    for c in m.values():
        assert c["top10pct_capture"] == 1.0  # the one cell with reports is ranked first by the GBM
        assert c["baseline_top10pct_capture"] == 0.0
        assert c["cells"] == 10


def test_shared_features_have_labels():
    for f in WITH_ACS + ["city_code"]:
        assert label(f) != f.replace("_", " "), f
    assert not any(f.startswith("ce_") for f in SHARED)  # Boston-only code enforcement stays out
