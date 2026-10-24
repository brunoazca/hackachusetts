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

Nobody can tell which response works. Monitoring is the most frequent closure action
(49% of 2025 rodent closures). A naive before/after looked like violations work and
monitoring does not, but a matched test (Kiro Crew campaign `4fb70394`, 19,496 cases
2023–2026, matched on prior reports, neighborhood and month) found **no difference**:
citation or abatement vs monitoring, Mantel-Haenszel risk ratio 1.03 (95% CI 0.89–1.20),
null in every year. What drives a return is the site's history: 8–12% of sites with no
prior reports come back within 60 days, 56–75% of sites with 5 or more. Repeat rates also
fall over time on their own (40% → 18% after a second monitoring visit, with no
enforcement), so a naive before/after makes any action look effective. BRAP has published
no measured result. Sources: `knowledge/15_boston_rat_audit.md`.

**Pitch:** Boston closes 99% of rat cases, but it can't tell which fixes last. Rat Audit
tracks every report, explains why a site keeps coming back, helps the inspector pick the
next step, predicts which sites are due to come back, and sets up the test that shows
what works.

## Users

- **Primary:** an ISD rodent inspector planning this week's visits.
- **Secondary:** the BRAP coordinator who looks across neighborhoods and agencies.
- **Tertiary (read-only):** residents and councillors who want to understand their block, and peer staff in Cambridge and Somerville (rats cross city lines).

## Goal

From "where are the rat problems and why do they keep coming back?" to "I approved
the next action for this site, with evidence, I know when to check again, and the
city can measure whether it worked" — on live data, in minutes.

The loop is Track → Analyze → Act → Predict → Prove. In the product it is two
top-level modes (R0): **Assess** (track, analyze, predict) and **Act** (decide,
follow up, prove).

## Definitions (one meaning each, used everywhere)

| Term | Meaning |
|---|---|
| **Site** | Cluster of rodent reports 2024–2026: DBSCAN in EPSG:26986, eps 50 m, min 3 reports, so the vacant lot or the house next door falls in the same site. Same-day bulk loads (≥ 5 reports, same `address_key`, same date) count as 1. |
| **Return** | A rodent report inside the site opened 1–60 days after an earlier report's `closed_at`. |
| **Window** | 60 days, everywhere: returns, what worked, follow-up date, trial measure. |
| **Action tag** | What the city recorded doing (closure classifier, design §4). Past actions only: "baiting" is a label, never a recommendation. |
| **Cause tag** | What the note names as the source: trash, sewer, dumpster, debris, vegetation, construction, none. |
| **Base return rate** | Citywide share of closures followed by a return, by the site's prior returns (0, 1, 2, 3+), with n and a 95% interval. |
| **Due** | Site whose last closure is inside the window and whose base return rate is ≥ the Due threshold (25% placeholder; set after `base_rates` runs). |
| **Closure speed** | Days from `opened_at` to `closed_at`. |

## Non-negotiables

- Every number and claim shown has an in-product citation (source name, URL, retrieved/updated time).
- A human approves every action. The app never sends, files or enforces anything.
- Language: "reports", never "rats" as a count. Correlation is never presented as cause.
- Privacy by default: owner names, staff names and full addresses are never in the public API or visible on screen by default. They appear blurred, and are revealed only when the user clicks the eye icon (fetched on demand, logged).
- Accessible: keyboard operable, labelled controls, WCAG AA contrast, map has a list alternative.
- English UI and materials.
- Counts first: the UI shows reports, closures and returns. No composite score is shown to users.
- Legal lane: recommendations are sanitation, exclusion, enforcement or referral. The system never recommends rodenticide or poison (MA rules, `knowledge/26_rodentops_expansion_round2.md` §B).
- Every citywide "what worked" number shows n, a 95% interval and a selection-bias caveat (the city does not assign actions at random).
- One cost figure with its date everywhere (resolve $776K in `data-audit.md` vs $783K in `pipeline/rat_audit/ingest/README.md` before the video).

