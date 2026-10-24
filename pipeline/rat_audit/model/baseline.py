"""Baseline forecaster: expected reports = mean of the last 4 weeks in the cell.

The reference the GBM must beat (design §5), and the fallback forecast for the map if
the GBM slips. Uses the panel's `rodent_m4` column, which is already lagged (t-1..t-4).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

MODEL = "cell_week_baseline_mean4"


class Mean4Baseline:
    """Same fit/predict shape as the GBM so backtest and scoring treat them alike."""

    features = ["rodent_m4"]

    def fit(self, panel: pd.DataFrame) -> "Mean4Baseline":
        return self

    def predict(self, panel: pd.DataFrame) -> np.ndarray:
        return np.clip(panel["rodent_m4"].to_numpy(dtype=float), 0.0, None)


__all__ = ["MODEL", "Mean4Baseline"]
