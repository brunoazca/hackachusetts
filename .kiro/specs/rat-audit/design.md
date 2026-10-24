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
 │ computed: grid_cells, sites, action_outcomes, base_rates, correlations, model_runs,  │
 │           predictions, price_impact          (Python, pipeline/analytics + model)    │
 │ human:    decisions, trials, trial_pairs                                             │
 │ API:      read-only RPC functions (map_*, *_detail, area_stats, timeseries, agent_*) │
 └──────────────────────────────────────────────────────────────────────────────────────┘
          ▲  anon key (RLS: public read; decisions insert)
          │
 ┌──────── Next.js 16 on Vercel (web/) ─────────┐   /api/refresh → Modal /refresh (token server-side) [R1.4]
                                                    /api/simulate → Modal /simulate [R6.8]
                                                    /api/reveal  → private schema (service role) [R3.12]
 │ Assess · Act modes, map (MapLibre), panels   │
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

Additions for the v2 loop (new migration on top of the core and analysis schemas):

| Change | Purpose |
|---|---|
| `incidents.cause_tag text` | cause tag per closure note [R3.15] |
| `sites` rebuilt from 50 m clusters; `summary` holds counts, ladder, closure speed, drivers, `due`, `base_rate`, `recur_p`, `recommended` | [R3.2, R4.0] |
| `base_rates(prior_returns_bucket, n, returns, rate, ci_low, ci_high)` | [R6.10] |
| `decisions.reject_reason text` (required when status = rejected) | [R4.1] |
| `trials(id, created_at, intervention, n, seed, measure, window_days)` and `trial_pairs(trial_id, treatment_site, comparison_site, match_keys jsonb)` | [R11] |

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
  closures and 27% of 2026, while abatement and baiting rose: show that shift as a finding (BRAP practice card, R5.7). Optional LLM pass for unknowns (cached).
- **Cause classifier** → `incidents.cause_tag` [R3.15]: keyword rules on the same notes (trash, sewer / catch basin,
  dumpster, debris, vegetation / overgrowth, construction), first match wins, else `none`; optional cached LLM pass for
  notes that name a cause the rules miss. Coverage reported next to action-tag coverage.
- **Sites** → `sites` (definitions in `requirements.md`): rodent incidents 2024–2026 after collapsing same-day bulk
  loads (≥ 5 reports with identical `opened_at` date at one `address_key` count as 1), clustered in SQL with
  `ST_ClusterDBSCAN(ST_Transform(geom, 26986), eps := 50, minpoints := 3)`. `address_key` stays as the grouping inside a
  site (and for privacy), not as the site. Return = a report in the site opened 1–60 days after an earlier report's
  `closed_at`. No composite score: the UI shows counts; ordering is Due first, then returns in the last 12 months.
  `summary`: counts (reports, closures, returns, days since last closure); `ladder` (ordered action tags with returns
  between them); `speed` (site median closure days vs citywide median for the same tag); `notes` (last 5, scrubbed, with
  both tags); `drivers` (counts within 100 m over the site's active period by category / place kind with ids, incl. trash
  tickets last 12 months and schools); `building` (nearest parcel); `adjacent_vacant` (vacant-land parcel within 40 m);
  `due`, `base_rate`, `recur_p`; `expected_month` (yearly mean × month seasonal factor) [R3.16].
  `recommended`: the five rules in R3.9, first match wins, each with `because` + source_ids. A final filter drops any
  text outside sanitation / exclusion / enforcement / referral or mentioning rodenticide or poison [R3.10].
  `unknowns` [R3.11, P1]: 2–3 open checks drafted by the LLM from notes + drivers, cached, editable in the UI.
- **What worked** → `action_outcomes`: for each closed rodent case with an action tag, did the same site get a return
  within 60 days? Rate + n + Wilson 95% interval + median days to next, by tag, and by tag × year for the practice card.
  Every display carries the selection-bias caveat.
- **Base rates** → `base_rates` [R6.10]: for every closure, bucket the site's prior returns (0, 1, 2, 3+) and record
  whether a return followed within 60 days; rate + n + Wilson interval per bucket. A site is Due when its last closure
  is inside the window and its bucket's rate is ≥ the threshold (25% placeholder, set once the table runs).
