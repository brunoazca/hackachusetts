# Requirements — Rat Audit Boston

Format: EARS. Every requirement has an id (`R<area>.<n>`) used by `design.md`,
`tasks.md`, tests and the demo-to-requirement map. Priority: **P0** = must work in
the demo video; **P1** = should ship; **P2** = stretch.

## Problem

Boston logged **5,321 Rodent Activity reports in 2026 through Oct 23**, already more
than all of 2025 (5,225). 99% of cases close, yet **407 addresses got a new report
30+ days after an earlier one**, and 46 addresses had 5+ reports in 2025. The city's
Boston Rodent Action Plan (BRAP, July 2024) spans 10 agencies, but the signals that
explain rats (trash, restaurants, buildings, construction, weather, events) sit in
separate datasets. An inspector closing a case cannot see that the same block has
been "closed" 16 times, that the vacant lot next door is the likely source, or that
reports are about to rise. Sources: `knowledge/15_boston_rat_audit.md`.

## Users

- **Primary:** an ISD rodent inspector planning this week's visits.
- **Secondary:** the BRAP coordinator who looks across neighborhoods and agencies.
- **Tertiary (read-only):** residents and councillors who want to understand their block, and peer staff in Cambridge and Somerville (rats cross city lines).

## Goal

From "where are the rat problems and why do they keep coming back?" to "I approved
the next action for this site, with evidence, and I know when to check again" —
on one live map, in minutes.

## Non-negotiables

- Every number and claim shown has an in-product citation (source name, URL, retrieved/updated time).
- A human approves every action. The app never sends, files or enforces anything.
- Language: "reports", never "rats" as a count. Correlation is never presented as cause.
- Privacy by default: owner names, staff names and full addresses are never in the public API or visible on screen by default. They appear blurred, and are revealed only when the user clicks the eye icon (fetched on demand, logged).
- Accessible: keyboard operable, labelled controls, WCAG AA contrast, map has a list alternative.
- English UI and materials.

---

## R1 Live data platform

1. **P0** THE SYSTEM SHALL store all signals in a hosted Postgres/PostGIS database (Supabase) and serve the app from it live (no bundled snapshot on the main path). IF live 311 ingest is not finished by scope-freeze THEN THE SYSTEM MAY seed Supabase from the committed `data/civic/` CSVs as a documented demo fallback, and the live badge SHALL state the data is seeded, not live.
2. **P0** THE SYSTEM SHALL load 311 reports 2023–2026 for every category in `contracts/categories.json` (rodent, indoor pest, rat bite, dead animal, trash storage, trash out early, missed trash, illegal dumping, litter, dumpster, unsanitary conditions, vacant-lot trash, abandoned building, weeds, construction debris).
3. **P0** THE SYSTEM SHALL record a `sources` row for every dataset and an `ingest_runs` row for every load, with row count and newest record time.
4. **P0** WHEN the refresh endpoint runs (daily cron or the Refresh button) THE SYSTEM SHALL fetch 311 records newer than the latest stored record, plus records opened in the last 14 days (to catch closures), and upsert them.
5. **P1** IF a refresh was run less than 5 minutes ago WHEN the Refresh button is pressed THEN THE SYSTEM SHALL skip the fetch and show the last refresh time.
6. **P0** THE SYSTEM SHALL show "Live · updated <time ago>" from the latest successful ingest run.
7. **P1** THE SYSTEM SHALL load places: restaurants with rodent violations (food inspections), demolitions and excavations (building permits), Public Works work zones, Big Belly bins, city-owned lots, vacant parcels, public schools.
8. **P1** THE SYSTEM SHALL load parcels (FY2025 and FY2026 assessment) with year built, owner-occupied flag, units, land use and values — without owner names.
9. **P1** THE SYSTEM SHALL load daily weather (NOAA, Logan) and events: one-day alcohol and entertainment licenses, Red Sox home games, Sept 1 move-out, holiday pickup delays, heavy-rain/snow/heat days.
10. **P1** THE SYSTEM SHALL load context: census tracts with social vulnerability and asthma prevalence, Zillow ZIP home values/rents, Inside Airbnb listings with rat-mention review counts, iNaturalist rat observations.
11. **P0** THE SYSTEM SHALL strip house numbers into `address_block` (street + ZIP) and group repeat reports with a hashed `address_key`.
12. **P1** IF the database is unreachable THEN THE SYSTEM SHALL show a clear error state and not a blank map.
13. **P1** THE SYSTEM SHALL load Cambridge and Somerville rat data with a `city` on every row: Somerville 311 "Rats" and Rodent Assistance Program requests (placed at census-block centroids, flagged `geo_precision = block_centroid`), Cambridge rodent sightings (Commonwealth Connect, `uz4w-baz5`) and Cambridge smart rat boxes with monthly catches (`78bs-b5ig`).

