# Rat Audit Boston — Spec v2 (evolution of v1)

Status: **proposal, Oct 24 ~2:00 PM.** Builds on `requirements.md`, `design.md`, `data-audit.md`,
`tasks.md` (v1). Nothing in v1 is deleted by this file. Each requirement below names the v1 id it
keeps, changes or replaces. Ids use `V<job>.<n>`. Priority: **P0** the core loop must work end to end,
**P1** should ship, **P2** stretch. The demo is planned after the build, not here. Do every P0 before any P1.

## 0. What changes from v1, in one table

| v1 | v2 |
|---|---|
| One map with Inspect / Insights / Ask tabs | One loop with five jobs: **Track → Analyze → Act → Predict → Prove**, on two screens |
| Map is the hero | The **site queue** is the landing view; the map is the evidence beside it |
| Site = hashed address | Site = **50 m cluster** of rodent reports (keeps the vacant lot next door in the same site) |
| Score 0–100 (weighted percentiles) | **Raw counts**: reports, closures, returns. Rank by returns |
| Recurrence windows of 30, 60 and 1–60 days | **60 days everywhere** |
| Escalation driven by citywide "what worked" | Escalation driven by **this site's own history**; citywide finding shown with a selection-bias caveat |
| GBM forecast + logit + simulator + hotspot model | **"Due to come back" list** (base rates) + **labelled baseline forecast** + two-signal early warning |
| What-if simulator | **Trial designer**: matched pairs so the city can measure what works |
| 13 finding cards, price impact, three-city chart | **4 finding cards** + BRAP practice-shift card; counted costs and schools as two lines |
| 12-tool agent (P0) | Full agent kept (core tools P0, rest P1), plus a trial tool |
| All layers on one map | **Two modes**: Simple (default loop) and **Explore** (every layer, filter, timeline, area stats, agent). Each layer shows its tested result |
| Action tag only | **Action tag + cause tag** per closure note |
| Decisions: approve/edit/reject | Same + **required reject reason** + **revisit check is P0** |

## 1. Pitch

> Boston closes 99% of rat cases, but it can't tell which fixes last. Rat Audit tracks every report,
> explains why a site keeps coming back, helps the inspector pick the next step, predicts which
> sites are due to come back, and sets up the test that shows what works.

## 2. Users and jobs

| User | Question | Jobs |
|---|---|---|
| ISD rodent inspector (primary) | Which sites do I revisit this week, and what do I do there? | Track, Analyze, Act, Predict |
| BRAP coordinator (secondary) | Where do we spend, and did it work? | Predict, Prove |
| Residents, councillors (read-only, not in demo) | What is happening on my block? | Track |

## 3. Screens

| Screen | Left | Center | Right |
|---|---|---|---|
| **Operations** (landing) | Site queue (Track + Predict) | Map: evidence layers (Track) | Case panel (Analyze + Act) |
| **Prove** | Trial designer | Map of chosen pairs | BRAP scorecard + 4 findings |

Top bar: name, live badge + Refresh, search, screen switch (Operations / Prove), **mode switch (Simple / Explore)**.

**Simple** (default): queue, case, approve. Only the layers the case needs.
**Explore**: all layer groups (Rat signals, Food, Shelter, Displacement, Protection, Events, Forecast,
Context), all filters, timeline with Play, heatmap, area draw + stats, and the Ask agent docked open.
Simple stays one click away; Explore never hides the queue.
The v1 shell (`SidePanel` tabs Inspect / Insights / Ask) maps to: Inspect → Case panel,
Insights → Prove screen, Ask → optional drawer (P2).

## 4. Definitions (one meaning each, used everywhere)

| Term | Meaning |
|---|---|
| **Site** | Cluster of rodent reports 2024–2026, DBSCAN in EPSG:26986, eps 50 m, min 3 reports. Same-day bulk loads (≥ 5 reports, same key, same date) count as 1 |
| **Return** | A rodent report inside the site opened 1–60 days after an earlier report's `closed_at` |
| **Window** | 60 days |
| **Action tag** | What the city recorded doing (classifier rules, v1 §4) |
| **Cause tag** | What the note names: trash, sewer, dumpster, debris, vegetation, construction, none |
| **Base return rate** | Citywide share of closures followed by a return, by the site's prior returns (0, 1, 2, 3+) |
| **Due** | Site whose last closure is inside the window and whose base return rate is ≥ 25% |
| **Closure speed** | Days from `opened_at` to `closed_at` |

