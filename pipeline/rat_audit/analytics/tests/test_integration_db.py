"""End-to-end run_all on a throwaway PostGIS database built from supabase/migrations.

Skipped unless ANALYTICS_TEST_DB_URL points at an admin connection to a disposable Postgres+PostGIS
server (e.g. `docker run -p 54329:5432 -e POSTGRES_PASSWORD=test postgis/postgis:16-3.4`).
A fresh database is created and dropped per session. All rows are synthetic (`fx-` ids/sources).
Never point this at the shared Supabase database.
"""
from __future__ import annotations

import json
import os
import random
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import psycopg
import pytest

from rat_audit.analytics import grid, run_all

P0_STEPS = ["grid", "classify", "outcomes", "sites", "correlations", "costs"]

ADMIN = os.environ.get("ANALYTICS_TEST_DB_URL")
pytestmark = pytest.mark.skipif(not ADMIN, reason="ANALYTICS_TEST_DB_URL not set (disposable PostGIS)")
MIGRATIONS = Path(__file__).resolve().parents[4] / "supabase" / "migrations"

LAT0, LON0 = 42.3020, -71.0700  # synthetic chronic site
BOX = (-71.0800, 42.2950, -71.0600, 42.3100)


def _ts(d: date, hour=14):
    return datetime(d.year, d.month, d.day, hour, tzinfo=timezone.utc)


@pytest.fixture(scope="module")
def conn():
    name = f"analytics_test_{uuid.uuid4().hex[:8]}"
    with psycopg.connect(ADMIN, autocommit=True) as admin:
        if "supabase" in ADMIN or "pooler" in ADMIN:
            pytest.skip("refusing to run against a Supabase URL")
        admin.execute(f"create database {name}")
        for role in ("anon", "authenticated", "service_role"):
            admin.execute(f"do $$ begin create role {role}; exception when duplicate_object then null; end $$")
    url = psycopg.conninfo.make_conninfo(ADMIN, dbname=name)
    c = psycopg.connect(url)
    for f in sorted(MIGRATIONS.glob("*.sql")):
        c.execute(f.read_text())
    c.commit()
    _load_fixtures(c)
    real = grid.BOUNDARY_SOURCE
    grid.BOUNDARY_SOURCE = "fx-svi"  # synthetic boundary; the real one is climate-ready-boston-svi
    yield c
    grid.BOUNDARY_SOURCE = real
    c.close()
    with psycopg.connect(ADMIN, autocommit=True) as admin:
        admin.execute(f"drop database {name} with (force)")


def _inc(rows, iid, cat, opened, closed=None, key=None, note=None, lat=None, lon=None, zip_="02121", src="fx-311"):
    rows.append((iid, src, cat, cat, "closed" if closed else "open", opened, closed, "Fixture St, " + zip_, key, zip_,
                 "Fixture", note, lat, lon))


