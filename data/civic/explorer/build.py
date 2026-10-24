#!/usr/bin/env python3
"""Build a human-friendly, self-contained HTML overview of every civic dataset.

Reads data/civic/datasets/*/data.csv (stdlib only), computes real stats
(row counts, time ranges, top values, cross-dataset join coverage) and writes
data/civic/explorer/index.html. Re-run after any fetch.py refresh:

    python3 data/civic/explorer/build.py
"""
from __future__ import annotations

import csv
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path

csv.field_size_limit(sys.maxsize)

HERE = Path(__file__).resolve().parent
DATASETS = HERE.parent / "datasets"
OUT = HERE / "index.html"

CHALLENGES = {
    "V1": ("Simplified public services", "One task. Too many sites and agencies. Plain language. Show the next step."),
    "V2": ("Responsive and resilient communities", "Volume hides who is waiting, and who an alert misses. Triage the pattern."),
    "V3": ("Safer and connected places", "The last mile is a street, a bike, or a crash. Show what changed, and where it is unsafe."),
    "V4": ("Better college experiences", "Show the campus, the engagement, and the research."),
    "V5": ("Pathways to education and opportunity", "Cost, wages, and the next step."),
}

# Hand-written metadata. `time` = timestamp column, `top` = categorical column to summarise,
# `keys` = columns usable for joining with other datasets.
META = {
    "boston-311": dict(title="Boston 311 service requests", org="City of Boston", src="data.boston.gov",
        what="Recent resident service requests: topic, department, status, on-time flag, neighborhood, ward.",
        time="open_date", top="case_topic", keys=["neighborhood", "zip", "ward", "council district"],
        ch=["V1", "V2"], geo="zip / ward / neighborhood"),
    "permits": dict(title="Boston approved building permits", org="City of Boston", src="data.boston.gov",
        what="Permits issued since Jan 2024 with work type, valuation, fees, expiry, zip and ward.",
        time="issued_date", top="worktype", keys=["zip", "ward"], ch=["V1"], geo="zip / ward"),
    "violations": dict(title="Boston building and property violations", org="City of Boston", src="data.boston.gov",
        what="Inspectional Services violations since Jan 2024: code, description, status, zip, ward.",
        time="status_date", top="description", keys=["zip", "ward", "city (neighborhood)"], ch=["V1", "V2"],
        geo="zip / ward"),
    "neighborhoods": dict(title="Boston neighborhood estimates, 2025", org="City of Boston", src="data.boston.gov",
        what="Population, education and poverty counts for each Boston neighborhood. The denominator for per-capita rates.",
        time=None, top=None, keys=["neighborhood"], ch=["V1", "V2", "V5"], geo="neighborhood"),
    "numina": dict(title="Boston Numina street sensors", org="City of Boston", src="data.boston.gov",
        what="Computer-vision counts of cars, bikes, pedestrians per sensor zone, 2020-2021. Nine zones only.",
        time="time", top="object", keys=["zone", "time"], ch=["V3"], geo="sensor zone"),
    "vision-zero": dict(title="Boston Vision Zero crash records", org="City of Boston", src="data.boston.gov",
        what="Every crash dispatch in the Vision Zero table: mode (mv / bike / ped), street, cross street, lat/long.",
        time="when", top="mode", keys=["lat/long", "street"], ch=["V3"], geo="lat/long"),
    "mbta-alerts": dict(title="MBTA service alerts", org="MBTA", src="api-v3.mbta.com",
        what="Snapshot of active alerts: effect, severity, affected routes and the rider-facing header text.",
        time="updated", top="effect", keys=["routes"], ch=["V2", "V3"], geo="route"),
    "mbta-routes": dict(title="MBTA subway routes", org="MBTA", src="api-v3.mbta.com",
        what="The 8 subway and light-rail routes. Lookup table for alert route ids.",
        time=None, top="mode", keys=["id"], ch=["V3"], geo="route"),
    "mbta-stations": dict(title="MBTA rapid transit stations", org="MassGIS", src="arcgisserver.digital.mass.gov",
        what="Station name, line and route text. No coordinates in the snapshot.",
        time=None, top="line", keys=["station name", "line"], ch=["V3", "V4"], geo="station name"),
    "ej": dict(title="MassGIS environmental justice block groups", org="MassGIS", src="arcgisserver.digital.mass.gov",
        what="Block groups flagged as EJ populations: minority %, limited-English households %, median income, criteria.",
        time=None, top="criteria", keys=["municipality"], ch=["V2", "V5"], geo="municipality"),
    "fema": dict(title="OpenFEMA disaster declarations, MA", org="FEMA", src="fema.gov",
        what="Every Massachusetts disaster declaration: incident type, title, designated county or tribe.",
        time="declarationDate", top="incidentType", keys=["county (designatedArea)"], ch=["V2"], geo="county"),
    "scorecard": dict(title="College Scorecard, Massachusetts", org="U.S. Dept. of Education", src="ed-public-download.scorecard.network",
        what="Cost, net price, median debt, 10-year earnings, completion and admission rate per MA institution.",
        time=None, top="control", keys=["unitid", "name", "city"], ch=["V4", "V5"], geo="city"),
    "ipeds": dict(title="IPEDS institutional directory, MA", org="NCES", src="nces.ed.gov",
        what="Directory of MA institutions: sector, level, size, website, lat/long.",
        time=None, top="sector", keys=["unitid", "name", "lat/long"], ch=["V4", "V5"], geo="lat/long"),
    "colleges": dict(title="MassGIS colleges and universities", org="MassGIS", src="arcgisserver.digital.mass.gov",
        what="All 206 campuses with type, category, on-campus housing flag, zip and campus point.",
        time=None, top="category", keys=["name", "zip", "town", "lat/long"], ch=["V4"], geo="lat/long"),
    "onet": dict(title="O*NET occupations", org="O*NET / DOL", src="onetcenter.org",
        what="1,016 occupation titles and plain-language descriptions. Not job listings.",
        time=None, top=None, keys=["code (SOC)", "title"], ch=["V5"], geo="none"),
    "openalex-works": dict(title="OpenAlex works at nine campuses, 2024", org="OpenAlex", src="api.openalex.org",
        what="Top 500 most-cited 2024 papers with an author at MIT, Harvard, BC, BU, Northeastern, UMass x3, Babson.",
        time=None, top="type", keys=["source (journal)"], ch=["V4"], geo="none"),
    "bluebikes": dict(title="Bluebikes station-to-station, Nov 2024", org="Bluebikes / Lyft", src="s3.amazonaws.com/hubway-data",
        what="Trip counts for every start/end station pair in November 2024, split member vs casual.",
        time=None, top="start_station", keys=["station name"], ch=["V3", "V4"], geo="station name"),
    "cambridge-crashes": dict(title="Cambridge police crash records", org="City of Cambridge", src="data.cambridgema.gov",
        what="Crashes with manner, first harmful event, light, weather, road surface, speed limit, cyclist/ped flags.",
        time="when", top="manner", keys=["lat/long", "street"], ch=["V3"], geo="lat/long"),
    "cambridge-bikes": dict(title="Cambridge citywide bicycle counts", org="City of Cambridge", src="data.cambridgema.gov",
        what="Manual counts at named intersections since 2018, by period, direction, movement and weather.",
        time="date", top="location", keys=["lat/long", "street"], ch=["V3"], geo="lat/long"),
    "eco-totem": dict(title="Cambridge Broadway bicycle counter", org="City of Cambridge", src="data.cambridgema.gov",
        what="15-minute automated bike counts on Broadway since Jan 2024. One counter, not a citywide total.",
        time="when", top="day", keys=["time"], ch=["V3"], geo="one point"),
    "fresh-pond": dict(title="Cambridge Fresh Pond usership", org="City of Cambridge", src="data.cambridgema.gov",
        what="Hourly visitors at Fresh Pond Reservation entrances since 2024.",
        time="when", top="season", keys=["time"], ch=["V3"], geo="one park"),
    "somerville-counts": dict(title="Somerville bike and pedestrian counts", org="City of Somerville", src="data.somervillema.gov",
        what="Annual AM/PM counts of bikes and pedestrians at named intersections.",
        time="year", top="mode", keys=["lat/long", "year"], ch=["V3"], geo="lat/long"),
}

