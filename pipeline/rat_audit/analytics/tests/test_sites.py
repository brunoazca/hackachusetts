import random
from datetime import date, timedelta

from hypothesis import given, settings, strategies as st

from rat_audit.analytics.common import dedupe_reports, pct_rank, recurrence_flags
from rat_audit.analytics.sites import _labels, group_sites, recommend, score_sites

from .helpers import rep


# ---------- dedupe

def test_dedupe_ids_timestamps_duplicate_tag_and_bulk():
    rs = [rep(1), rep(1), rep(2, hour=0)]  # same id twice; id 2 same key + same timestamp as id 1
    rs += [rep(3, day=5, tag="duplicate")]
    rs += [rep(10 + i, key="bulk", day=9, hour=i) for i in range(6)]  # 6 on one day at one key
    kept, st_ = dedupe_reports(rs)
    assert st_["dup_id"] == 1 and st_["dup_timestamp"] == 1 and st_["tag_duplicate"] == 1
    assert st_["bulk_collapsed"] == 5
    assert [r.id for r in kept] == ["fx:1", "fx:10"]


def test_four_same_day_reports_are_not_bulk():
    kept, st_ = dedupe_reports([rep(i, day=0, hour=i) for i in range(4)])
    assert len(kept) == 4 and st_["bulk_collapsed"] == 0


# ---------- recurrence window

def test_recurrence_window_boundaries():
    # closed on day 1; next reports opened on day 1 (0 days), 2 (1 day), 61 (60 days), 62 (61 days)
    for day, expected in [(1, False), (2, True), (61, True), (62, False)]:
        flags = recurrence_flags([rep(1, day=0, closed_after=1), rep(2, day=day, closed_after=None)])
        assert flags == [False, expected], day


def test_open_case_cannot_start_a_recurrence():
    flags = recurrence_flags([rep(1, day=0, closed_after=None), rep(2, day=10, closed_after=None)])
    assert flags == [False, False]


# ---------- score and rank

stats_strategy = st.lists(
    st.tuples(st.integers(1, 40), st.integers(0, 39), st.integers(0, 900)), min_size=1, max_size=60)


def _stats(tuples):
    return [{"id": f"site_{i:04d}", "report_count": n, "recurrence_count": min(k, n - 1), "days_since_last": d}
            for i, (n, k, d) in enumerate(tuples)]


@settings(max_examples=200, deadline=None)
@given(stats_strategy)
def test_score_bounded_0_100(tuples):
    for s in score_sites(_stats(tuples)):
        assert 0.0 <= s["score"] <= 100.0


@settings(max_examples=100, deadline=None)
@given(stats_strategy, st.randoms(use_true_random=False))
def test_ranking_independent_of_input_order(tuples, rnd):
    a = [(s["id"], s["rank"], s["score"]) for s in score_sites(_stats(tuples))]
    shuffled = _stats(tuples)
    rnd.shuffle(shuffled)
    b = [(s["id"], s["rank"], s["score"]) for s in score_sites(shuffled)]
    assert a == b
    assert sorted(r for _, r, _ in a) == list(range(1, len(a) + 1))


def test_ties_share_score_and_break_by_id():
    out = score_sites(_stats([(5, 2, 10), (5, 2, 10), (5, 2, 10)]))
    assert len({s["score"] for s in out}) == 1
    assert [s["id"] for s in out] == ["site_0000", "site_0001", "site_0002"]


def test_single_site_and_dominant_site():
    assert score_sites(_stats([(3, 1, 5)]))[0]["score"] == 100.0
    out = score_sites(_stats([(20, 10, 0), (3, 0, 300), (4, 1, 100)]))
    assert out[0]["id"] == "site_0000" and out[0]["score"] == 100.0


def test_pct_rank_ties():
    assert list(pct_rank([1, 1, 3])) == [0.25, 0.25, 1.0]


@settings(max_examples=100, deadline=None)
@given(st.lists(st.tuples(st.integers(0, 3), st.integers(0, 400), st.one_of(st.none(), st.integers(0, 30))),
                min_size=1, max_size=40))
