from collections import Counter
from datetime import date, timedelta

import numpy as np

from rat_audit.analytics.correlations import move_out, trash_vs_rodent, week_start, what_worked
from rat_audit.analytics.costs import pest_payments, repeat_cases, restaurant_citations


# ---------- trash vs rodent

def _cells(n, seed, link):
    rng = np.random.default_rng(seed)
    cells = [f"c{i:04d}" for i in range(n)]
    vol = {c: int(v) for c, v in zip(cells, rng.integers(60, 2000, n))}
    trash = {c: int(rng.poisson(vol[c] * 0.02)) for c in cells}
    rodent = {c: int(rng.poisson(vol[c] * 0.01 + link * trash[c])) for c in cells}
    return cells, rodent, trash, vol


def test_positive_association_survives_volume_control():
    st = trash_vs_rodent(*_cells(400, 1, link=0.8), n_perm=199)
    assert st["rho_partial"] > 0.1 and st["strength"] != "none" and st["p_perm"] < 0.05
    assert st["rho_raw"] >= st["rho_partial"]  # volume drives part of the raw correlation


def test_no_link_is_reported_as_none():
    st = trash_vs_rodent(*_cells(1300, 2, link=0.0), n_perm=199)
    assert abs(st["rho_partial"]) < 0.1 and st["strength"] == "none"


def test_low_volume_cells_excluded_and_insufficient():
    cells, rodent, trash, vol = _cells(8, 3, 0.5)
    assert trash_vs_rodent(cells, rodent, trash, vol)["insufficient"]
    vol = {c: 10 for c in cells}
    assert trash_vs_rodent(cells, rodent, trash, vol)["n"] == 0


def test_trash_stat_is_repeatable():
    args = _cells(200, 4, 0.3)
    assert trash_vs_rodent(*args, n_perm=99) == trash_vs_rodent(*args, n_perm=99)


# ---------- what worked

def _tag(n, k):
    return {"n": n, "n_recurred": k, "n_censored": 0, "recur_60d_pct": round(100 * k / n, 2), "ci_low": 0,
            "ci_high": 100, "median_days_to_next": 12.0, "source_ids": ["fx-311"]}


def test_what_worked_clear_difference():
    w = what_worked({"citation": _tag(1000, 100), "monitoring": _tag(3000, 450)}, {"citation": "Citation",
                                                                                   "monitoring": "Monitoring"})
    assert w["strength"] == "moderate" and w["stat"]["contrast"]["diff_pp"] == -5.0
    assert "10.0% after citation vs 15.0% after monitoring" in w["title"]


def test_what_worked_overlap_is_none():
    w = what_worked({"citation": _tag(20, 3), "monitoring": _tag(25, 4)}, {})
    assert w["strength"] == "none" and "cannot separate" in w["title"]


def test_what_worked_missing_contrast():
    w = what_worked({"baiting": _tag(50, 5)}, {})
    assert w["stat"]["contrast"] is None and w["strength"] == "none"


# ---------- move-out

def _weekly(years, trash_spike, rodent_bump):
    d = {}
    for y in years:
        w0 = week_start(date(y, 9, 1))
        for k in range(-10, 8):
            w = w0 + timedelta(weeks=k)
            for g, base in (("student", 40), ("rest", 200)):
                d[("trash", g, w)] = base * (trash_spike if k == 0 else 1)
                d[("rodent", g, w)] = base // 4 * (rodent_bump if 1 <= k <= 4 else 1)
    return d


def test_move_out_spike_strong_no_rodent_follow():
    m = move_out(_weekly([2023, 2024, 2025], 2.0, 1), [2023, 2024, 2025])
    assert m["strength"] == "strong" and m["trash_ratio_min"] == 2.0
    assert all(r == 1.0 for r in m["rodent_lag_ratios"])


def test_move_out_no_spike():
    assert move_out(_weekly([2024], 1.0, 1), [2024])["strength"] == "none"


def test_move_out_zero_baseline():
    m = move_out({}, [2024])
    assert m["trash_ratio_min"] is None and m["strength"] == "none"


# ---------- costs

def test_pest_payments_totals():
    v = pest_payments([(2026, "BPS", "fx-vendor-a", 600.0, 3, "fx-cb"), (2026, "ISD", "fx-vendor-b", 100.5, 1, "fx-cb"),
                       (2025, "BPS", "fx-vendor-a", 50, 1, "fx-cb")])
    fy26 = v["by_fiscal_year"][-1]
    assert fy26["amount"] == 700.5 and fy26["n_payments"] == 4 and fy26["departments"][0]["department"] == "BPS"


def test_restaurant_citations_year_and_cap():
    rows = [("food:1", {"n_rodent_violations": 25, "n_explicit": 10,
                        "rodent_violations": [{"date": "2025-02-01", "explicit": True}] * 20}, "fx-food"),
            ("food:2", {"n_rodent_violations": 2, "n_explicit": 0,
                        "rodent_violations": [{"date": "2024-05-01", "explicit": False},
                                              {"date": "2025-07-01", "explicit": False}]}, "fx-food")]
    v = restaurant_citations(rows, 2025)
    assert v["businesses"] == 2 and v["violations"] == 21
    assert v["businesses_explicit"] == 1 and v["violations_explicit"] == 20
    assert v["lower_bound"] and v["since_2024"]["violations"] == 27


def test_negated_comments_are_not_explicit_citations():
    rows = [("food:1", {"n_rodent_violations": 2, "n_explicit": 2, "rodent_violations": [
        {"date": "2025-01-02", "explicit": True, "comment": "No mice observed at this time"},
        {"date": "2025-01-03", "explicit": True, "comment": "Mouse droppings under the sink"}]}, "fx-food")]
    v = restaurant_citations(rows, 2025)
    assert v["violations_explicit"] == 1 and v["explicit_negated_excluded"] == 1 and v["violations"] == 2


def test_repeat_cases_never_become_visits_or_dollars():
    v = repeat_cases([("s1", 10, 3), ("s2", 4, 0)], {"s1": Counter({"monitoring": 6, "citation": 2, "baiting": 2})})
    assert v == {"sites_with_recurrence": 1, "cases": 10, "recurrences": 3, "cases_with_on_site_action_in_note": 4,
                 "by_action": {"baiting": 2, "citation": 2, "monitoring": 6},
                 "units": "cases (not visits, not hours, not dollars)"}


def test_repeat_case_title_does_not_claim_all_cases_are_closed(monkeypatch):
    from unittest.mock import Mock
    from rat_audit.analytics import costs

    # report_count includes open cases; the untagged case has no closure action.
    conn = Mock()
    conn.execute.return_value.fetchall.side_effect = [[], [], [
        ("fx-site", 3, 1, {"monitoring": 2, "untagged": 1}, ["fx-311"]),
    ]]
    write = Mock()
    monkeypatch.setattr(costs, "_upsert", write)
    costs.run(conn)
    row = write.call_args.args[1]
    assert row["value"]["cases"] == 3
    assert "3 rodent cases were reported at" in row["title"]
    assert "closed" not in row["title"]