IDEAS = [
    dict(title="311 Fairness Lens", boost=['boston-311-full', 'boston-neighborhood-boundaries'], ch="V2", effort="Half day",
        data=["boston-311", "neighborhoods"],
        join="neighborhood",
        pitch="Rank neighborhoods by 311 cases per 1,000 residents and on-time rate, next to poverty rate. "
              "Shows who waits longest, not just who reports most.",
        decision="A council staffer picks which neighborhood/topic to escalate; the app drafts the note, a human sends it."),
    dict(title="Before You Build: permit + violation check", boost=['boston-311-full'], ch="V1", effort="Half day",
        data=["permits", "violations", "boston-311"],
        join="zip / ward",
        pitch="Resident enters a zip. See typical permit types, fees and timelines there, and the most common "
              "violations (e.g. 'Failure to Obtain Permit') so they file the right permit first.",
        decision="Resident reviews a plain-language checklist and chooses whether to open the official permit portal."),
    dict(title="Safe Last Mile to Campus", boost=['mbta-stops', 'bluebikes-stations', 'boston-neighborhood-boundaries'], ch="V3", effort="1 day",
        data=["colleges", "vision-zero", "cambridge-crashes", "cambridge-bikes"],
        join="lat/long radius",
        pitch="For each campus, count bike and pedestrian crashes within 500 m and show the worst intersections, "
              "with bike volume as exposure so it is a rate, not just a count.",
        decision="Student picks a route; campus safety office decides which intersection to flag to the city."),
    dict(title="Crash risk vs. ride volume", boost=['bluebikes-stations', 'weather-hourly'], ch="V3", effort="1 day",
        data=["cambridge-crashes", "cambridge-bikes", "eco-totem", "somerville-counts"],
        join="lat/long + street name",
        pitch="Pair crash counts with bike counts at the same intersections. High crashes on low volume = "
              "a dangerous street; high volume, few crashes = infrastructure that works.",
        decision="Planner reviews the ranked list and marks which sites need a site visit."),
    dict(title="Weather & daylight crash explainer", boost=['weather-hourly'], ch="V3", effort="Half day",
        data=["cambridge-crashes", "eco-totem"],
        join="hour / day of week",
        pitch="Crashes by light condition, weather and hour against bike volume by hour from the Broadway "
              "counter (Jan-Jun 2024 only). Tests whether dark, wet evenings carry more risk per rider.",
        decision="Comms team chooses when to run a lights-on-your-bike campaign."),
    dict(title="True Cost of College in MA", boost=['mbta-stops', 'scorecard-fields'], ch="V5", effort="Half day",
        data=["scorecard", "ipeds", "colleges"],
        join="unitid, then name + city",
        pitch="Net price, debt and 10-year earnings per school, with a 'years to pay back debt' figure, housing "
              "flag and a map. Filter to schools near an MBTA line.",
        decision="Student/parent shortlists schools; app links to each official net-price calculator."),
    dict(title="Degree to Job pathway", boost=['scorecard-fields', 'bls-oews-ma'], ch="V5", effort="1 day",
        data=["scorecard", "onet", "neighborhoods"],
        join="keyword match (program to occupation title)",
        pitch="Pick an occupation from O*NET in plain language, see which MA schools offer a path, cost vs "
              "earnings. Target neighborhoods with low bachelor's attainment.",
        decision="Advisor confirms the pathway with the student before any application step."),
    dict(title="Who the alert misses", boost=['nws-alerts', 'census-acs'], ch="V2", effort="1 day",
        data=["fema", "ej", "mbta-alerts"],
        join="county / municipality",
        pitch="Map FEMA declaration history by county against EJ block groups with high limited-English "
              "households. Prioritise translated prep messaging where disasters repeat and English is limited.",
        decision="Emergency manager selects towns and languages; app drafts the message, a human approves."),
    dict(title="Rider-friendly MBTA alerts", boost=['mbta-bus-routes', 'mbta-elevators', 'mbta-stops'], ch="V1", effort="Half day",
        data=["mbta-alerts", "mbta-routes", "mbta-stations"],
        join="route id",
        pitch="Rewrite alert headers into plain language and translations, grouped by line and station, "
              "with severity sorted to the top.",
        decision="Rider chooses an alternate route; staff approve any rewritten text before publishing."),
    dict(title="Campus Life Map", boost=['bluebikes-stations', 'mbta-stops', 'bluebikes-live'], ch="V4", effort="1 day",
        data=["colleges", "bluebikes", "mbta-stations", "openalex-works"],
        join="name match (campus to station names)",
        pitch="Per campus: housing, nearest Bluebikes stations and their busiest trips (the top station pairs are on MIT's campus), "
              "subway line, and a 'research highlights' strip from the most-cited 2024 work.",
        decision="Incoming student picks commuting mode; app suggests, does not book."),
    dict(title="Parks & people: Fresh Pond demand", boost=['weather-hourly'], ch="V3", effort="Half day",
        data=["fresh-pond", "eco-totem"],
        join="hour",
        pitch="Busiest entrances by hour and season, compared with bike traffic. Helps schedule rangers, "
              "maintenance and events off-peak.",
        decision="Parks staff pick maintenance windows from suggested quiet hours."),
    dict(title="Housing pressure signal", boost=['boston-311-full', 'census-acs'], ch="V2", effort="1 day",
        data=["permits", "violations", "boston-311", "neighborhoods"],
        join="ward / zip / neighborhood",
        pitch="Combine new construction valuation, housing-related violations and 311 housing complaints per "
              "ward into one per-capita indicator. Spot wards with lots of complaints and little investment.",
        decision="Housing staff choose which wards get proactive inspection outreach."),
]