def _load_fixtures(c):
    for sid in ("fx-311", "fx-svi", "fx-assess", "fx-food", "fx-checkbook", "fx-volume", "fx-moveout", "fx-ce"):
        c.execute("insert into sources (id, name, url) values (%s, %s, 'https://example.invalid/fixture')",
                  (sid, f"Fixture {sid}"))
    x0, y0, x1, y1 = BOX
    xm = (x0 + x1) / 2
    for geoid, (a, b), hood in (("fx-t1", (x0, xm), "Fixture West"), ("fx-t2", (xm, x1), "Fixture East")):
        wkt = f"MULTIPOLYGON((({a} {y0},{b} {y0},{b} {y1},{a} {y1},{a} {y0})))"
        c.execute("insert into tracts (geoid, source_id, name, attrs, geom, city) values "
                  "(%s, 'fx-svi', %s, %s, st_geogfromtext(%s), 'boston')",
                  (geoid, geoid, json.dumps({"neighborhood": hood, "pop":1000, "tract_vintage":2010}), "SRID=4326;" + wkt))
    rows = []
    # chronic: 8 reports, 20 days apart, closed next day, monitoring -> recurrences 7
    for i in range(8):
        d = date(2025, 2, 1) + timedelta(days=20 * i)
        _inc(rows, f"fx:c{i}", "rodent", _ts(d), _ts(d + timedelta(days=1)), "fxkey-chronic",
             "Area inspector monitoring" if i != 2 else "Violation issued by code enforcement", LAT0, LON0)
    # 4 reports far apart, baiting -> site by count, no recurrence
    for i in range(4):
        d = date(2025, 1, 10) + timedelta(days=100 * i)
        _inc(rows, f"fx:b{i}", "rodent", _ts(d), _ts(d + timedelta(days=2)), "fxkey-b", "Baited burrows",
             42.2990, -71.0750)
    # 2 reports, second 30 days after first closure -> recurrence 1
    _inc(rows, "fx:r0", "rodent", _ts(date(2025, 5, 1)), _ts(date(2025, 5, 2)), "fxkey-r", "No violations issued at this time",
         42.3060, -71.0650)
    _inc(rows, "fx:r1", "rodent", _ts(date(2025, 6, 1)), _ts(date(2025, 6, 2)), "fxkey-r", "Will bait as needed",
         42.3060, -71.0650)
    # bulk load: 6 on one day -> one report, not a site
    for i in range(6):
        _inc(rows, f"fx:bulk{i}", "rodent", _ts(date(2025, 7, 11), 12 + i), _ts(date(2025, 7, 12)), "fxkey-bulk",
             "Area inspector monitoring", 42.2970, -71.0620)
    # recent closure (censored) and the newest report (open)
    _inc(rows, "fx:e0", "rodent", _ts(date(2026, 10, 5)), _ts(date(2026, 10, 6)), "fxkey-e", "Violation issued", LAT0, LON0)
    _inc(rows, "fx:newest", "rodent", _ts(date(2026, 10, 20)), None, "fxkey-f", None, 42.301, -71.071)
    # drivers near the chronic site (2025)
    for i in range(5):
        _inc(rows, f"fx:ts{i}", "trash_storage", _ts(date(2025, 3, 1) + timedelta(days=10 * i)), None, None, None,
             LAT0 + 0.0002 * (i % 2), LON0 + 0.0002)
    for i in range(2):
        _inc(rows, f"fx:dump{i}", "dumping", _ts(date(2025, 4, 1) + timedelta(days=i)), None, None, None, LAT0, LON0 - 0.0003)
    # random cells for the trash-vs-rodent finding
    rnd = random.Random(7)
    vol = []
    for j in range(40):
        lat = rnd.uniform(y0 + 0.001, y1 - 0.001)
        lon = rnd.uniform(x0 + 0.001, x1 - 0.001)
        t = rnd.randint(0, 6)
        for k in range(t):
            _inc(rows, f"fx:gt{j}_{k}", "trash_storage", _ts(date(2025, 6, 1) + timedelta(days=k)), None, None, None, lat, lon)
        for k in range(rnd.randint(0, 3) + t // 2):
            _inc(rows, f"fx:gr{j}_{k}", "rodent", _ts(date(2025, 8, 1) + timedelta(days=k)), None, None, None, lat, lon)
        vol.append((int(lat * 1000), int(lon * 1000) - 1, rnd.randint(60, 400)))
    # move-out series: weekly trash + rodent by ZIP group, Jun-Nov 2023-2025, no coordinates
    for y in (2023, 2024, 2025):
        d = date(y, 6, 1)
        while d < date(y, 11, 15):
            spike = d.isocalendar()[:2] == date(y, 9, 1).isocalendar()[:2]
            for z, n in (("02134", 4), ("02121", 8)):
                for k in range(n * (3 if spike else 1)):
                    _inc(rows, f"fx:mo{d}{z}{k}", "missed_trash", _ts(d), None, None, None, zip_=z)
                for k in range(n // 2):
                    _inc(rows, f"fx:mr{d}{z}{k}", "rodent", _ts(d), _ts(d), None, None, zip_=z)
            d += timedelta(days=7)
    c.cursor().executemany(
        """insert into incidents (id, source_id, category, subtype, status, opened_at, closed_at, address_block,
             address_key, zip, neighborhood, closure_note, lat, lon, geom)
           values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
             case when %s::float8 is not null then st_setsrid(st_makepoint(%s, %s), 4326)::geography end)""",
        [r + (r[12], r[13], r[12]) for r in rows])
    seen = {}
    for a, b, n in vol:
        seen[(a, b)] = seen.get((a, b), 0) + n
    c.cursor().executemany(
        "insert into report_volume (lat_bin, lon_bin, month, n_all, source_id) values (%s, %s, '2025-06-01', %s, 'fx-volume')",
        [(a, b, n) for (a, b), n in seen.items()])
    c.execute("insert into parcels (pid, source_id, land_use, yr_built, own_occ, units, lat, lon, geom) values "
              "('fx-p1', 'fx-assess', 'THREE-FAM DWELLING', 1905, true, 3, %s, %s, st_setsrid(st_makepoint(%s, %s), 4326))",
              (LAT0 + 0.00004, LON0, LON0, LAT0 + 0.00004))
    for pid, kind, name, lat, lon, attrs, src in (
        ("vacant:fx-p2", "vacant_parcel", "Res Land (Unusable)", LAT0 + 0.0002, LON0, {}, "fx-assess"),
        ("food:fx1", "restaurant", "Fixture Diner", LAT0 - 0.0004, LON0, {
            "n_rodent_violations": 3, "n_explicit": 2,
            "rodent_violations": [{"date": "2025-03-02", "explicit": True}, {"date": "2025-04-02", "explicit": True},
                                  {"date": "2024-04-02", "explicit": False}]}, "fx-food")):
        c.execute("insert into places (id, source_id, kind, name, attrs, lat, lon, geom) values "
                  "(%s, %s, %s, %s, %s, %s, %s, st_setsrid(st_makepoint(%s, %s), 4326))",
                  (pid, src, kind, name, json.dumps(attrs), lat, lon, lon, lat))
    c.execute("insert into spending (id, source_id, fiscal_year, department, vendor, amount, n_payments) values "
              "('fx1', 'fx-checkbook', 2026, 'Fixture Dept', 'Fixture Pest Co', 1000, 2), "
              "('fx2', 'fx-checkbook', 2025, 'Fixture Dept', 'Fixture Pest Co', 500, 1)")
    c.execute("insert into events (id, source_id, kind, title, starts_at, attrs) values "
              "('fx-move', 'fx-moveout', 'move_out', 'Fixture move-out', '2025-08-25', '{\"zips\": [\"02134\"]}')")
    c.commit()


def _snapshot(c):
    return {
        "sites": c.execute("select id, score, rank, report_count, recurrence_count from sites order by id").fetchall(),
        "outcomes": c.execute("select action_tag, n, recur_60d_pct, n_censored from action_outcomes order by 1").fetchall(),
        "corr": c.execute("select id, stat, strength from correlations order by id").fetchall(),
        "cells": c.execute("select count(*), min(id), max(id) from grid_cells").fetchone(),
        "tags": c.execute("select id, action_tag from incidents where action_tag is not null order by id").fetchall(),
    }


def test_full_run_then_repeat(conn):
    out = run_all(conn, P0_STEPS)
    assert out["ok"], json.dumps(out["steps"], default=str)[:2000]
    s = out["steps"]
    assert s["grid"]["cells"] > 0 and s["grid"]["boundary_source"] == "fx-svi"
    # grid
    n, lo, hi = conn.execute("select count(*), min(id), max(id) from grid_cells").fetchone()
    assert n == s["grid"]["cells"] and lo.startswith("g250_")
    # classifier
    tags = dict(conn.execute("select id, action_tag from incidents where id like 'fx:%%' and category = 'rodent' "
                             "and address_key is not null").fetchall())
    assert tags["fx:c0"] == "monitoring" and tags["fx:c2"] == "citation" and tags["fx:b0"] == "baiting"
    assert tags["fx:r0"] == "no_violation" and tags["fx:r1"] == "monitoring" and tags["fx:newest"] is None
    # outcomes: the recent citation is censored, not a success
    cit = conn.execute("select n, n_censored, observed_through from action_outcomes where action_tag = 'citation'").fetchone()
    assert cit[1] >= 1 and str(cit[2]) == "2026-10-20"
    # sites
    ids = dict(conn.execute("select id, score from sites").fetchall())
    assert all(v == 0 for v in ids.values())
    chronic = conn.execute("select id, rank, recurrence_count, summary, recommended, parcel_pid from sites "
                           "where report_count = 9").fetchone()
    assert chronic[2] == 7 and chronic[5] == "fx-p1"
    rules = [r["rule"] for r in chronic[4]]
    assert rules == ["escalate"]
    assert chronic[3]["adjacent_vacant"]["id"] == "vacant:fx-p2"
    assert not conn.execute("select 1 from sites where report_count = 1").fetchone()  # bulk key collapsed
    # every source id resolves
    bad = conn.execute("""select s from (select unnest(source_ids) s from correlations union
                          select unnest(source_ids) from price_impact union
                          select jsonb_array_elements_text(summary->'source_ids') from sites) x
                          where s not in (select id from sources)""").fetchall()
    assert bad == []
    # findings + costs
    corr = dict(conn.execute("select id, strength from correlations").fetchall())
    assert set(corr) == {"trash-storage-vs-rodent", "what-worked", "move-out-spike"}
    assert corr["move-out-spike"] == "strong"
    costs = dict(conn.execute("select id, value from price_impact").fetchall())
    assert costs["cost-pest-control-payments"]["by_fiscal_year"][-1]["amount"] == 1000
    assert costs["cost-restaurant-rodent-citations"]["violations_explicit"] == 2
    assert "not visits" in costs["cost-repeat-cases-chronic-sites"]["units"]
    assert conn.execute("select ok from analytics_runs order by id desc limit 1").fetchone()[0] is True

    # model-owned keys survive; decisions keep a site that is no longer chronic
    conn.execute("update sites set summary = summary || '{\"recur_p\": 0.42, \"recur_model\": \"fx\"}' where id = %s",
                 (chronic[0],))
    rsite = conn.execute("select id from sites where summary->'address_keys' ? 'fxkey-b'").fetchone()[0]
    conn.execute("insert into decisions (site_id, action) values (%s, 'fixture decision')", (rsite,))
    conn.commit()
    before = _snapshot(conn)
    out2 = run_all(conn, P0_STEPS)
    assert out2["ok"]
    after = _snapshot(conn)
    assert before == after  # repeat run, same data -> same outputs
    p = conn.execute("select summary->>'recur_p', summary->>'recur_model' from sites where id = %s", (chronic[0],)).fetchone()
    assert p == ("0.42", "fx")

    conn.execute("delete from incidents where id in ('fx:b2','fx:b3')")
    conn.commit()
    run_all(conn, ["sites"])
    kept = conn.execute("select rank, summary->>'retired' from sites where id = %s", (rsite,)).fetchone()
    assert kept == (None, "true")


def test_missing_inputs_are_named(conn):
    conn.execute("delete from spending")
    conn.execute("delete from tracts")
    conn.commit()
    out = run_all(conn, ["grid", "correlations", "costs"])
    s = out["steps"]
    assert s["grid"]["status"] == "missing_input" and s["grid"]["need"]["table"] == "tracts"
    f = s["correlations"]["findings"]
    assert f["trash-storage-vs-rodent"]["status"] == "skipped" and f["move-out-spike"]["status"] == "ok"
    assert not out["ok"]
    assert s["correlations"]["status"] == "partial"
    assert s["costs"]["status"] == "partial"
    assert s["costs"]["missing_inputs"][0]["source_id"] == "boston-checkbook"
    assert not out["ok"]
