"""26-week rolling-origin backtest for baseline vs GBM (design §5).

For each origin (every `refit_every` weeks across the last `weeks` observed weeks), fit on
all earlier weeks and predict the next `refit_every` weeks one step ahead (features are
lagged, so each week only sees the past). Metrics, both models on the same rows:

* MAE of expected vs actual reports per cell-week;
* top-10% capture — share of actual reports that fell in the 10% of cells ranked highest
  for that week, pooled over the backtest weeks.

If the GBM does not beat the baseline the metrics say so (`gbm_beats_baseline`), never hidden.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .baseline import Mean4Baseline
from .gbm import PoissonGBM


def top_capture(df: pd.DataFrame, col: str, share: float = 0.10) -> float:
    """Pooled share of actual reports in each week's top `share` of cells by `col`."""
    hit = total = 0.0
    for _, g in df.groupby("week_start"):
        k = max(1, int(round(len(g) * share)))
        top = g.nlargest(k, col)
        hit += top["y"].sum()
        total += g["y"].sum()
    return float(hit / total) if total else float("nan")


def run(
    panel: pd.DataFrame,
    *,
    weeks: int = 26,
    refit_every: int = 4,
    features: list[str] | None = None,
) -> tuple[dict, pd.DataFrame]:
    """Return (metrics, predictions) where predictions has cell_id, week_start, y, baseline, gbm."""
    obs = panel[panel["y"].notna()]
    all_weeks = sorted(obs["week_start"].unique())
    test_weeks = all_weeks[-weeks:]
    out = []
    for i in range(0, len(test_weeks), refit_every):
        chunk = test_weeks[i : i + refit_every]
        train = obs[obs["week_start"] < chunk[0]]
        test = obs[obs["week_start"].isin(chunk)]
        gbm = PoissonGBM(features).fit(train)
        out.append(test[["cell_id", "week_start", "y"]].assign(
            baseline=Mean4Baseline().predict(test), gbm=gbm.predict(test)
        ))
    preds = pd.concat(out, ignore_index=True)
    mae_b = float((preds["baseline"] - preds["y"]).abs().mean())
    mae_g = float((preds["gbm"] - preds["y"]).abs().mean())
    cap_b = top_capture(preds, "baseline")
    cap_g = top_capture(preds, "gbm")
    metrics = {
        "backtest_weeks": len(test_weeks),
        "backtest_from": str(test_weeks[0]),
        "backtest_to": str(test_weeks[-1]),
        "refit_every_weeks": refit_every,
        "mae": round(mae_g, 5),
        "baseline_mae": round(mae_b, 5),
        "top10pct_capture": round(cap_g, 4),
        "baseline_top10pct_capture": round(cap_b, 4),
        "actual_reports": int(preds["y"].sum()),
        "gbm_beats_baseline": bool(mae_g < mae_b and cap_g >= cap_b),
    }
    return metrics, preds


__all__ = ["run", "top_capture"]