# Datasets NOT in the repo yet but reachable online. `status` records the probe we ran
# from this machine on CHECKED; re-check before relying on a live call in the demo.
CHECKED = "2026-10-24"
FETCHABLE = [
    dict(id="boston-311-full", title="Boston 311, full case table", org="City of Boston", ch=["V1", "V2"],
        url="https://data.boston.gov/api/3/action/datastore_search?resource_id=254adca6-64ab-4c5c-9fc0-a6da622be185&limit=1000",
        status="ok", note="HTTP 200. 75,498 cases in the table (kit has 5,000).",
        what="Same 311 table with the fields the kit dropped: case_id, close_date, target_close_date, closure_reason, report_source, precinct, lat/long.",
        unlocks="Resolution time vs target, open-case age, case-level dedupe, point maps. Fixes the biggest gap in the 311 Fairness Lens.",
        joins=["boston-311", "neighborhoods", "permits", "violations"],
        caution="Drop full_address, street_number, photos and closure_comments before saving. Page with offset; limit is 32,000 per call."),
    dict(id="cambridge-311", title="Cambridge Commonwealth Connect requests", org="City of Cambridge", ch=["V2"],
        url="https://data.cambridgema.gov/resource/2z9k-mv9g.json?$limit=1000",
        status="ok", note="HTTP 200 (Socrata).",
        what="Cambridge's 311-style tickets: issue type and category, status, created and closed time, lat/long.",
        unlocks="Boston vs Cambridge service comparison; resolution time for a second city.",
        joins=["boston-311", "cambridge-crashes"],
        caution="Skip address, issue_description and image columns (free text and photos can hold personal info)."),
    dict(id="mbta-stops", title="MBTA rapid transit stops with coordinates", org="MBTA", ch=["V3", "V4"],
        url="https://api-v3.mbta.com/stops?filter%5Broute_type%5D=0,1",
        status="ok", note="HTTP 200. Has latitude, longitude, wheelchair_boarding.",
        what="Stop ids, names, municipality, lat/long and wheelchair boarding flag for subway and light rail.",
        unlocks="Puts the kit's station names on a map: nearest station to each campus, crashes near stations, step-free access.",
        joins=["mbta-stations", "mbta-alerts", "colleges", "vision-zero"],
        caution="No API key needed for light use; add a free key if you poll."),
    dict(id="mbta-elevators", title="MBTA elevators and escalators", org="MBTA", ch=["V1", "V3"],
        url="https://api-v3.mbta.com/facilities?filter%5Btype%5D=ELEVATOR",
        status="ok", note="HTTP 200.",
        what="Every elevator by station with a plain-language name. Pair with alerts where effect = ELEVATOR_CLOSURE.",
        unlocks="StepFree Alert: tell a wheelchair user whether their station is step-free right now.",
        joins=["mbta-alerts", "mbta-stations"],
        caution="Some facilities have no coordinates; join through the stop id."),
    dict(id="mbta-bus-routes", title="MBTA bus routes", org="MBTA", ch=["V3"],
        url="https://api-v3.mbta.com/routes?filter%5Btype%5D=3",
        status="ok", note="HTTP 200.",
        what="All bus routes with names, destinations and frequent-bus flag.",
        unlocks="Resolves the 264 alert-route links in mbta-alerts that are buses, not subway.",
        joins=["mbta-alerts", "mbta-routes"], caution=""),
    dict(id="mbta-shapes", title="MBTA route shapes", org="MBTA", ch=["V3"],
        url="https://api-v3.mbta.com/shapes?filter%5Broute%5D=Red",
        status="ok", note="HTTP 200.",
        what="Encoded polylines for each route, for drawing lines on a map.",
        unlocks="Map layer for any transit idea.", joins=["mbta-routes"], caution="Polylines are Google-encoded; decode client-side."),
    dict(id="bluebikes-stations", title="Bluebikes station locations (GBFS)", org="Bluebikes / Lyft", ch=["V3", "V4"],
        url="https://gbfs.lyft.com/gbfs/1.1/bos/en/station_information.json",
        status="ok", note="HTTP 200, ~360 KB.",
        what="Every station with name, short code, lat/long and dock capacity.",
        unlocks="Gives the kit's Bluebikes station pairs coordinates: campus catchments, crash exposure, trip maps.",
        joins=["bluebikes", "colleges", "vision-zero", "cambridge-crashes"],
        caution="Station names change over time; match on name, check unmatched rows."),
    dict(id="bluebikes-live", title="Bluebikes live availability (GBFS)", org="Bluebikes / Lyft", ch=["V3"],
        url="https://gbfs.lyft.com/gbfs/1.1/bos/en/station_status.json",
        status="ok", note="HTTP 200. Updates every minute.",
        what="Bikes and docks available per station right now.",
        unlocks="Live 'is there a bike near campus' widget. Label it live and show the timestamp.",
        joins=["bluebikes-stations"], caution="Demo can break if the feed is down; keep a saved copy."),
    dict(id="bluebikes-trips-2025", title="Bluebikes trips, recent months", org="Bluebikes / Lyft", ch=["V3", "V4"],
        url="https://s3.amazonaws.com/hubway-data/202509-bluebikes-tripdata.zip",
        status="ok", note="HTTP 200 for Sept 2025. One zip per month.",
        what="Individual trips with start/end time, stations and coordinates, member vs casual.",
        unlocks="Semester-start vs November comparison, hour-of-day patterns, trips per campus over time.",
        joins=["bluebikes", "bluebikes-stations"], caution="Large files; aggregate to station pairs like the kit does."),
    dict(id="scorecard-fields", title="College Scorecard by field of study", org="U.S. Dept. of Education", ch=["V5"],
        url="https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Field-of-Study_10152026.zip",
        status="ok", note="HTTP 200, 33.9 MB national zip.",
        what="Earnings and debt per program (CIP code) per school, not just per institution.",
        unlocks="Degree to Job pathway with real program-level numbers; CIP maps to O*NET occupations via the public CIP-SOC crosswalk.",
        joins=["scorecard", "ipeds", "onet"], caution="Filter to MA unitids; many cells are PrivacySuppressed."),
    dict(id="weather-hourly", title="Hourly historical weather (Open-Meteo)", org="Open-Meteo", ch=["V3"],
        url="https://archive-api.open-meteo.com/v1/archive?latitude=42.37&longitude=-71.11&start_date=2024-01-01&end_date=2024-06-30&hourly=temperature_2m,precipitation",
        status="ok", note="HTTP 200, no key.",
        what="Temperature and precipitation by hour for any lat/long and date range.",
        unlocks="Rain and cold vs bike counts (eco-totem, Fresh Pond) and vs crashes. Turns the weather idea into a real join.",
        joins=["eco-totem", "fresh-pond", "cambridge-crashes", "vision-zero"],
        caution="Free tier is non-commercial; credit Open-Meteo."),
    dict(id="nws-alerts", title="National Weather Service alerts, MA", org="NOAA / NWS", ch=["V2"],
        url="https://api.weather.gov/alerts/active?area=MA",
        status="ok", note="HTTP 200. 0 active alerts at check time.",
        what="Official watches and warnings with affected zones, severity and instructions.",
        unlocks="'Who the alert misses': pair live official alerts with EJ limited-English areas. Never write your own warnings.",
        joins=["ej", "fema"], caution="Send a User-Agent header. Empty is normal on a calm day; keep a saved sample for the demo."),
    dict(id="boston-neighborhood-boundaries", title="Boston neighborhood boundaries", org="City of Boston", ch=["V2", "V3"],
        url="https://data.boston.gov/dataset/bf1a7b50-4c72-4637-b0fa-11d632e3aff1/resource/e5849875-a6f6-4c9c-9d8a-5048b0fbd03e/download/boston_neighborhood_boundaries.geojson",
        status="ok", note="HTTP 200 (GeoJSON).",
        what="Polygon per Boston neighborhood.",
        unlocks="Point-in-polygon: assign Vision Zero crashes to neighborhoods, then crashes per 1,000 residents. Choropleth for 311.",
        joins=["vision-zero", "neighborhoods", "boston-311"],
        caution="Names may differ slightly from the 2025 estimates table; check the join."),
    dict(id="street-sweeping", title="Boston street sweeping schedules", org="City of Boston", ch=["V1"],
        url="https://data.boston.gov/dataset/00c015a1-2b62-4072-a71e-79b292ce9670/resource/9fdbdcad-67c8-4b23-b6ec-861e77d56227/download/tmpqu3_jgk9.csv",
        status="ok", note="HTTP 200 (CSV).",
        what="Street segment, side, days and weeks of sweeping, season.",
        unlocks="V1 one-task helper: 'when must I move my car on my street?', with a ticket-avoiding next step.",
        joins=["boston-311"], caution="Schedules are seasonal; show the source date."),
    dict(id="census-acs", title="Census ACS 5-year estimates", org="U.S. Census Bureau", ch=["V2", "V5"],
        url="https://api.census.gov/data/2023/acs/acs5?get=NAME,B01001_001E&for=county:*&in=state:25",
        status="key", note="Redirects to 'missing key'. Free key at api.census.gov/data/key_signup.html.",
        what="Population, income, language, vehicle access and more for counties, towns, tracts, block groups.",
        unlocks="Denominators for FEMA counties and Cambridge/Somerville; no-car households for transit ideas.",
        joins=["fema", "ej", "neighborhoods"], caution="Use margins of error; small areas are noisy."),
    dict(id="bls-oews-ma", title="BLS wages by occupation, MA", org="U.S. Bureau of Labor Statistics", ch=["V5"],
        url="https://www.bls.gov/oes/current/oes_ma.htm",
        status="manual", note="HTTP 403 to scripts. Download in a browser.",
        what="Employment and median wage per occupation (SOC code) in Massachusetts.",
        unlocks="Adds 'what does this job pay in MA' to O*NET occupations (same SOC codes).",
        joins=["onet", "scorecard"], caution="Save the file with its release date."),
]