## R2 Interactive map

1. **P0** WHEN the app opens THE SYSTEM SHALL show a full-screen map of Boston with rodent reports from the last 90 days and the ranked chronic sites.
2. **P0** THE SYSTEM SHALL cluster points at low zoom and show individual reports at high zoom, styled open / closed / "closed but came back".
3. **P0** THE SYSTEM SHALL offer layer toggles grouped as Rat signals, Food (trash drivers, restaurants), Shelter (vacant lots, abandoned buildings, weeds), Displacement (demolitions, digs, work zones), Protection (Big Belly), Events, Forecast, Context (vulnerability, asthma, listings).
4. **P0** WHEN the user pans or zooms THE SYSTEM SHALL refetch the visible area for the active layers and filters within 1 second (debounced).
5. **P0** THE SYSTEM SHALL filter by date range (30 days / 90 days / 1 year / all / custom) and status (open / closed / all).
6. **P0** WHEN the user clicks any feature THE SYSTEM SHALL select it and open its detail in the Inspect panel.
7. **P1** THE SYSTEM SHALL show a timeline under the map: weekly rodent reports in view with event marks (rain, games, move-out); dragging sets the date window; Play animates week by week.
8. **P1** THE SYSTEM SHALL show a heatmap mode for rodent reports.
9. **P1** WHEN the user draws an area (radius or polygon) THE SYSTEM SHALL show area statistics.
10. **P1** THE SYSTEM SHALL support search by street, neighborhood or ZIP and fly to the result.
11. **P0** THE SYSTEM SHALL provide a keyboard-reachable "features in view" list equivalent to the map.
12. **P0** THE SYSTEM SHALL show a legend for the active layers.

13. **P1** THE SYSTEM SHALL show Boston, Cambridge and Somerville on one map with a city filter, and SHALL mark block-centroid points as approximate.

## R3 Inspect anything

1. **P0** WHEN a report is selected THE SYSTEM SHALL show category, status, opened/closed dates, days to close, the closure note with its action tag, and other reports on the same block address.
2. **P0** WHEN a chronic site is selected THE SYSTEM SHALL show the site audit card:
   a. rank and score; b. timeline of reports with closure actions, marking reports that came back after a closure; c. drivers within 100 m (counts by type, clickable to highlight on the map); d. building facts and an adjacent-vacant-lot flag; e. probability of a new report within 60 days; f. what worked nearby; g. recommended actions with "because" evidence.
3. **P1** WHEN a place is selected (restaurant, demolition, lot, bin, school) THE SYSTEM SHALL show its record and rodent reports within 100 m in the 90 days before and after.
4. **P1** WHEN an event is selected THE SYSTEM SHALL show its record and trash/rodent reports nearby before and after.
5. **P1** WHEN a forecast cell is selected THE SYSTEM SHALL show expected reports for the week, the risk band, the top drivers and past actuals.
6. **P2** WHEN a tract or listing is selected THE SYSTEM SHALL show its context values with caveats.
7. **P0** WHEN nothing is selected THE SYSTEM SHALL show this week's top 10 chronic sites.
8. **P0** THE SYSTEM SHALL show the source for every fact in the panel.

9. **P1** WHEN a card shows an owner name, full address or raw closure note THE SYSTEM SHALL show it blurred with an eye icon; WHEN the user clicks the eye THE SYSTEM SHALL fetch the value from a non-public store via a server route, show it, and log the reveal (kind, id, time).
10. **P1** THE SYSTEM SHALL let the inspector see the owner's other parcels (portfolio) after a reveal, with reports per unit across them.

## R4 Human decision and work order

1. **P0** WHEN viewing a site's recommended actions THE SYSTEM SHALL let the inspector Approve, Edit or Reject each one.
2. **P0** WHEN an action is approved THE SYSTEM SHALL record the decision (site, action, owner agency, note, follow-up date = today + 60 days) and show a printable work order.
3. **P0** THE SYSTEM SHALL NOT send, submit or enforce anything; the work order says "Draft — for inspector use".
4. **P1** WHEN a site with a past decision is opened THE SYSTEM SHALL show the decision and whether new reports arrived since.

## R5 Findings (correlations)

1. **P0** THE SYSTEM SHALL show an Insights panel with findings, each with a plain headline, the question, method, statistic, a strength label (strong / moderate / weak / none), a small chart, a caveat and sources.
2. **P0** THE SYSTEM SHALL include at least: trash storage vs rodent reports; what worked (60-day repeat rate by city action); Sept 1 move-out spike.
3. **P1** THE SYSTEM SHALL also include: demolition displacement (300 m, ±90 days vs control), rain lag (0–7 days), trash-day effect, building age × owner occupancy, restaurant citations vs nearby reports, Big Belly association, events → trash → reports, under-reporting (iNaturalist vs 311 by vulnerability), asthma by tract, seasonality vs temperature.
4. **P0** THE SYSTEM SHALL control for reporting volume by using rates where possible and SHALL report weak or null results honestly.
5. **P1** WHEN a finding is clicked THE SYSTEM SHALL set the map layers that illustrate it.
6. **P1** THE SYSTEM SHALL compare the three cities: reports per 1,000 residents over time, and what each city does differently (Somerville's Rodent Assistance Program, Cambridge's smart boxes and their catch trends near sightings), with caveats that each city's reporting system differs.