## 5. Non-negotiables

Kept from v1: every fact cited in product; human approves every action; nothing is sent or enforced;
"reports", never "rats" as a count; correlation is never cause; privacy blur with logged reveal;
keyboard + WCAG AA + list alternative to map; English.

New:
1. Raw counts, never a composite score.
2. **Legal lane:** recommendations are sanitation, exclusion, enforcement or referral. The system
   SHALL NOT recommend rodenticide (MA rules, `knowledge/26_rodentops_expansion_round2.md` §B).
   "Baiting" is only a label for past actions.
3. **Selection-bias caveat** on every citywide "what worked" number, with n and a 95% interval.
4. One cost figure with its date. Decide $776K (data-audit) vs $783K (ingest README) before the video.

---

## V1 Track — where they are

1. **P0** THE SYSTEM SHALL load 311 rodent and trash categories 2023–2026 live into Supabase; IF live
   ingest is not finished by 2:30 PM THEN it SHALL seed from `data/civic/` and the badge SHALL say "seeded". *(v1 R1.1–R1.4)*
2. **P0** THE SYSTEM SHALL load code enforcement trash tickets, vacant parcels and public schools. *(v1 R1.7, reduced)*
3. **P0** THE SYSTEM SHALL write `sources` and `ingest_runs` and show "Live · updated <time ago>" with Refresh (5-minute guard). *(v1 R1.3–R1.6)*
4. **P0** THE SYSTEM SHALL show a map with rodent points (open / closed / came back), site markers, vacant parcels and schools, one date filter (30 d / 90 d / 1 y) and a legend. *(v1 R2.1–R2.6, R2.12, reduced)*
5. **P0** WHEN a site is selected in the queue THE SYSTEM SHALL fly the map to it and highlight its reports and nearby drivers. *(v1 R2.6)*
6. **P1** THE SYSTEM SHALL color cells by rodent reports per 100 total 311 reports (reporting-normalized) as an optional layer. *(new)*
7. **P1** THE SYSTEM SHALL load daily temperature (season) and Cambridge smart boxes. *(v1 R1.9, R1.13 reduced)*
8. **P1** In Explore mode THE SYSTEM SHALL offer every v1 layer: permits (demolition, excavation), restaurants, Big Belly, city lots, events (move-out, Red Sox), Zillow, Airbnb listings, iNaturalist, tracts (SVI, asthma), Cambridge and Somerville. *(v1 R1.7–R1.10, R1.13, R2.3)*
9. **P1** Each layer SHALL show its tested result from `data-audit.md` in the legend and on hover: strength label and statistic (e.g., "Demolitions: tested, no effect, ×1.01"), so a layer is never read as a cause. *(new)*
10. **P1** In Explore mode THE SYSTEM SHALL offer timeline with Play, heatmap, area draw with stats, and city filter. *(v1 R2.7–R2.9, R2.13)*

## V2 Analyze — why it keeps coming back

1. **P0** WHEN a site is selected THE SYSTEM SHALL show its timeline: each report, its closure action, and a mark on every closure followed by a return. *(v1 R3.2b)*
2. **P0** THE SYSTEM SHALL show the escalation ladder: the ordered list of action tags at the site, with returns between them. *(new)*
3. **P0** THE SYSTEM SHALL show median closure speed at the site next to the citywide median for the same action tag. *(new)*
4. **P0** THE SYSTEM SHALL show the last 5 closure notes (names scrubbed), each with action tag and cause tag. *(v1 R3.1, extended)*
5. **P0** THE SYSTEM SHALL show within 100 m: vacant parcels (and whether one is within 40 m), trash tickets in the last 12 months, schools. *(v1 R3.2c–d, reduced)*
6. **P0** THE SYSTEM SHALL show the source for every fact. *(v1 R3.8)*
7. **P1** THE SYSTEM SHALL show expected reports for the current month (site's yearly mean × month's seasonal factor) next to the actual count. *(new)*
8. **P1** THE SYSTEM SHALL list 2–3 "still unknown" checks for the site, drafted by AI from the notes and drivers, each editable and allowed to be "unknown". *(new, `knowledge/25` §5)*
9. **P1** THE SYSTEM SHALL classify every rodent closure note with a cause tag; coverage reported alongside action-tag coverage. *(new, extends v1 task 2.2)*