---

## R0 App structure

1. **P0** THE SYSTEM SHALL have two top-level modes: **Assess** (map, sites, findings, forecast, assistant: where it is, why it keeps coming back, what comes next) and **Act** (site queue, case, decision, work order, follow-ups, trials: what to do and did it work).
2. **P0** Details (site case, report, place, cell, finding, work order, trial) SHALL open in side panels or popovers when the user interacts, not as more top-level tabs.
3. **P0** A site selected in one mode SHALL stay selected when the user switches modes.
4. The exact layout, panel placement and visual design are decided in the UI design pass (Gui) and are not fixed here. Requirements below say what must be reachable, not where it sits.
5. **P0** THE SYSTEM SHALL show all data by default (every layer on, rat and evidence heatmaps, icons from street zoom), with no separate depth modes. (Decided Oct 24 15:05: Simple/Explore removed.)

---

## R1 Live data platform

1. **P0** THE SYSTEM SHALL store all signals in a hosted Postgres/PostGIS database (Supabase) and serve the app from it live (no bundled snapshot on the main path). IF live 311 ingest is not finished by scope-freeze THEN THE SYSTEM MAY seed Supabase from the committed `data/civic/` CSVs as a documented demo fallback, and the live badge SHALL state the data is seeded, not live.
2. **P0** THE SYSTEM SHALL load 311 reports 2023–2026 for every category in `contracts/categories.json` (rodent, indoor pest, rat bite, dead animal, trash storage, trash out early, missed trash, illegal dumping, litter, dumpster, unsanitary conditions, vacant-lot trash, abandoned building, weeds, construction debris).
3. **P0** THE SYSTEM SHALL record a `sources` row for every dataset and an `ingest_runs` row for every load, with row count and newest record time.
4. **P0** WHEN the refresh endpoint runs (daily cron or the Refresh button) THE SYSTEM SHALL fetch 311 records newer than the latest stored record, plus records opened in the last 14 days (to catch closures), and upsert them.
5. **P1** IF a refresh was run less than 5 minutes ago WHEN the Refresh button is pressed THEN THE SYSTEM SHALL skip the fetch and show the last refresh time.
6. **P0** THE SYSTEM SHALL show "Live · updated <time ago>" from the latest successful ingest run.
7. **P1** THE SYSTEM SHALL load places: restaurants with rodent violations (food inspections), demolitions and excavations (building permits), Big Belly bins, city-owned lots, vacant parcels, public schools; and code enforcement violations (`90ed3816-5e70-443c-803d-9a71f44470be`: improper trash storage, overfilled barrels, dumping, weeds), the inspector-issued trash signal validated in `data-audit.md`.
8. **P1** THE SYSTEM SHALL load parcels (FY2025 and FY2026 assessment) with year built, owner-occupied flag, units, land use and values — without owner names.
9. **P1** THE SYSTEM SHALL load daily temperature (NOAA, Logan) for the seasonal signal (monthly r = +0.87) and the Sept 1 move-out event. Rain, snow, one-day licenses, Red Sox games and holiday delays SHALL NOT be loaded as drivers (no effect in `data-audit.md`).
10. **P1** THE SYSTEM SHALL load context: census tracts with social vulnerability (equity lens) and asthma prevalence (context only; it is negatively associated with reports, so no impact claim), Zillow ZIP home values/rents, Inside Airbnb listings with rat-mention review counts, iNaturalist rat observations.
11. **P0** THE SYSTEM SHALL strip house numbers into `address_block` (street + ZIP) and group repeat reports with a hashed `address_key`.
12. **P1** IF the database is unreachable THEN THE SYSTEM SHALL show a clear error state and not a blank map.
13. **P1** THE SYSTEM SHALL load Cambridge and Somerville rat data with a `city` on every row: Somerville 311 "Rats" and Rodent Assistance Program requests (placed at census-block centroids, flagged `geo_precision = block_centroid`), Cambridge rodent sightings (Commonwealth Connect, `uz4w-baz5`) and Cambridge smart rat boxes with monthly catches (`78bs-b5ig`).