## R6 Prediction

1. **P0** THE SYSTEM SHALL forecast rodent reports per ~250 m grid cell for each of the next 4 weeks and show it as a map layer with risk bands. A "mean of the last 4 weeks" baseline ships first as a fallback; the trained model replaces it.
2. **P0** THE SYSTEM SHALL backtest the forecast on the most recent 26 weeks against the baseline "mean of the last 4 weeks", and show both scores (MAE and share of reports captured by the top 10% of cells).
3. **P0** THE SYSTEM SHALL show the model's top features in plain language and the top drivers for each cell.
4. **P1** THE SYSTEM SHALL use next week's rain from the live NWS forecast as an input.
5. **P1** THE SYSTEM SHALL estimate, for each chronic site, the probability of a new report within 60 days after a closure.
6. **P0** THE SYSTEM SHALL label forecasts as "expected reports", not rats, and SHALL state next to the layer whether it is the baseline or the backtested model.

## R7 Price and cost impact

1. **P1** THE SYSTEM SHALL show assessed-value change FY2025→FY2026 near chronic sites against matched parcels (same ZIP, land use, year-built bucket), labelled exploratory.
2. **P1** THE SYSTEM SHALL show short-stay listing prices and rat-mention reviews near hot spots against elsewhere.
3. **P1** THE SYSTEM SHALL show the ZIP-level home value / rent relationship and state that it is weak and confounded.
4. **P0** THE SYSTEM SHALL show costs that can be counted: city pest-control payments (FY2026 ≈ $776K, BPS $611K), restaurant rodent citations, repeat inspections at chronic sites.
5. **P0** THE SYSTEM SHALL NOT claim that rats lower property values unless the data shows it, and SHALL show the caveat next to every price figure.

## R8 Assistant (agent chat)

1. **P0** THE SYSTEM SHALL provide an "Ask" chat panel that answers from the live data through tools, never from model memory alone.
2. **P0** WHEN the assistant talks about a place, site or area THE SYSTEM SHALL move the map there and highlight or select the features it refers to.
3. **P0** THE SYSTEM SHALL show the sources of every answer as clickable chips and referenced features as chips that select them on the map.
4. **P0** THE SYSTEM SHALL show the tool steps compactly while it works (e.g., "Looked up 16 reports on Normandy St").
5. **P0** THE SYSTEM SHALL send the current map selection and view with each message so "this site" and "here" work.
6. **P1** THE SYSTEM SHALL answer forecast, findings, what-worked, price-impact, compare-areas and events questions.
7. **P0** WHEN asked to act THE SYSTEM SHALL draft (never send) a work order and point the user to the Approve step.
8. **P0** THE SYSTEM SHALL refuse to reveal owner names or house numbers and SHALL say when the data cannot support an answer.
9. **P0** IF no model provider is configured THEN THE SYSTEM SHALL show "assistant not configured" and the rest of the app SHALL work.
10. **P1** THE SYSTEM SHALL offer starter questions.

## R9 Accessibility and quality

1. **P0** THE SYSTEM SHALL be operable by keyboard with visible focus, labelled controls and AA contrast.
2. **P0** THE SYSTEM SHALL announce selection changes and streamed chat output via `aria-live`.
3. **P1** THE SYSTEM SHALL render the first map view in under 3 seconds on a laptop and stay responsive with 20,000 points in view.
4. **P0** THE SYSTEM SHALL work at 1280×800 (the demo resolution) and remain usable on a phone (map + bottom sheet).

## R10 Deployment and evidence

1. **P0** THE SYSTEM SHALL be deployed publicly on Vercel with free, unrestricted access for judges.
2. **P0** THE SYSTEM SHALL keep secrets only in `.env.local` and Vercel env; the repository SHALL contain none.
3. **P0** THE README SHALL explain how to run the app, the pipeline and the tests from a fresh clone.
4. **P0** Tests: property-based tests (score bounded 0–100, ranking stable, every `source_id` resolves, no house number or owner name in any `public` schema column (they live only in `private`)), unit tests for the closure classifier and agent tools, one end-to-end happy path (open → select site → approve → work order).

## Out of scope

- Sending notices, fines or work orders to any city system.
- Estimating rat populations.
- Tenant data. Owner and staff names only behind the reveal (R3.9).
- Cities beyond Boston, Cambridge and Somerville.
