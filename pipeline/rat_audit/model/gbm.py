"""cell_week_poisson_gbm — HistGradientBoostingRegressor(loss="poisson") on the feature panel.

Deterministic (fixed seed, no early-stopping split). Predictions are expected report
counts (≥ 0 by construction of the Poisson loss). Global importance is permutation
importance on a recent slice, reported with plain-language labels.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.inspection import permutation_importance

from .features import CORE, label

MODEL = "cell_week_poisson_gbm"
SEED = 42
PARAMS = {
    "loss": "poisson",
    "learning_rate": 0.06,
    "max_iter": 300,
    "max_leaf_nodes": 31,
    "min_samples_leaf": 200,
    "l2_regularization": 1.0,
    "early_stopping": False,
    "random_state": SEED,
}


class PoissonGBM:
    def __init__(self, features: list[str] | None = None, **params):
        self.features = list(features or CORE)
        self.params = {**PARAMS, **params}
        self.model: HistGradientBoostingRegressor | None = None

    def fit(self, panel: pd.DataFrame) -> "PoissonGBM":
        train = panel[panel["y"].notna()]
        self.model = HistGradientBoostingRegressor(**self.params).fit(
            train[self.features].to_numpy(np.float32), train["y"].to_numpy(float)
        )
        return self

    def predict(self, panel: pd.DataFrame) -> np.ndarray:
        return np.clip(self.model.predict(panel[self.features].to_numpy(np.float32)), 0.0, None)

    def importance(self, panel: pd.DataFrame, n_rows: int = 60_000, top: int = 15) -> list[dict]:
        """Permutation importance (Poisson deviance) on the most recent observed rows."""
        obs = panel[panel["y"].notna()].sort_values("week_start").tail(n_rows)
        r = permutation_importance(
            self.model, obs[self.features].to_numpy(np.float32), obs["y"].to_numpy(float),
            n_repeats=3, random_state=SEED, scoring="neg_mean_poisson_deviance",
        )
        order = np.argsort(-r.importances_mean)
        return [
            {"feature": self.features[i], "label": label(self.features[i]),
             "importance": round(float(r.importances_mean[i]), 6)}
            for i in order[:top]
        ]


__all__ = ["MODEL", "SEED", "PARAMS", "PoissonGBM"]