## R2 Interactive map

1. **P0** WHEN the app opens THE SYSTEM SHALL show a full-screen map of Boston with rodent reports from the last 90 days and the ranked chronic sites.
2. **P0** THE SYSTEM SHALL cluster points at low zoom and show individual reports at high zoom, styled open / closed / "closed but came back".
3. **P0** THE SYSTEM SHALL offer layer toggles grouped as Rat signals, Food (trash drivers, restaurants), Shelter (vacant lots, abandoned buildings, weeds), Displacement (demolitions), Protection (Big Belly), Events (move-out), Forecast, Context (vulnerability, listings).
4. **P0** WHEN the user pans or zooms THE SYSTEM SHALL refetch the visible area for the active layers and filters within 1 second (debounced).
5. **P0** THE SYSTEM SHALL filter by date range (30 days / 90 days / 1 year / all / custom) and status (open / closed / all).
6. **P0** WHEN the user clicks any feature THE SYSTEM SHALL select it and open its detail (R0.2).
7. **P1** THE SYSTEM SHALL show a timeline under the map: weekly rodent reports in view with event marks (Sept 1 move-out) and a temperature line; dragging sets the date window; Play animates week by week.
8. **P1** THE SYSTEM SHALL show a heatmap mode for rodent reports.
9. **P1** WHEN the user draws an area (radius or polygon) THE SYSTEM SHALL show area statistics.
10. **P1** THE SYSTEM SHALL support search by street, neighborhood or ZIP and fly to the result.
11. **P0** THE SYSTEM SHALL provide a keyboard-reachable "features in view" list equivalent to the map.
12. **P0** THE SYSTEM SHALL show a legend for the active layers.

13. **P1** THE SYSTEM SHALL show Boston, Cambridge and Somerville on one map with a city filter, and SHALL mark block-centroid points as approximate.
14. **P1** THE SYSTEM SHALL offer a reporting-normalized layer: rodent reports per 100 total 311 reports per cell.
15. **P0** WHEN a site is selected (map, queue, search or assistant) THE SYSTEM SHALL fly the map to it and highlight its reports and nearby drivers.
16. **P1** THE SYSTEM SHALL show, for every driver layer, its tested result next to the toggle or in the legend: strength label and effect size with a link to the finding (e.g. "Demolitions: no effect, ×1.01"; "Trash storage: weak, ρ ≈ +0.13"), from `correlations` / `data-audit.md`. A layer without a test says "not tested".

## R3 Inspect anything

1. **P0** WHEN a report is selected THE SYSTEM SHALL show category, status, opened/closed dates, days to close, the closure note with its action tag, and other reports on the same block address.
2. **P0** WHEN a site is selected THE SYSTEM SHALL show the site case:
   a. counts: reports, closures, returns, days since last closure, Due flag with its base return rate;
   b. timeline of reports with closure actions, marking every closure followed by a return;
   c. escalation ladder: the ordered action tags at the site with the returns between them;
   d. median closure speed at the site next to the citywide median for the same action tag, and the share of cases closed the same day they opened, labelled "possible closure without a visit" (a signal, not proof);
   e. the last 5 closure notes (names scrubbed), each with action tag and cause tag;
   f. drivers within 100 m: counts by type, including trash tickets in the last 12 months and schools, clickable to highlight on the map;
   g. building facts and the adjacent-vacant flag (vacant parcel within 40 m);
   h. probability of a return within 60 days (R6.5) next to the base return rate;
   i. what worked nearby, with n, interval and the bias caveat;
   j. recommended actions with "because" evidence (R3.9).