DATE_RE = re.compile(r"^(\d{4})(?:-(\d{2})-(\d{2}))?")


def read(name: str) -> tuple[list[str], list[dict]]:
    with open(DATASETS / name / "data.csv", newline="", encoding="utf-8-sig") as f:
        r = csv.DictReader(f)
        return list(r.fieldnames or []), list(r)


def time_range(rows: list[dict], col: str | None) -> str | None:
    if not col:
        return None
    vals = [m.group(0) for v in (r.get(col) or "" for r in rows) if (m := DATE_RE.match(v.strip()))]
    return f"{min(vals)} to {max(vals)}" if vals else None


def top_values(rows: list[dict], col: str | None, n: int = 6) -> list[tuple[str, int]]:
    if not col:
        return []
    c = Counter((r.get(col) or "").strip() or "(blank)" for r in rows)
    return c.most_common(n)


def norm(s: str) -> str:
    s = s.lower().replace("&", "and")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def pct(a: int, b: int) -> str:
    return f"{(100 * a / b):.0f}%" if b else "n/a"


def compute_joins(data: dict) -> tuple[list[dict], dict]:
    """Measure how well the obvious join keys actually line up."""
    joins, facts = [], {}

    # 311 neighborhood -> neighborhoods table
    nb = {norm(r["neighborhood"]): r for r in data["neighborhoods"][1]}
    n311 = Counter(norm(r["neighborhood"]) for r in data["boston-311"][1] if r["neighborhood"].strip())
    hit = sum(v for k, v in n311.items() if k in nb)
    total = sum(n311.values())
    unmatched = sorted(k for k in n311 if k not in nb)
    joins.append(dict(a="boston-311", b="neighborhoods", key="neighborhood",
        result=f"{pct(hit, total)} of 311 cases match a neighborhood row",
        note=("Unmatched names: " + ", ".join(unmatched[:6])) if unmatched else "All names match."))

    # per-capita 311 + poverty (real numbers for the 311 Fairness Lens idea)
    ontime = Counter()
    for r in data["boston-311"][1]:
        k = norm(r["neighborhood"])
        if k in nb and r["on_time"].strip().upper() == "ONTIME":
            ontime[k] += 1
    rates = []
    for k, cnt in n311.items():
        if k in nb:
            pop = float(nb[k]["population"] or 0)
            pu = float(nb[k]["poverty_universe"] or 0)
            pc = float(nb[k]["poverty_count"] or 0)
            if pop > 0:
                rates.append(dict(name=nb[k]["neighborhood"], cases=cnt, per1k=1000 * cnt / pop,
                                  ontime=100 * ontime[k] / cnt, poverty=(100 * pc / pu) if pu else 0))
    rates.sort(key=lambda d: -d["per1k"])
    facts["rates311"] = rates

    # unitid scorecard <-> ipeds
    sc = {r["unitid"] for r in data["scorecard"][1]}
    ip = {r["unitid"] for r in data["ipeds"][1]}
    joins.append(dict(a="scorecard", b="ipeds", key="unitid",
        result=f"{len(sc & ip)} of {len(sc)} Scorecard schools found in IPEDS",
        note="Exact federal id. The cleanest join in the kit."))

    # colleges <-> ipeds by normalised name
    cn = {norm(r["college"]) for r in data["colleges"][1]}
    ipn = {norm(r["name"]) for r in data["ipeds"][1]}
    joins.append(dict(a="colleges", b="ipeds", key="name (normalised)",
        result=f"{len(cn & ipn)} of {len(ipn)} IPEDS names match a MassGIS college",
        note="Name match only; use lat/long nearest-neighbour for the rest."))

    # permits / violations / 311 by ward
    def wards(name, col):
        return {r[col].strip().lstrip("0") for r in data[name][1] if r[col].strip()}
    wp, wv, w3 = wards("permits", "ward"), wards("violations", "ward"), wards("boston-311", "ward")
    joins.append(dict(a="permits + violations", b="boston-311", key="ward",
        result=f"{len(wp & wv & w3)} wards appear in all three",
        note=f"permits {len(wp)}, violations {len(wv)}, 311 {len(w3)} distinct wards."))

    # zip overlap
    def zips(name, col):
        return {r[col].strip().zfill(5) for r in data[name][1] if r[col].strip()}
    zp, zv, z3 = zips("permits", "zip"), zips("violations", "zip"), zips("boston-311", "zip_code")
    joins.append(dict(a="permits + violations", b="boston-311", key="zip",
        result=f"{len(zp & zv & z3)} zips appear in all three",
        note="Zero-pad zips before joining (CSV tools drop the leading 0)."))

    # mbta alerts routes -> routes
    rid = {r["id"] for r in data["mbta-routes"][1]}
    ar = Counter()
    for r in data["mbta-alerts"][1]:
        for x in (r["routes"] or "").split(","):
            if x.strip():
                ar[x.strip()] += 1
    subway = sum(v for k, v in ar.items() if k in rid)
    joins.append(dict(a="mbta-alerts", b="mbta-routes", key="route id",
        result=f"{subway} of {sum(ar.values())} alert-route links are subway routes",
        note="The rest are bus and commuter rail ids not in the 8-route table."))

    # bluebikes stations named after campuses
    stations = Counter()
    for r in data["bluebikes"][1]:
        stations[r["start_station"]] += int(r["trips"] or 0)
    campus_words = ["MIT", "Harvard", "BU ", "Boston University", "Northeastern", "Berklee", "Emerson",
                    "Simmons", "Tufts", "UMass", "Wentworth", "Suffolk", "College", "University"]
    campus_st = {s: t for s, t in stations.items() if any(w.lower() in s.lower() for w in campus_words)}
    total_trips = sum(stations.values())
    joins.append(dict(a="bluebikes", b="colleges", key="station name contains campus name",
        result=f"{len(campus_st)} stations, {pct(sum(campus_st.values()), total_trips)} of all Nov 2024 trips",
        note="Snapshot has no station coordinates; name matching is the quick path."))
    facts["topStations"] = stations.most_common(8)
    facts["bluebikesTrips"] = total_trips

    # EJ municipalities <-> colleges towns
    ejm = {norm(r["municipality"]) for r in data["ej"][1] if r["ej"].strip().lower() == "yes"}
    ct = {norm(r["town"]) for r in data["colleges"][1]}
    joins.append(dict(a="ej", b="colleges", key="municipality / town",
        result=f"{len(ejm & ct)} of {len(ct)} college towns contain an EJ block group",
        note="Town-level only; block-group geometry is not in the snapshot."))

    # crashes with coordinates
    def with_coords(name):
        rows = data[name][1]
        ok = sum(1 for r in rows if r.get("latitude", "").strip() and r.get("longitude", "").strip())
        return ok, len(rows)
    for name in ("vision-zero", "cambridge-crashes", "cambridge-bikes"):
        ok, n = with_coords(name)
        joins.append(dict(a=name, b="colleges / other points", key="lat/long radius",
            result=f"{pct(ok, n)} of rows have coordinates ({ok:,} of {n:,})",
            note="Haversine distance in the browser is fine at this size."))

    return joins, facts


