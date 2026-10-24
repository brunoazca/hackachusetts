from datetime import timedelta

from rat_audit.analytics.common import local_date
from rat_audit.analytics.outcomes import compute

from .helpers import T0, rep


def test_recent_closure_is_censored_not_success():
    rs = [rep(1, day=0, closed_after=1, tag="monitoring")]
    obs = local_date(T0) + timedelta(days=30)  # watched for 29 days only
    r = compute(rs, obs)["by_tag"]["monitoring"]
    assert r["n"] == 0 and r["n_censored"] == 1 and r["recur_60d_pct"] is None


def test_window_exactly_60_days_is_observed():
    rs = [rep(1, day=0, closed_after=1, tag="citation")]
    obs = local_date(T0) + timedelta(days=61)
    r = compute(rs, obs)["by_tag"]["citation"]
    assert r["n"] == 1 and r["n_censored"] == 0 and r["recur_60d_pct"] == 0.0


def test_recurrence_rate_and_median_days():
    rs = [rep(1, key="a", day=0, tag="monitoring"), rep(2, key="a", day=11, tag="monitoring"),  # 10 days after closure
          rep(3, key="b", day=0, tag="monitoring"),                                            # no repeat
          rep(4, key="c", day=0, tag="citation"), rep(5, key="c", day=80, tag="citation")]     # 79 days: outside
    obs = local_date(T0) + timedelta(days=400)
    by = compute(rs, obs)["by_tag"]
    assert by["monitoring"]["n"] == 3 and by["monitoring"]["n_recurred"] == 1
    assert by["monitoring"]["recur_60d_pct"] == round(100 / 3, 2)
    assert by["monitoring"]["median_days_to_next"] == 10.0
    assert by["citation"]["n_recurred"] == 0
    assert by["monitoring"]["ci_low"] <= by["monitoring"]["recur_60d_pct"] <= by["monitoring"]["ci_high"]


def test_duplicates_bulk_and_open_cases_excluded():
    rs = [rep(1, key="a", day=0, tag="baiting"),
          rep(2, key="a", day=5, tag="duplicate"),            # not a report
          rep(3, key="a", day=0, tag="baiting"),              # same timestamp as 1
          rep(4, key="a", day=40, closed_after=None, tag=None)]  # open case: outcome only, not subject
    rs += [rep(10 + i, key="z", day=3, hour=i, tag="monitoring") for i in range(5)]  # bulk load -> 1
    res = compute(rs, local_date(T0) + timedelta(days=400))
    assert res["by_tag"]["baiting"]["n"] == 1 and res["by_tag"]["baiting"]["n_recurred"] == 1
    assert res["by_tag"]["monitoring"]["n"] == 1
    assert "duplicate" not in res["by_tag"]
    assert res["dedupe"]["bulk_collapsed"] == 4


def test_repeat_runs_identical():
    rs = [rep(i, key=f"k{i % 3}", day=i * 9, tag=["monitoring", "citation"][i % 2]) for i in range(30)]
    obs = local_date(T0) + timedelta(days=500)
    assert compute(rs, obs) == compute(list(reversed(rs)), obs)


def test_empty():
    assert compute([], local_date(T0))["by_tag"] == {}