3. **P1** WHEN a place is selected (restaurant, demolition, lot, bin, school) THE SYSTEM SHALL show its record and rodent reports within 100 m in the 90 days before and after.
4. **P1** WHEN an event is selected THE SYSTEM SHALL show its record and trash/rodent reports nearby before and after.
5. **P1** WHEN a forecast cell is selected THE SYSTEM SHALL show expected reports for the week, the risk band, the top drivers and past actuals.
6. **P2** WHEN a tract or listing is selected THE SYSTEM SHALL show its context values with caveats.
7. **P0** WHEN nothing is selected THE SYSTEM SHALL show this week's top 10 chronic sites.
8. **P0** THE SYSTEM SHALL show the source for every fact in the panel.
9. **P0** THE SYSTEM SHALL produce recommendations by these rules, first match wins, each with a "because" line and `source_ids`. Escalation is driven by the site's own history; the citywide "what worked" finding (R5.2) is shown as supporting context with its caveat.

   | # | When | Recommend | Because |
   |---|---|---|---|
   | 1 | Monitoring, noted or inspection recorded ≥ 2 times at this site, with a return after each | An option not yet tried here: citation or abatement order | "Tried N times here; reports returned each time" (citywide, matched test: no difference between enforcement and monitoring, RR 1.03; shown as "untested here, worth trying", not as proven) |
   | 2 | Vacant parcel within 40 m | Joint block visit; notice to the lot's owner or managing agency; clearing | Adjacency + parcel record |
   | 3 | Trash tickets or trash 311 are most of the nearby drivers | Container compliance visit; sealed containers | Tickets near site; NYC containerization (311 rat sightings down >20% year over year; −55% in the Hamilton Heights pilot) and Boston's $500,000 participatory-budgeting container project, cited as context |
   | 4 | Cause tag = sewer in any recent note | Referral to BWSC for a catch-basin check | Note text |
   | 5 | Otherwise | Inspect and record the cause | The open questions (R3.11) |

10. **P0** THE SYSTEM SHALL NOT emit any recommendation outside sanitation, exclusion, enforcement or referral, and SHALL NOT recommend rodenticide or poison.
11. **P1** THE SYSTEM SHALL list 2–3 "still unknown" checks for the site, drafted by AI from the notes and drivers, each editable and allowed to stay "unknown" (`knowledge/25_rodentops_government_and_public_voices.md` §5).

12. **P1** WHEN a card shows an owner name, full address or raw closure note THE SYSTEM SHALL show it blurred with an eye icon; WHEN the user clicks the eye THE SYSTEM SHALL fetch the value from a non-public store via a server route, show it, and log the reveal (kind, id, time).
13. **P1** THE SYSTEM SHALL let the inspector see the owner's other parcels (portfolio) after a reveal, with reports per unit across them.
14. **P1** THE SYSTEM SHALL offer an equity view of the site ranking (rank within each neighborhood) and flag low-reporting tracts, with the caveat that 311 counts are reports, not rats.
15. **P0** THE SYSTEM SHALL classify every rodent closure note with a cause tag (rules first, optional cached LLM pass for the rest) and report its coverage next to action-tag coverage.
16. **P1** THE SYSTEM SHALL show expected reports for the current month at the site (site's yearly mean × the month's seasonal factor) next to the actual count.

## R4 Human decision and work order (Act)