def main() -> None:
    names = sorted(p.name for p in DATASETS.iterdir() if (p / "data.csv").exists())
    data = {n: read(n) for n in names}

    cards = []
    for n in names:
        cols, rows = data[n]
        m = META.get(n, dict(title=n, org="", src="", what="", time=None, top=None, keys=[], ch=[], geo=""))
        sample = rows[:3]
        cards.append(dict(
            id=n, title=m["title"], org=m["org"], src=m["src"], what=m["what"], ch=m["ch"], geo=m["geo"],
            keys=m["keys"], rows=len(rows), cols=cols, range=time_range(rows, m["time"]),
            topCol=m["top"], top=top_values(rows, m["top"]),
            sample=[[(r.get(c) or "")[:60] for c in cols] for r in sample],
            path=f"data/civic/datasets/{n}/data.csv",
        ))

    joins, facts = compute_joins(data)
    have = set(names)
    fetchable = [f for f in FETCHABLE if f["id"] not in have]
    for f in fetchable:
        f["joins"] = [j for j in f["joins"] if j in have or any(x["id"] == j for x in FETCHABLE)]
    payload = dict(cards=cards, joins=joins, facts=facts, ideas=IDEAS, fetchable=fetchable, checked=CHECKED,
                   challenges={k: dict(title=v[0], blurb=v[1]) for k, v in CHALLENGES.items()},
                   totalRows=sum(c["rows"] for c in cards))

    tpl = (HERE / "template.html").read_text(encoding="utf-8")
    # Escape "</" so dataset text can never close the <script> tag.
    blob = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    OUT.write_text(tpl.replace("/*__DATA__*/null", blob), encoding="utf-8")
    print(f"Wrote {OUT.relative_to(HERE.parent.parent.parent)}: {len(cards)} datasets, "
          f"{payload['totalRows']:,} rows, {len(joins)} joins, {len(IDEAS)} ideas, "
          f"{len(fetchable)} fetchable")


if __name__ == "__main__":
    main()
