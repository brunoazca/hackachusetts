# Design — Rat Audit Boston

Serves `requirements.md`. Requirement ids in brackets. Track ownership and file
paths: `docs/rat-audit/CONTRACT.md`.

## 1. Architecture

```
 Analyze Boston (CKAN)  NOAA  MLB  NWS  CDC  Zillow  Inside Airbnb  iNaturalist
          │
          ▼
 ┌──────────── Modal worker (Python `pipeline/rat_audit`, workspace harvard) ───────────┐
 │ backfill (fan-out per source) · daily cron: refresh → analytics → score              │
 │ weekly cron: retrain + backtest · POST /refresh (button) · POST /simulate (what-if)   │
 └──────────────────────────────────────────────────────────────────────────────────────┘
          │ writes (SUPABASE_DB_URL)
          ▼
 ┌──────────────────────────── Supabase Postgres + PostGIS ────────────────────────────┐
 │ raw-ish:  sources, incidents, places, events, weather_daily, parcels, zip_prices,   │
 │           listings, tracts, ingest_runs                                              │
 │ computed: grid_cells, sites, action_outcomes, correlations, model_runs,              │
 │           predictions, price_impact          (Python, pipeline/analytics + model)    │
 │ human:    decisions                                                                  │
 │ API:      read-only RPC functions (map_*, *_detail, area_stats, timeseries, agent_*) │
 └──────────────────────────────────────────────────────────────────────────────────────┘
          ▲  anon key (RLS: public read; decisions insert)
          │
 ┌──────── Next.js 16 on Vercel (web/) ─────────┐   /api/refresh → Modal /refresh (token server-side) [R1.4]
                                                    /api/simulate → Modal /simulate [R6.8]
                                                    /api/reveal  → private schema (service role) [R3.12]
 │ Map (MapLibre) · Inspect · Insights · Ask    │
 │ zustand map store  ◄── client tools ──┐      │
 │ /api/chat  (AI SDK streamText + server tools)│──► model provider (gateway|anthropic|bedrock)
 └──────────────────────────────────────────────┘
```

- **Live** [R1.1]: the browser reads Supabase directly through RPCs; no snapshot on the main path.
- **Fresh** [R1.4]: the Modal worker owns all Python (ingest, analytics, model). Daily cron and the Refresh button (Vercel `/api/refresh` → Modal `refresh`, bearer `RAT_AUDIT_WORKER_TOKEN`) pull new rows, then re-run analytics and scoring, so the forecast is as live as the data. Weekly cron retrains. See `pipeline/README.md`.
- **Provider-agnostic agent** [R8.9]: `MODEL_PROVIDER` env selects Vercel AI Gateway (default), Anthropic API or AWS Bedrock.

## 2. Data model

Defined in `supabase/migrations/20261024000001_core_schema.sql` and
`20261024000002_analysis_schema.sql`. Categories, place kinds, event kinds and action
tags: `contracts/categories.json` (single source; copied to `web/src/lib/categories.json`).

Key rules:
- Primary keys are stable strings (`311:<case_id>`, `food:<license>`, `permit:<id>`, `g250_<c>_<r>`) and equal the map feature ids, so the agent can highlight/select by id [R8.2].
- `address_block` = street + ZIP; `address_key` = sha256(normalized full address) [R1.11].
- Names and full addresses live in schema `private` (`parcel_owners`, `incident_details`, `reveal_log`), not exposed by PostgREST. `/api/reveal` (Vercel, service role) returns one value per click and writes `reveal_log`; the UI renders a blurred placeholder with an eye button until then [R3.12]. Public `closure_note` is scrubbed of personal names; the raw note is in `private.incident_details`.
- Every row carries `source_id` → `sources` [R3.8] and spatial rows carry `city` (boston | cambridge | somerville) [R1.13].
- Points returned by the API are snapped to ~20 m.

## 3. Ingestion (`pipeline/rat_audit/ingest/<source>.py`, each `run(conn, since=None) -> rows`; runs on Modal) [R1]