0. **P0** In Act THE SYSTEM SHALL show the site queue: Due sites first, then by returns in the last 12 months. Columns: reports, closures, returns, last action, days since last closure, Due. Filter by neighborhood.
1. **P0** WHEN viewing a site's recommended actions THE SYSTEM SHALL let the inspector Approve, Edit or Reject each one. Reject SHALL require a reason.
2. **P0** WHEN an action is approved THE SYSTEM SHALL record the decision (site, action, owner agency, note, follow-up date = today + 60 days) and show a printable work order.
3. **P0** THE SYSTEM SHALL NOT send, submit or enforce anything; the work order says "Draft — for inspector use".
4. **P0** WHEN a site with a past decision is opened THE SYSTEM SHALL show the decision and whether reports came back since.
5. **P1** THE SYSTEM SHALL show the address's trash pickup day on the work order.
6. **P1** THE SYSTEM SHALL list follow-ups due: approved decisions whose check-again date is within 7 days or past, with returns since the decision.
7. **P1** THE SYSTEM SHALL show season-adjusted reports in the queue (reports in the last 90 days ÷ expected for those months), so 5 reports in February rank above 5 in August.

## R5 Findings (correlations)

1. **P0** THE SYSTEM SHALL show an Insights panel with findings, each with a plain headline, the question, method, statistic, a strength label (strong / moderate / weak / none), a small chart, a caveat and sources.
2. **P0** THE SYSTEM SHALL include at least: trash storage vs rodent reports (311 and code enforcement); dead-animal and indoor-pest reports as leading signals; what worked (60-day repeat rate by city action); Sept 1 move-out (trash reports about 2× citywide and 4–5× in student ZIPs the week of Sept 1, 2023–2025: strong; rodent reports 1–4 weeks later: none); seasonality vs temperature. "What worked" SHALL show the matched comparison as its headline: no measurable difference between enforcement and monitoring once sites are matched on prior reports, neighborhood and month (RR 1.03, 95% CI 0.89–1.20). The naive before/after (15.3% → 12.2%) SHALL NOT be shown without that context. Trash storage SHALL carry its block-level strength (weak, partial ρ ≈ +0.13 after controlling for reporting volume); the ZIP-level +0.78 is a reporting artifact and SHALL NOT be shown. "What worked" SHALL show n, a 95% interval per action tag and the selection-bias caveat.
3. **P1** THE SYSTEM SHALL also include the tested results from `data-audit.md`, nulls included: demolitions (no spike; consistent with pre-demolition baiting), rain (none), trash day (none), restaurants and food licenses (none after controls), Big Belly (none), events and Red Sox games (none), building age × owner occupancy, and 311 under-reporting by tract (fewer reports per resident where more children, people of color and residents with disabilities live).
4. **P0** THE SYSTEM SHALL control for reporting volume by using rates where possible and SHALL report weak or null results honestly.
5. **P1** WHEN a finding is clicked THE SYSTEM SHALL set the map layers that illustrate it.
6. **P1** THE SYSTEM SHALL compare the three cities: reports per 1,000 residents over time, and what each city does differently (Somerville's Rodent Assistance Program, Cambridge's smart boxes and their catch trends near sightings), with caveats that each city's reporting system differs.
7. **P1** THE SYSTEM SHALL show a BRAP practice card: share of closures by action tag in 2025 vs 2026 (monitoring 49% → 27%, abatement and baiting up) and the return rate by tag per year, each with n and interval.

## R6 Prediction

1. **P0** THE SYSTEM SHALL forecast rodent reports per ~250 m grid cell for each of the next 4 weeks and show it as a map layer with risk bands. A "mean of the last 4 weeks" baseline ships first as a fallback; the trained model replaces it.
2. **P0** THE SYSTEM SHALL backtest the forecast on the most recent 26 weeks against the baseline "mean of the last 4 weeks", and show both scores (MAE and share of reports captured by the top 10% of cells). Expected (Kiro Crew campaign `072d5a66`, 1,140 cells): top-10% capture baseline 0.229, static chronic map 0.232, lags-only model 0.225, model with trash-storage and illegal-dumping co-reports **0.257**; MAE is worse for every model (0.0527 vs 0.0447) because the panel is near zero. Rank cells by capture, keep the trash and dumping features, and say that MAE does not improve.
3. **P0** THE SYSTEM SHALL show the model's top features in plain language and the top drivers for each cell.
4. **P1** THE SYSTEM SHALL use temperature climatology (week-of-year mean) for future weeks. Live rain forecasts SHALL NOT be used (rain showed no effect).
5. **P1** THE SYSTEM SHALL estimate, for each site, the probability of a return within 60 days after a closure, shown next to its base return rate.
6. **P0** THE SYSTEM SHALL label forecasts as "expected reports", not rats, and SHALL state next to the layer whether it is the baseline or the backtested model.