def test_group_sites_invariants(spec):
    rs = [rep(i, key=f"k{k}", day=d, closed_after=c) for i, (k, d, c) in enumerate(spec)]
    sites, _ = group_sites(rs, date(2026, 10, 23))
    for s in sites:
        assert s["recurrence_count"] <= s["report_count"] - 1
        assert 0 <= s["score"] <= 100
        assert s["report_count"] >= 3 or s["recurrence_count"] >= 1
    again, _ = group_sites(list(reversed(rs)), date(2026, 10, 23))
    assert [(s["id"], s["rank"]) for s in sites] == [(s["id"], s["rank"]) for s in again]


def test_missing_closures_and_empty_input():
    assert group_sites([], date(2026, 1, 1))[0] == []
    sites, _ = group_sites([rep(i, day=i * 3, closed_after=None) for i in range(3)], date(2026, 1, 1))
    assert sites[0]["report_count"] == 3 and sites[0]["recurrence_count"] == 0


# ---------- recommendations

LABELS = _labels()


def _site(tags, recur):
    rs = [rep(i, day=i * 10, tag=t) for i, t in enumerate(tags)]
    return {"id": "site_x", "key": "k1", "reports": rs, "report_count": len(rs), "recurrence_count": recur,
            "flags": [False] * len(rs)}


def test_escalate_after_soft_actions():
    oc = {"monitoring": {"n": 100, "recur_60d_pct": 14.0}, "citation": {"n": 50, "recur_60d_pct": 12.0}}
    recs = recommend(_site(["citation", "monitoring", "closed_no_action"], 2), [], None, None, oc, LABELS)
    assert recs[0]["rule"] == "escalate" and recs[0]["priority"] == 1
    assert any("14.0%" in b for b in recs[0]["because"])
    assert all(r["source_ids"] for r in recs)


def test_escalation_text_says_when_intervals_overlap():
    oc = {"monitoring": {"n": 3427, "recur_60d_pct": 12.63, "ci_low": 11.56, "ci_high": 13.79},
          "citation": {"n": 670, "recur_60d_pct": 11.19, "ci_low": 9.02, "ci_high": 13.81}}
    recs = recommend(_site(["monitoring", "monitoring", "monitoring"], 2), [], None, None, oc, LABELS)
    assert any("cannot separate" in b for b in recs[0]["because"])


def test_no_escalation_when_last_action_was_a_citation_or_few_recurrences():
    assert "escalate" not in {r["rule"] for r in recommend(_site(["monitoring", "citation"], 3), [], None, None, None, LABELS)}
    assert "escalate" not in {r["rule"] for r in recommend(_site(["monitoring", "monitoring"], 1), [], None, None, None, LABELS)}


def test_adjacent_lot_and_containers():
    adj = {"id": "vacant:fx", "pid": "fx", "land_use": "Res Land (Unusable)", "source_id": "fx-assess", "distance_m": 22.0}
    drivers = [{"type": "incident", "category": "trash_storage", "count": 4, "source_ids": ["fx-311"]},
               {"type": "incident", "category": "dumping", "count": 2, "source_ids": ["fx-311"]},
               {"type": "incident", "category": "litter", "count": 1, "source_ids": ["fx-311"]}]
    recs = recommend(_site(["monitoring"] * 3, 2), drivers, None, adj, None, LABELS)
    rules = [r["rule"] for r in recs]
    assert rules[:3] == ["escalate", "adjacent_lot", "containers"]
    cont = recs[2]
    assert {ref["kind"] for ref in cont["references"]} == {"government"}
    assert "fx-assess" in recs[1]["source_ids"]


def test_fallback_recommendation():
    recs = recommend(_site(["baiting", "baiting", "baiting"], 0), [], None, None, None, LABELS)
    assert [r["rule"] for r in recs] == ["follow_up"]


def test_shuffle_reports_same_sites():
    rs = [rep(i, key=f"k{i % 4}", day=(i * 7) % 200, closed_after=2) for i in range(40)]
    a, _ = group_sites(rs, date(2026, 1, 1))
    random.Random(3).shuffle(rs)
    b, _ = group_sites(rs, date(2026, 1, 1))
    assert [(s["id"], s["score"], s["rank"]) for s in a] == [(s["id"], s["score"], s["rank"]) for s in b]