- **Enforcement gaps** [R11.3]: Due sites with 0 code-enforcement trash tickets within 100 m in the last 12 months.
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

**Early warning** [R6.7]: cells where dead-animal and indoor-pest reports rose over the last 12 weeks while rodent
reports stayed ≤ 1; flagged with `emerging` and shown with the same dashed style.

**site_recurrence_logit** — one row per closed rodent case; y = return in the same site within 60 days; features: action tag,
prior returns bucket, nearby drivers, building, month. Logistic regression; AUC on time split, compared with the base-rate
baseline (must beat it to be shown as the model). Per site → `summary.recur_p`.

## 5b. Trials (Prove) [R11]

`design_trial(n, intervention, seed)` (insert RPC, or Modal endpoint if SQL gets awkward): candidate sites = Due sites
without an open trial; stratify by (neighborhood, prior-returns bucket, trash-ticket tercile); within each stratum pair
sites in random order from `setseed(seed)`; flip a seeded coin per pair for treatment. Writes `trials` + `trial_pairs`
(`match_keys` = the three values). Output: pairs on the map, CSV export, the measure ("returns within 60 days, treatment
vs comparison"). Result view [R11.2]: after `created_at + 60 days`, returns per arm with n and interval, labelled as this
trial's result. The system designs and measures; the city carries out the intervention.

## 6. API (Postgres RPCs, read-only, `grant execute to anon`)

| RPC | Returns | Used by |
|---|---|---|
| `map_incidents(min_lon,min_lat,max_lon,max_lat,categories,since,until,status,max_rows)` | GeoJSON FeatureCollection (id, category, status, opened_at, recurred) | map [R2.2–R2.5] |
| `map_places(bbox,kinds,since,until)` / `map_events(bbox,since,until)` | GeoJSON | map |
| `map_sites(bbox,limit)` / `map_forecast(bbox,week)` | GeoJSON (sites with counts / Due; cells with band) | map [R2.1, R6.1] |
| `site_queue(limit, neighborhood)` | sites with counts, Due, last action, days since close | Act queue [R4.0] |
| `base_rates()` / `practice_shift()` | tables with n and interval | findings, case [R6.10, R5.7] |
| `design_trial(n, intervention, seed)` (insert) / `trial_result(id)` | pairs / arm results | Prove [R11] |
| `followups_due()` | approved decisions near or past check-again date, returns since | Act [R4.6] |
| `incident_detail(id)` / `place_detail(id)` / `event_detail(id)` / `site_detail(id)` / `cell_detail(id,week)` | jsonb incl. sources | inspector [R3] |
| `area_stats(geojson,since,until)` | counts by category, open/closed, median days to close, top actions | inspector [R2.9] |
| `timeseries(bbox,categories,since,until)` | weekly counts + event marks | timeline [R2.7] |
| `agent_*` | as needed by tools | agent [R8] |

## 7. Frontend (web/)

Layout [R0]: top bar (name, live badge + Refresh, search, mode switch **Assess / Act**) and two modes. Everything else
(site case, report / place / cell details, findings, forecast summary, work order, trial designer, assistant) opens in
side panels or popovers on interaction, never as more top-level tabs. Selection is shared across modes. Panel placement,
sizes and visual design are decided in the UI design pass (Gui); the component list below is what must exist, not where it sits.
Map store (`web/src/lib/map-store.ts`): `flyTo, setLayers, setFilters, setHighlight, select, setPanel, setForecastWeek`.

| Component | Responsibility | Reqs |
|---|---|---|
| `shell/TopBar` | name, live badge + Refresh, search, top-site quick links | R1.6, R2.10 |
| `map/MapView` + `map/layers/*` | sources/layers, clustering, hover, click→select, highlight, flyTo | R2 |
| `map/LayerControl`, `map/Legend`, `map/Timeline`, `map/FeatureList`, `map/AreaDraw` | controls | R2.3, R2.5, R2.7, R2.9, R2.11, R2.12 |
| `inspector/*` (`SiteCard`, `IncidentCard`, `PlaceCard`, `EventCard`, `CellCard`, `AreaCard`, `TopSites`, `SourceCite`) | detail views | R3 |
| `act/SiteQueue`, `act/FollowUps` | Due-first queue, follow-ups due | R4.0, R4.6 |
| `inspector/ActionReview`, `inspector/WorkOrder` | approve/edit/reject (reject reason required), print view with check-again date | R4 |
| `act/TrialDesigner`, `act/TrialResult` | matched pairs, CSV export, arm results | R11 |
| `insights/InsightsPanel` (`FindingCard`, `PracticeCard`, `ForecastSummary`, `PriceImpact`) | findings, BRAP practice shift, model scores, impact | R5, R6.2–3, R7 |
| `chat/ChatPanel` (`Message`, `ToolStep`, `SourceChip`, `FeatureChip`, `Starters`) | assistant UI | R8 |

Styling: Tailwind; palette from categories.json; open = red, closed = grey, recurred = ring; forecast sequential palette.
Mobile: side panel becomes a bottom sheet [R9.4].

## 8. Agent [R8]

`/api/chat`: `streamText({ model, system, messages, tools, stopWhen: stepCountIs(8) })`, streamed to `useChat`.

System prompt essentials: role (assistant to an ISD rodent inspector / BRAP coordinator); answer only from tool results;
always show the map (call map tools); cite `source_ids`; "reports" not "rats"; correlation ≠ cause; never names or house
numbers; recommend, never decide; never recommend rodenticide or poison; say when data can't answer; concise.

Server tools: `geocode, search_incidents, top_sites, due_sites, get_site, nearby_drivers, what_worked, get_findings, forecast,
price_impact, events_near, compare_areas, draft_work_order, get_trial`. Client tools (executed in the browser on the map store):
`map_fly_to, map_set_layers, map_set_filters, map_highlight, map_select, map_show_forecast, open_panel`.
Each message carries `{selection, bbox, filters}` from the store [R8.5].

## 9. Error handling

- DB/RPC error → panel-level error with retry; map keeps last good data [R1.12].
- Empty layer → legend shows "0 in view", never a crash.
- Refresh failure → badge shows "Live data stale since <time>" and the error message.
- No model provider → chat shows "assistant not configured" [R8.9].
- Unsupported question → assistant says the data can't answer it [R8.8].

## 10. Testing

- **Property-based** (Hypothesis, Python): returns ≤ reports − 1 per site; ranking deterministic for equal input; every
  `source_id` in every table resolves; no public column matches a house-number or owner-name pattern; no recommendation
  text mentions rodenticide or poison; every trial pair matches on its `match_keys` and the same seed gives the same pairs.
- **Unit**: closure classifier on real 2025 and 2026 rodent notes (non-unknown ≥ 90% per year); address normalizer; agent tools against live DB (vitest).
- **Fake-model route test**: AI SDK mock model drives a tool loop including a client tool call.
- **E2E** (Playwright): open → map renders points → switch to Act → select a Due site → case shows ladder + timeline →
  Approve → work order with check-again date; Reject without a reason is blocked.
- Kiro hooks: `snapshot-citation-check` (sources resolve), `demo-path-green` (E2E), `accessibility-check`.

## 11. Demo path (under 3 minutes) → requirements

0. Line: "Boston closes 99% of rat cases. N came back within 60 days." [R1.6]
1. Assess: live map, "Live · updated 3 min ago", 90 days of rodent reports, sites [R1.6, R2.1].
2. Toggle trash + vacant lots; scrub the timeline to Sept 1 → the **trash** spike (about 2× citywide, 4–5× in Allston, Mission Hill and Fenway, every year 2023–2025). Say plainly that rodent reports do not follow it 1–4 weeks later [R2.3, R2.7, R5.2].
3. Ask: "Why do rats keep coming back on Normandy St?" → map flies, drivers light up, 16 closures listed with sources [R8.1–R8.4].
4. Act: queue with Due sites first → Normandy St case: escalation ladder, notes that close in a day, lot next door, return probability vs base rate [R4.0, R3.2].
5. Approve "joint block visit + notice to the lot's owner" → work order, check again in 60 days [R4].
6. Trial designer: 10 matched pairs for sealed containers, measure = returns in 60 days [R11.1].
7. Forecast layer for next week + model vs baseline score; trash storage finding with caveat, counted costs [R6, R5, R7].
8. Kiro: this spec → privacy property test → passing [R10.4].
9. Limits: reports aren't rats; what worked is not causal yet — that's what the trial is for.