7. **P1** THE SYSTEM SHALL flag emerging hotspots: cells with high forecast risk but little recent history, with the leading signals that raised them; and early-warning cells: dead-animal and indoor-pest reports up over 12 weeks while rodent reports stayed ≤ 1.
8. **P2** WHEN the inspector picks interventions for a cell or site THE SYSTEM SHALL return the model's expected change in reports over 4 weeks, labelled as a model estimate.
9. **P0** THE SYSTEM SHALL run ingestion, analytics, training and scoring in a scheduled Python worker (Modal) that writes to the database, and SHALL re-score after every refresh.
10. **P0** THE SYSTEM SHALL compute base return rates (by prior-returns bucket, with n and 95% interval) and flag Due sites. They are the explainable baseline the recurrence model (R6.5) must beat, and they drive the queue order (R4.0).

## R7 Price and cost impact

1. **P1** THE SYSTEM SHALL show assessed-value change FY2025→FY2026 near chronic sites against matched parcels (same ZIP, land use, year-built bucket), labelled exploratory.
2. **P1** THE SYSTEM SHALL show short-stay listing prices and rat-mention reviews near hot spots against elsewhere.
3. **P1** THE SYSTEM SHALL show the ZIP-level home value / rent relationship and state that it is weak and confounded.
4. **P0** THE SYSTEM SHALL show costs that can be counted: city pest-control payments (one figure with its date: FY2026 ≈ $776K or $783K, to be resolved; BPS $611K), restaurant rodent citations (2025: 127 food businesses, 301 rodent/vermin violations, 37 at the most severe level), repeat inspections at chronic sites.
5. **P0** THE SYSTEM SHALL NOT claim that rats lower property values unless the data shows it, and SHALL show the caveat next to every price figure: no peer-reviewed study links rodents to home prices, and the "5–20% value loss" figures are industry marketing.
6. **P1** THE SYSTEM SHALL show schools near rodent hot spots (49% of schools are in or next to a top-10% cell vs 35% of lived-in cells) next to BPS pest-control spending ($611K, FY2026), and SHALL NOT claim asthma or fire impacts (not supported, see `data-audit.md`).
7. **P1** THE SYSTEM SHALL show the health context with its label: 18% of Boston brown rats sampled (59 of 328) carried *Leptospira*, and a Boston-area human case matched a local rat strain (Tufts, PLOS Neglected Tropical Diseases, 2025, peer-reviewed).

## R8 Assistant (agent chat)

1. **P0** THE SYSTEM SHALL provide an "Ask" assistant, reachable from both modes, that answers from the live data through tools, never from model memory alone.
2. **P0** WHEN the assistant talks about a place, site or area THE SYSTEM SHALL move the map there and highlight or select the features it refers to.
3. **P0** THE SYSTEM SHALL show the sources of every answer as clickable chips and referenced features as chips that select them on the map.
4. **P0** THE SYSTEM SHALL show the tool steps compactly while it works (e.g., "Looked up 16 reports on Normandy St").
5. **P0** THE SYSTEM SHALL send the current map selection and view with each message so "this site" and "here" work.
6. **P1** THE SYSTEM SHALL answer forecast, findings, what-worked, due-sites, base-rate, area, trials, price-impact, compare-areas and events questions.
7. **P0** WHEN asked to act THE SYSTEM SHALL draft (never send) a work order and point the user to the Approve step.
8. **P0** THE SYSTEM SHALL refuse to reveal owner names or house numbers and SHALL say when the data cannot support an answer.
9. **P0** IF no model provider is configured THEN THE SYSTEM SHALL show "assistant not configured" and the rest of the app SHALL work.
10. **P1** THE SYSTEM SHALL offer starter questions.
11. **P1** THE SYSTEM SHALL let the assistant switch mode (Assess / Act) and depth (Simple / Explore) when the answer needs it, e.g. turning on Explore to show a layer.

