# Rat Audit — build contract

Shared by every build track. Change it only by agreement; if a track needs a new
table or column, add a **new** migration file (never edit another track's file).

## Product in one line

A live map of every rat-related signal in Boston. An ISD rodent inspector or the
BRAP coordinator clicks anything to inspect it, sees what drives rats there, what
the city already tried, what is forecast next, and approves the next action. An
agent answers questions and drives the map.

## Stack

| Piece | Choice |
|---|---|
| App | Next.js 16 (App Router, TS, Tailwind 4) in `web/`, deployed on Vercel (root dir `web`) |
| Map | MapLibre GL via `react-map-gl/maplibre`, basemap `https://tiles.openfreemap.org/styles/positron` |
| Data | Supabase Postgres + PostGIS, project ref `vfizpwajekykmbcrport` (us-east-1) |
| Pipeline | Python 3.12 via `uv` in `pipeline/` (bulk backfill, analytics, model) |
| Live refresh | `web/src/app/api/refresh/route.ts` (Vercel cron + "Refresh" button) pulls new 311 rows from Analyze Boston into Supabase |
| Agent | Vercel AI SDK v7 (`ai`, `@ai-sdk/react`), provider switch by `MODEL_PROVIDER` = `gateway` \| `anthropic` \| `bedrock` |

Secrets live in the repo-root `.env.local` (git-ignored; `web/.env.local` is a symlink to it):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_DB_URL` (session pooler, use for psql / bulk loads), `SOCRATA_APP_TOKEN`.

## Ownership (one owner per path)

| Track | Owns |
|---|---|
| **data** | `pipeline/ingest/**`, `supabase/migrations/*_data_*.sql`, `web/src/app/api/refresh/**`, `web/vercel.json` |
| **analytics** | `pipeline/analytics/**`, `pipeline/model/**`, `supabase/migrations/*_analytics_*.sql`, `web/src/components/insights/**` |
| **map** | `web/src/components/map/**`, `web/src/components/inspector/**`, `web/src/components/shell/TopBar.tsx`, `web/src/lib/queries.ts`, `supabase/migrations/*_api_*.sql` |
| **agent** | `web/src/app/api/chat/**`, `web/src/components/chat/**`, `web/src/lib/agent/**`, `supabase/migrations/*_agent_*.sql` |
| shared (integrator only) | `web/src/app/page.tsx`, `web/src/components/shell/SidePanel.tsx`, `web/src/lib/map-store.ts`, `web/src/lib/supabase.ts`, `contracts/**`, `web/package.json` |

A track that needs a package: install it, and list it in its final report (the integrator merges `package.json`).

## Data model

See `supabase/migrations/20261024000001_core_schema.sql` (sources, incidents, places,
events, weather_daily, parcels, zip_prices, listings, tracts, sites, action_outcomes,
decisions, ingest_runs) and `20261024000002_analysis_schema.sql` (correlations,
grid_cells, model_runs, predictions, price_impact). Category ids: `contracts/categories.json`.

Rules:
- Every row has a `source_id` that exists in `sources` (name, url, retrieved_at).
- **Privacy:** no owner names, no staff names, no house numbers in any public column.
  `address_block` = street + ZIP ("Normandy St, 02121"). `address_key` = sha256 of the
  normalized full address, for grouping only.
- Times are `timestamptz` in UTC; display in America/New_York.

## Map store (the agent drives the map through it)

`web/src/lib/map-store.ts` (zustand): `flyTo`, `setLayers`, `setFilters`, `setHighlight`,
`select`, `setPanel`, `setForecastWeek`. Selections are `{kind, id}` where kind is
`incident | place | event | site | cell | listing | tract | area`. Feature ids on the
map equal table primary keys so the agent can highlight/select by id.

## Correlations we show (analytics track computes, Insights panel renders)

Each becomes one `correlations` row with a chart payload and a caveat. Unit is a
250 m grid cell unless stated. Prefer rates (per 311 report overall, per parcel)
over raw counts to control for "who reports".

| id | Question | Method |
|---|---|---|
| `trash-storage-vs-rodent` | Do blocks with improper trash storage get more rodent reports? | Spearman over cells, 2025; scatter |
| `trash-day-effect` | Is rodent rate higher where pickup is Monday (barrels out all Sunday)? | rate by pickup day, cells |
| `demolition-displacement` | Do rodent reports rise within 300 m after a demolition? | event study, −90…+90 days vs random control points |
| `rain-lag` | Do reports rise 0–7 days after heavy rain? | cross-correlation, daily citywide |
| `move-out-spike` | Is there a Sept 1 spike in student ZIPs? | weekly series, student ZIPs vs rest |
| `seasonality-temperature` | Do mild winters precede bigger springs? | monthly series vs temperature |
| `restaurant-violations-nearby` | Do restaurants cited for rodents sit in rodent hot spots? | reports within 100 m ±30 days of citation vs other restaurants |
| `building-age-owner` | Old buildings and absentee owners? | rodent rate per parcel by year-built bucket × owner-occupied |
| `bigbelly-protective` | Are Big Belly bins associated with fewer reports? | matched cells with/without bins |
| `events-trash-surge` | Do licensed events/games produce trash then rodent reports? | event study around events, 500 m |
| `what-worked` | Which city actions are followed by fewer repeats? | 60-day recurrence by closure action tag |
| `underreporting` | Where do iNaturalist sightings exceed 311 reports? | ratio by tract vs social vulnerability |
| `asthma-tracts` | Rodent rate vs adult asthma prevalence | Spearman over tracts (context, not causal) |

## Prediction

1. **Cell-week risk forecast** (`model: cell_week_poisson_gbm`): rodent reports per 250 m cell
   per week, 1–4 weeks ahead. Features: lagged rodent counts (1, 4, 12 weeks; same week last
   year), nearby trash/dumping/litter reports (lagged), demolitions/excavations/work zones within
   300 m in last 90 days, restaurant rodent citations nearby, parcel age/owner-occupancy mix,
   Big Belly count, week of year, move-out week, holiday-shift week, rain last 7 days, mean
   temperature, scheduled events nearby. Gradient boosting with Poisson loss. Backtest on the
   most recent 26 weeks against the baseline "average of last 4 weeks". Store metrics, feature
   importance and per-cell top drivers. Next week's rain comes live from the NWS forecast API.
2. **Site recurrence** (`model: site_recurrence_logit`): P(new report within 60 days | a case
   just closed, its action tag, nearby drivers). Feeds the site card and "what worked".

Forecast is shown as a map layer (`forecast`), in the cell inspector (drivers) and to the agent.
Language: "expected reports", never "rats".

## Price and cost impact (exploratory, always captioned as such)

- Assessed value change FY2025→FY2026 at parcels within 100 m of chronic sites vs matched
  parcels (same ZIP, land use, year-built bucket).
- Short-stay listings: nightly price and rat-mention reviews near hot spots vs elsewhere.
- ZIP home value / rent (Zillow) vs rodent rate: report the weak, confounded result honestly.
- Costs we can count: city pest-control payments (Checkbook), restaurant citations, repeat
  inspector visits.

## Events

`events` table + map layer + timeline marks: one-day alcohol and entertainment licenses,
Red Sox home games (MLB stats API), Sept 1 move-out, holiday pickup delays, heavy rain and snow days.

## Demo site

Normandy St, Dorchester 02121: 16+ escalating city actions in 2025, rats kept coming back,
adjacent parcel is "RES LAND (Unusable)". Must be rank ≤ 3 in `sites` or pinned for the demo.