| Loader | Source | Target |
|---|---|---|
| `t311.py` | 311 yearly tables 2023–2026 + new-system table (trash types) | incidents |
| `parcels.py` | Property assessment FY2025, FY2026; coordinates via RentSmart / SAM | parcels, places(vacant_parcel) |
| `food.py` | Food inspections, rodent/mice violations since 2024 | places(restaurant) |
| `permits.py` | Approved building permits (demolition, excavation); PW work zones | places |
| `places_misc.py` | Big Belly, city-owned property, public schools | places |
| `weather.py` | NOAA GHCN-Daily USW00014739 | weather_daily, events(rain/snow/heat) |
| `events.py` | One-day alcohol + entertainment licenses, MLB Red Sox home games, Sept 1, holidays | events |
| `regional.py` | Somerville 311 `4pyi-uqq6` (Rats, Rodent Assistance Program, School Rodent Control; `block_code` → 2020 census block centroid via TIGERweb), Cambridge rodent sightings `uz4w-baz5`, Cambridge smart rat boxes `78bs-b5ig` (Socrata, `SOCRATA_APP_TOKEN`) | incidents(city), places(smart_box, attrs.monthly_catches) |
| `context.py` | Climate Ready SVI tracts, CDC PLACES asthma, Zillow ZHVI/ZORI, Inside Airbnb, iNaturalist | tracts, zip_prices, listings, incidents(inat_rat) |

Bulk loads use `COPY` into a temp table then `INSERT … ON CONFLICT DO UPDATE`, never
overwriting `action_tag`. CKAN gotcha: `datastore_search_sql` blocks some functions;
compute durations locally. Raw downloads cache to `.cache/raw/` (git-ignored).

**Refresh** [R1.4–R1.6]: Modal `refresh` endpoint runs `REFRESH_SOURCES` (Boston 311, regional, code enforcement) with `since=14d`, writes `ingest_runs`, then spawns `analytics_and_score`. Vercel `/api/refresh` is a thin proxy that adds the bearer token and enforces the 5-minute guard [R1.5] by reading the last `ingest_runs` row. Daily Modal cron at 10:00 UTC.

## 4. Analytics (pipeline/analytics) [R3, R5, R7]

- **Grid**: 250 m squares (EPSG:26986 Mass State Plane meters), clipped to Boston neighborhoods.
- **Closure classifier** → `incidents.action_tag`: the ordered, first-match-wins rules in
  `knowledge/sources/scripts/closure_classifier_rules.py` (drafted by Kiro Crew campaign `d19b46b7`, aligned to
  categories.json). Order: duplicate → collections → abatement_order → citation → warning → baiting → barrels →
  cleanup → no_violation → referral → inspection → monitoring; empty note → `closed_no_action`; no match → `unknown`.
  Future or conditional intent ("will bait as needed", "will issue violation if necessary") is monitoring, except
  abatement and scheduled inspections. Measured non-unknown: 95.5% (2025), 92.7% (2026). Monitoring is 49% of 2025
  closures and 27% of 2026, while abatement and baiting rose: show that shift as a finding. Optional LLM pass for unknowns (cached).
- **Chronic sites** → `sites`: rodent incidents 2024–2026 grouped by `address_key`; drop same-day bulk loads
  (≥ 5 reports with identical `opened_at` date at one key count as 1). Recurrence = a report opened 1–60 days after a
  prior report's `closed_at`. Score = 100 × weighted percentile of (recurrences 0.5, reports 0.3, recency 0.2), clipped 0–100.
  `summary.drivers`: counts within 100 m over the site's active period by category/place kind with ids.
  `summary.building`: nearest parcel; `adjacent_vacant` if a vacant-land parcel lies within 40 m.
  `recommended`: rules from the driver→action table (knowledge/10_rat_signals_brainstorm.md §4) with `because` + source_ids.
  Rules added from the research [R3.9–R3.11], evaluated first: (1) ≥ 2 recurrences and the last actions were
  monitoring / inspection / "noted" → recommend citation or abatement order, because "monitoring 14.1% → 14.2%,
  violation 15.3% → 12.2%" (what worked); (2) `adjacent_vacant` → joint block visit and action on the adjacent parcel;
  (3) drivers dominated by trash storage or dumping → sealed containers, citing NYC containerization and Boston's
  $500K participatory-budgeting container project.
- **What worked** → `action_outcomes`: for each closed rodent case with an action tag, did the same `address_key`
  get a new report within 60 days? Rate + n + median days to next, by tag.
- **Correlations** → `correlations` (one row each; method per `docs/rat-audit/CONTRACT.md` table). Cell-level rates use
  rodent reports per 100 total 311 reports in the cell (controls for reporting propensity). Spearman with permutation p;
  event studies with matched random control points; strength: |ρ| ≥ .5 strong, ≥ .3 moderate, ≥ .1 weak, else none.
  Pre-tested results (Oct 24) are in `data-audit.md` and `knowledge/sources/rats/validation/*_results.txt`:
  rain, snow, demolitions, events, restaurants and Big Belly are honest nulls; season (+0.87), dead animal, indoor pest,
  trash storage (311 and code enforcement) and move-out are the positive findings; tract-level 311 under-reporting replaces asthma.