## R9 Accessibility and quality

1. **P0** THE SYSTEM SHALL be operable by keyboard with visible focus, labelled controls and AA contrast.
2. **P0** THE SYSTEM SHALL announce selection changes and streamed chat output via `aria-live`.
5. **P0** THE SYSTEM SHALL provide a keyboard "features in view" list that mirrors the map, syncs selection both ways, and is reachable by Tab and the `L` key (the map twin). *(see R2.11; `components/map/FeatureList.tsx`)*
6. **P0** THE SYSTEM SHALL expose a skip link to the map as the first focusable element and mark the map region as the `main` landmark. *(2.4.1; `app/page.tsx`)*
7. **P0** THE SYSTEM SHALL honor `prefers-reduced-motion` AND offer an in-app Reduce-motion toggle that stops all non-essential animation. *(2.2.2/2.3.3; `lib/a11y-store.ts`, `styles/piper.css`)*
8. **P0** Single-key shortcuts (`L`, `M`, `T`, `]`) SHALL NOT fire while the user is typing in a field. *(2.1.4)*
3. **P1** THE SYSTEM SHALL render the first map view in under 3 seconds on a laptop and stay responsive with 20,000 points in view.
4. **P0** THE SYSTEM SHALL work at 1280×800 (the demo resolution) and remain usable on a phone (map + bottom sheet).

> Full standard, component checklist and test routine: `docs/design/accessibility.md` (WCAG 2.2 AA). Its "Shipped" table maps each clause to its file.

## R10 Deployment and evidence

1. **P0** THE SYSTEM SHALL be deployed publicly on Vercel with free, unrestricted access for judges.
2. **P0** THE SYSTEM SHALL keep secrets only in `.env.local` and Vercel env; the repository SHALL contain none.
3. **P0** THE README SHALL explain how to run the app, the pipeline and the tests from a fresh clone.
4. **P0** Tests: property-based tests (returns ≤ reports − 1 per site, ranking stable, every `source_id` resolves, no house number or owner name in any `public` schema column (they live only in `private`), no recommendation text mentions rodenticide or poison, every trial pair matches on its match keys and the seeded assignment is reproducible), unit tests for the closure classifier (non-unknown ≥ 90% on 2025 and 2026 rodent notes; the rules in `knowledge/sources/scripts/closure_classifier_rules.py` measure 95.5% and 92.7%) and agent tools, one end-to-end happy path (open → Act → select a Due site → case → approve → work order with check-again date; Reject without a reason is blocked).

## R11 Prove (did it work)

1. **P0** THE SYSTEM SHALL provide a trial designer: the coordinator picks N and an intervention; the system SHALL pick N pairs of sites matched on neighborhood, prior-return bucket and trash-ticket tercile, assign treatment / comparison at random with a stored seed, show them on the map, export CSV, and state the measure: returns within 60 days, treatment vs comparison.
2. **P1** WHEN a trial is past its window THE SYSTEM SHALL show returns for treatment vs comparison with n and interval, labelled as the trial's result.
3. **P1** THE SYSTEM SHALL list enforcement gaps: Due sites with 0 trash tickets within 100 m in the last 12 months.

## Out of scope

- Sending notices, fines or work orders to any city system.
- Estimating rat populations.
- Tenant data. Owner and staff names only behind the reveal (R3.9).
- Cities beyond Boston, Cambridge and Somerville.
- Recommending rodenticide or any pesticide application.
- Running trials: the system designs and measures them; the city carries them out.