## V3 Act — what to do

1. **P0** THE SYSTEM SHALL produce recommendations by the rules in §6, each with a "because" line and sources. *(v1 R3.9–R3.11, changed)*
2. **P0** THE SYSTEM SHALL let the inspector Approve, Edit or Reject each recommendation; Reject SHALL require a reason. *(v1 R4.1, extended)*
3. **P0** WHEN an action is approved THE SYSTEM SHALL record the decision and show a printable work order marked "Draft — for inspector use" with a check-again date = today + 60 days. *(v1 R4.2–R4.3)*
4. **P0** WHEN a site with a past decision is opened THE SYSTEM SHALL show the decision and whether reports came back since. *(v1 R4.4, promoted to P0)*
5. **P1** THE SYSTEM SHALL show the address's trash pickup day on the work order. *(new)*

## V4 Predict — what comes next

1. **P0** THE SYSTEM SHALL compute base return rates and flag Due sites; the queue SHALL sort Due sites first, then by returns in the last 12 months. *(replaces v1 R6.5)*
2. **P0** Queue columns: reports, closures, returns, last action, days since last closure, Due. *(replaces v1 R3.7)*
3. **P1** THE SYSTEM SHALL show a forecast layer per 250 m cell for next week, labelled "baseline: last 4 weeks × season", with its 26-week backtest MAE. *(v1 R6.1–R6.2, baseline only)*
4. **P1** THE SYSTEM SHALL flag early-warning cells: dead-animal and indoor-pest reports up over 12 weeks while rodent reports stayed ≤ 1. *(replaces v1 R6.7)*
5. **P1** THE SYSTEM SHALL offer an equity view: queue ranked within each neighborhood. *(v1 R3.14)*
6. **Cut:** GBM model, logit, simulator. *(v1 R6.3, R6.5, R6.8; R6.9 keeps Modal for ingest and baseline)*

## V5 Prove — did it work

1. **P1** THE SYSTEM SHALL provide a trial designer: the coordinator picks N and an intervention; the system SHALL pick N pairs of sites matched on neighborhood, prior-return bucket and trash-ticket tercile, assign treatment/comparison at random (seeded), show them on the map and export CSV, and state the measure: returns within 60 days, treatment vs comparison. *(new)*
2. **P1** THE SYSTEM SHALL show a BRAP practice card: share of closures by action tag in 2025 vs 2026, and return rate by tag per year, each with n and interval. *(new)*
3. **P1** THE SYSTEM SHALL show 4 finding cards from static JSON seeded from `data-audit.md`: what worked (with selection-bias caveat), trash storage at block level (weak), season (r = 0.87), 311 under-reporting by tract. *(v1 R5.1–R5.4, reduced)*
4. **P1** THE SYSTEM SHALL show two cost lines: city pest-control payments and schools near hot spots (49% vs 35%). *(v1 R7.4, R7.6)*
5. **P2** Enforcement-gap list: Due sites with 0 trash tickets within 100 m in 12 months. *(new)*
6. **Cut:** price impact, listings, Zillow, three-city chart. *(v1 R7.1–R7.3, R7.5, R5.6)*

## V6 Assistant

1. **P0** Ask panel with core tools: `top_sites` (queue), `get_site`, `nearby_drivers`, `draft_work_order`, plus client tools `map_fly_to`, `map_select`, `map_highlight`, `map_set_layers`. Same rules as v1 R8: answers only from tools, cites sources, no names or house numbers, drafts never sends, "not configured" state. *(v1 R8.1–R8.5, R8.7–R8.9)*
2. **P1** Full tool set for power users: `geocode`, `search_incidents`, `what_worked`, `get_findings`, `forecast`, `base_rates`, `events_near`, `compare_areas`, `price_impact`, `design_trial`, `practice_shift`, `area_stats`, and `map_set_filters`, `map_show_forecast`, `open_panel`. *(v1 R8.6, extended)*
3. **P1** The agent SHALL be able to switch the app to Explore mode and set layers to illustrate its answer. *(new)*
4. **P1** Starter questions split by mode: simple ("Which sites should I revisit this week?") and deep ("Compare returns after citations vs monitoring in Dorchester since 2025"). *(v1 R8.10)*
5. The agent SHALL apply the legal lane and the tested-result labels (§5, V1.9). *(new)*