- **Three-city comparison** [R5.6]: monthly rodent reports per 1,000 residents per city (ACS population); Somerville program requests vs Rats requests over time; Cambridge sightings within 200 m of smart boxes before/after the box's first nonzero month vs other sightings. Caveat: three different reporting systems.
- **Price impact** → `price_impact`: assessed-value % change FY25→FY26 for residential parcels within 100 m of top-50 sites vs
  matched parcels (same ZIP, land-use code, year-built decade) — difference in medians with bootstrap CI; listings: median
  nightly price and rat-review share within 250 m of top sites vs elsewhere; Zillow ZIP Spearman; counted costs
  (Checkbook `7afd05bc-34ec-4a1c-b470-bf43ea584f81`, citations, repeat inspections).

## 5. Prediction (pipeline/model) [R6]

**cell_week_poisson_gbm** — target: rodent reports per cell per ISO week.
Features (all known at prediction time):
Feature set follows `data-audit.md` (tested Oct 24; nulls removed):
- lags: reports t-1, mean t-1..t-4, mean t-1..t-12, same week last year (strongest signal);
- leading 311 signals in cell + ring, t-1..t-12: dead animal pickups, indoor pest, improper trash storage, overflowing,
  trash out early, weeds, litter, student move-in trash;
- code enforcement tickets (`90ed3816-5e70-443c-803d-9a71f44470be`): residential trash storage, overfilling, dumping, t-1..t-12;
- static: non-rodent 311 volume and address count (reporting/density controls), median year built, units;
- calendar: week of year (sin/cos), move-out week flag;
- weather: mean temperature last 4 weeks; for future weeks, climatology.
Not used (no effect in tests): rain, snow, demolitions/excavations/work zones, restaurants and food licenses, Big Belly,
events, holiday shifts.
Scope: Boston cells (the richest drivers); Cambridge cells as P2 if time allows. Model: `HistGradientBoostingRegressor(loss="poisson")`. Backtest: rolling origin over the last 26 weeks, train on all
earlier weeks. Metrics: MAE vs baseline (mean of last 4 weeks), top-10% cell capture vs baseline. Explanations:
permutation importance (global) and per-cell drivers = prediction change when each feature group is set to its city
median (top 5). `p_any = 1 - exp(-expected)`. Risk bands by quantile of `expected` (≤60% low, ≤85% elevated,
≤95% high, else very_high). Writes `model_runs` + `predictions` (backtest weeks with `actual`, next 4 weeks without).

**Emerging hotspots** [R6.7]: cells whose forecast is in the top risk bands but had ≤ 1 rodent report in the previous
12 weeks, flagged `summary.emerging` with the leading signals that drove them (trash storage, dead animals, indoor pest,
move-out trash, code-enforcement tickets). Map style: dashed outline; agent tool `forecast(emerging=true)`.

**What-if simulator** [R6.8]: Modal `simulate` loads the latest model, edits the chosen cell's/site's features per
intervention (e.g. `trash_storage`: improper-storage signals × 0.5; `clear_lot`: weeds/vacant-lot signals → 0;
`pest_followup`: indoor-pest lag × 0.5), re-predicts 4 weeks and returns `{baseline, scenario, delta, caveat}`.
Labelled "model estimate, not a measured effect".

**site_recurrence_logit** — one row per closed rodent case; y = new report at same key within 60 days; features: action tag,
prior reports at key (90 days), nearby drivers, building, month. Logistic regression; AUC on time split. Per site → `summary.recur_p`.

## 6. API (Postgres RPCs, read-only, `grant execute to anon`)

| RPC | Returns | Used by |
|---|---|---|
| `map_incidents(min_lon,min_lat,max_lon,max_lat,categories,since,until,status,max_rows)` | GeoJSON FeatureCollection (id, category, status, opened_at, recurred) | map [R2.2–R2.5] |
| `map_places(bbox,kinds,since,until)` / `map_events(bbox,since,until)` | GeoJSON | map |
| `map_sites(bbox,limit)` / `map_forecast(bbox,week)` | GeoJSON (sites with score/rank; cells with band) | map [R2.1, R6.1] |
| `incident_detail(id)` / `place_detail(id)` / `event_detail(id)` / `site_detail(id)` / `cell_detail(id,week)` | jsonb incl. sources | inspector [R3] |
| `area_stats(geojson,since,until)` | counts by category, open/closed, median days to close, top actions | inspector [R2.9] |
| `timeseries(bbox,categories,since,until)` | weekly counts + event marks | timeline [R2.7] |
| `agent_*` | as needed by tools | agent [R8] |

## 7. Frontend (web/)

Layout: top bar · full-bleed map · 420 px side panel with tabs Inspect / Insights / Ask [R2.1].
Map store (`web/src/lib/map-store.ts`): `flyTo, setLayers, setFilters, setHighlight, select, setPanel, setForecastWeek`.

| Component | Responsibility | Reqs |
|---|---|---|
| `shell/TopBar` | name, live badge + Refresh, search, top-site quick links | R1.6, R2.10 |
| `map/MapView` + `map/layers/*` | sources/layers, clustering, hover, click→select, highlight, flyTo | R2 |
| `map/LayerControl`, `map/Legend`, `map/Timeline`, `map/FeatureList`, `map/AreaDraw` | controls | R2.3, R2.5, R2.7, R2.9, R2.11, R2.12 |
| `inspector/*` (`SiteCard`, `IncidentCard`, `PlaceCard`, `EventCard`, `CellCard`, `AreaCard`, `TopSites`, `SourceCite`) | detail views | R3 |
| `inspector/ActionReview`, `inspector/WorkOrder` | approve/edit/reject, print view | R4 |
| `insights/InsightsPanel` (`FindingCard`, `ForecastSummary`, `PriceImpact`) | findings, model scores, impact | R5, R6.2–3, R7 |
| `chat/ChatPanel` (`Message`, `ToolStep`, `SourceChip`, `FeatureChip`, `Starters`) | assistant UI | R8 |

Styling: Tailwind; palette from categories.json; open = red, closed = grey, recurred = ring; forecast sequential palette.
Mobile: side panel becomes a bottom sheet [R9.4].

## 8. Agent [R8]

`/api/chat`: `streamText({ model, system, messages, tools, stopWhen: stepCountIs(8) })`, streamed to `useChat`.

System prompt essentials: role (assistant to an ISD rodent inspector / BRAP coordinator); answer only from tool results;
always show the map (call map tools); cite `source_ids`; "reports" not "rats"; correlation ≠ cause; never names or house
numbers; recommend, never decide; say when data can't answer; concise.

Server tools: `geocode, search_incidents, top_sites, get_site, nearby_drivers, what_worked, get_findings, forecast,
price_impact, events_near, compare_areas, draft_work_order`. Client tools (executed in the browser on the map store):
`map_fly_to, map_set_layers, map_set_filters, map_highlight, map_select, map_show_forecast, open_panel`.
Each message carries `{selection, bbox, filters}` from the store [R8.5].

## 9. Error handling

- DB/RPC error → panel-level error with retry; map keeps last good data [R1.12].
- Empty layer → legend shows "0 in view", never a crash.
- Refresh failure → badge shows "Live data stale since <time>" and the error message.
- No model provider → chat shows "assistant not configured" [R8.9].
- Unsupported question → assistant says the data can't answer it [R8.8].

## 10. Testing

- **Property-based** (Hypothesis, Python): site score ∈ [0,100]; ranking deterministic for equal input; every `source_id`
  in every table resolves; no public column matches a house-number or owner-name pattern; recurrence count ≤ report count − 1.
- **Unit**: closure classifier on real 2025 and 2026 rodent notes (non-unknown ≥ 90% per year); address normalizer; agent tools against live DB (vitest).
- **Fake-model route test**: AI SDK mock model drives a tool loop including a client tool call.
- **E2E** (Playwright): open → map renders points → click top site → card shows timeline → Approve → work order visible.
- Kiro hooks: `snapshot-citation-check` (sources resolve), `demo-path-green` (E2E), `accessibility-check`.

## 11. Demo path (under 3 minutes) → requirements

1. Open: live map, "Live · updated 3 min ago", 90 days of rodent reports, chronic stars [R1.6, R2.1].
2. Toggle trash + vacant lots; scrub the timeline to Sept 1 → the **trash** spike (about 2× citywide, 4–5× in Allston, Mission Hill and Fenway, every year 2023–2025). Say plainly that rodent reports do not follow it 1–4 weeks later [R2.3, R2.7, R5.2].
3. Ask: "Why do rats keep coming back on Normandy St?" → map flies, drivers light up, 16 closures listed with sources [R8.1–R8.4].
4. Site card: timeline of escalating actions, adjacent vacant lot, recurrence probability, what worked nearby [R3.2].
5. Approve "joint block visit + vacant-lot clearing" → work order, follow-up in 60 days [R4].
6. Forecast layer for next week + model vs baseline score [R6].
7. Insights: trash storage finding, honest price result, counted costs [R5, R7].