## V7 Quality

1. **P0** Deployed on Vercel; free judge access; secrets only in env. *(v1 R10.1–R10.2)*
2. **P0** README run instructions. *(v1 R10.3)*
3. **P0** Tests:
   - property: no house number or owner name in any public column;
   - property: returns ≤ reports − 1 per site; every `source_id` resolves; ranking stable;
   - property: no recommendation text mentions rodenticide or poison;
   - unit: classifier non-unknown ≥ 90% (2025 and 2026);
   - E2E: open → queue → select Due site → case → approve → work order with check-again date. *(v1 R10.4, changed)*
4. **P0** Keyboard operable, `aria-live` on selection, AA contrast, 1280×800. *(v1 R9.1–R9.4; mobile sheet cut)*

---

## 6. Recommendation rules (first match wins)

| # | When | Recommend | Because |
|---|---|---|---|
| 1 | Monitoring, noted or inspection recorded ≥ 2 times at this site, with a return after each | An option not yet tried here: citation or abatement order | "Tried N times here; reports returned each time" |
| 2 | Vacant parcel within 40 m | Joint block visit; notice to the lot's owner or managing agency | Adjacency + parcel record |
| 3 | Trash tickets or trash 311 are most nearby drivers | Container compliance visit; sealed containers | Tickets near site; NYC containerization (cited as context) |
| 4 | Cause tag = sewer in any recent note | Referral to BWSC for catch-basin check | Note text |
| 5 | Otherwise | Inspect and record the cause | Show the unknowns (V2.8) |

Never emitted: rodenticide, poison, or any action outside sanitation, exclusion, enforcement, referral.

## 7. Data model changes (on top of v1 migrations)

| Change | Purpose |
|---|---|
| `incidents.cause_tag text` | V2.4, V2.9 |
| `sites` rebuilt from 50 m clusters; `summary` holds counts, ladder, closure speed, drivers, `due`, `base_rate` | V2, V4 |
| `base_rates(prior_returns_bucket, n, returns, rate, ci_low, ci_high)` | V4.1 |
| `decisions.reject_reason text` | V3.2 |
| `trials(id, created_at, intervention, n, seed, measure)` and `trial_pairs(trial_id, treatment_site, comparison_site, match_keys jsonb)` | V5.1 |
| Keep `predictions` / `model_runs` for the baseline only | V4.3 |
| Keep `places`, `events`, `listings`, `zip_prices`, `tracts` for Explore layers | V1.8 |
| `layer_findings(layer_key, strength, statistic, caveat, source_ids)` seeded from `data-audit.md` | V1.9 |

## 8. API (Postgres RPCs, read-only unless noted)

| RPC | Returns | Job |
|---|---|---|
| `site_queue(limit, neighborhood)` | sites with counts, due, last action, days since close | Predict |
| `site_detail(id)` | timeline, ladder, notes + tags, drivers, speed, decisions, sources | Analyze, Act |
| `map_incidents`, `map_sites`, `map_places(kinds)` (v1, kinds reduced) | GeoJSON | Track |
| `map_forecast(bbox, week)` | baseline cells + backtest MAE | Predict |
| `base_rates()` | table | Predict |
| `design_trial(n, intervention, seed)` (insert) | pairs | Prove |
| `practice_shift()` | tag shares and return rates by year | Prove |

## 9. Build order from 2:00 PM

| By | Done | Track |
|---|---|---|
| 2:30 | 311 in DB (live or seeded); classifier writes action + cause tags | data, analytics |
| 3:15 | Sites (50 m), returns, base rates, `site_queue`, `site_detail` | analytics |
| 3:15 | Queue + map + case panel render on seeded data | web |
| 4:00 | Act flow + work order; deployed | web |
| 4:30 | **Freeze.** P0 tests green | all |
| 4:30–5:30 | Trial designer, practice card, 4 findings, baseline forecast — only if P0 green | analytics, web |
| 5:30 | Release candidate; README; numbers verified | integrator |

## 10. Numbers to verify once the data is loaded

- Overall 60-day return rate.
- Normandy St counts under the 50 m site rule (v1 said 16 / 18 by address).
- Cost figure: $776K or $783K.
- Base-rate threshold for Due (25% is a placeholder; set after `base_rates` runs).
