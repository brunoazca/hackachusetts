# Tasks — Rat Audit Boston

Derived from `design.md`. Each task names its requirements and its track
(owner paths in `docs/rat-audit/CONTRACT.md`). Do every P0 before any P1.
Keep `main` deployable; commit and push small.

Build order inside the priorities: (1) the Simple loop end to end — data → sites / returns SQL → queue → case →
approve → work order; (2) Prove — trial designer, practice card, findings; (3) Explore — layers with tested labels,
timeline, heatmap, full agent.

Checkpoints (Oct 24): **2:30** P0 data in DB + map shows it · **4:00** all P0 integrated
and deployed · **4:30** scope freeze · **5:30** release candidate · **6:00** video · **7:00** submitted.

## 0. Foundation (done)
- [x] 0.1 Supabase project `rat-audit` with PostGIS; core + analysis schema applied. (R1.1)
- [x] 0.2 Next.js 16 shell in `web/`: map / Inspect / Insights / Ask layout, shared map store, Supabase client. (R2.1) — superseded by 3.0 (Assess / Act modes).
- [x] 0.3 Shared category map `contracts/categories.json`; build contract. (R1.2)

## 1. Data track — `pipeline/rat_audit/ingest`, Modal worker, `/api/refresh` proxy
- [x] 1.0 **P0** Modal worker deployed (`pipeline/modal_app.py`): backfill fan-out, daily/weekly crons, `refresh` + `simulate` endpoints with bearer token; secret `rat-audit`. (R6.9)
- [ ] 1.1 **P0** db helper COPY + upsert (never overwrite action_tag); `sources` + `ingest_runs` writers exist in `rat_audit/db.py`. (R1.3)
- [ ] 1.2 **P0** 311 yearly 2023–2026 + new-system trash types → `incidents`; address_block/address_key; drop placeholder coords. Verify 2026 rodent ≈ 5,321 (already past 2025's 5,225) — use the 2026 figure in the demo; Normandy St 02121 grouped. (R1.2, R1.11)
- [ ] 1.3 **P0** Vercel `/api/refresh` proxy → Modal `refresh` (token server-side) + 5-minute guard. (R1.4–R1.6)
- [ ] 1.4 **P1** Parcels FY25/FY26 with coordinates; vacant parcels → places. (R1.8)
- [ ] 1.5 **P1** Food inspections rodent violations → places(restaurant). (R1.7)
- [ ] 1.6 **P1** Permits (demolition, excavation), code enforcement violations (`90ed3816…`), Big Belly, city lots, schools → places. (R1.7)
- [ ] 1.7 **P1** NOAA daily temperature → weather_daily; Sept 1 move-out → events. No rain/snow/licenses/games/holidays (null in data-audit.md). (R1.9)
- [ ] 1.8 **P1** Tracts (SVI + asthma as context), Zillow, Inside Airbnb listings, iNaturalist. (R1.10)
- [ ] 1.10 **P1** Regional: Somerville 311 rat types (block centroids), Cambridge rodent sightings + smart rat boxes; `city` on every row. (R1.13)
- [ ] 1.11 **P1** Load owner names, mailing and full addresses, raw closure notes into `private.*`; scrub names from public `closure_note`. (R3.12)
- [ ] 1.9 **P0** `pipeline/ingest/README.md` with run commands.

## 2. Analytics + prediction track — `pipeline/rat_audit/{analytics,model}` (run on Modal), Insights UI
- [ ] 2.1 **P0** grid_cells (250 m, clipped to Boston). (R6.1)
- [ ] 2.0 **P0** Migration for the v2 loop: `incidents.cause_tag`, `base_rates`, `decisions.reject_reason`, `trials`, `trial_pairs` (design §2). (R3.15, R4.1, R6.10, R11)
- [ ] 2.2 **P0** Closure classifier → action_tag: port `knowledge/sources/scripts/closure_classifier_rules.py` (tested 95.5% / 92.7% non-unknown on 2025 / 2026); `closed_no_action` tag is in categories.json; coverage report; unit tests ≥ 90%. Same pass writes `cause_tag` (keyword rules, optional cached LLM) with its coverage. (R3.1, R3.15, R10.4)
- [ ] 2.3 **P0** sites as 50 m clusters (`ST_ClusterDBSCAN`, bulk loads collapsed): counts, returns, ladder, closure speed vs citywide + same-day share, season-adjusted count, last 5 notes with both tags, drivers (incl. trash tickets 12 mo, schools), building, adjacent vacant (40 m), recommended by the 5 rules (R3.9) + legal-lane filter; re-check Normandy St under the cluster rule (v1: 16 reports in 2025, 18 with 2026 by address; adjacent "RES LAND (Unusable)" parcel); property tests. (R3.2, R3.9, R3.10, R10.4)
- [ ] 2.4 **P0** action_outcomes ("what worked") by site, with Wilson 95% interval, and by tag × year. (R3.2i, R5.2)
- [ ] 2.19 **P0** base_rates + Due flag; set the Due threshold from the table; `site_queue` RPC. (R6.10, R4.0)
- [ ] 2.20 **P0** `design_trial` (stratified matched pairs, seeded) + `trial_result`; property test: pairs match on keys, seed reproducible. (R11.1, R11.2, R10.4)
- [ ] 2.21 **P1** BRAP practice shift (`practice_shift` RPC): tag shares 2025 vs 2026, return rate by tag per year. (R5.7)
- [ ] 2.22 **P1** "Still unknown" checks per site (LLM, cached) + expected-vs-actual this month. (R3.11, R3.16)
- [ ] 2.23 **P1** Enforcement-gap list; follow-ups due (`followups_due` RPC). (R11.3, R4.6)
- [ ] 2.5 **P0** Correlations: trash-storage-vs-rodent, what-worked, move-out-spike. (R5.2, R5.4)
- [ ] 2.6 **P0** cell_week_poisson_gbm: features, 26-week backtest vs baseline, model_runs + predictions (backtest + next 4 weeks), per-cell drivers. Ship the "mean of last 4 weeks" baseline first as a fallback, then the model. (R6.1–R6.3, R6.6)
- [ ] 2.7 **P0** Counted costs in price_impact (Checkbook, citations, repeat visits). (R7.4)
- [ ] 2.8 **P0** InsightsPanel: forecast summary, finding cards with charts + caveats, price & cost. (R5.1, R6.2, R7)
- [ ] 2.9 **P1** Remaining findings from the tested results in `data-audit.md` / `knowledge/sources/rats/validation/*_results.txt` (demolition, rain, trash day, restaurants, Big Belly, events, under-reporting by tract, seasonality); recompute on the live DB only to refresh numbers. (R5.3)
- [ ] 2.10 **P1** Temperature climatology for future weeks (NWS rain dropped). (R6.4)
- [ ] 2.17 **P1** Equity view: rank within neighborhood + low-reporting tract flag in TopSites. (R3.14)
- [ ] 2.18 **P1** Schools-near-hot-spots impact card. (R7.6)
- [ ] 2.15 **P1** Emerging hotspots + early-warning cells (dead animal + indoor pest up, rodent ≤ 1) + agent/map support. (R6.7)
- [ ] 2.16 **P2** `simulate(conn, request)` in `rat_audit/model` + `/api/simulate` proxy + simulator UI in CellCard/SiteCard. (R6.8)
- [ ] 2.11 **P1** site_recurrence_logit → sites.summary.recur_p; must beat the base-rate baseline to be shown. (R6.5)
- [ ] 2.12 **P1** Price impact: assessed-value matched comparison, listings, Zillow. (R7.1–R7.3, R7.5)
- [ ] 2.14 **P1** Three-city comparison finding. (R5.6)
- [ ] 2.13 **P1** Finding click → map layers. (R5.5)

## 3. Map + inspector track — `web/src/components/{map,inspector,act}`, TopBar, `*_api_*.sql`
- [ ] 3.0 **P0** Two top-level modes Assess / Act in the TopBar + Simple / Explore depth toggle (Simple default); details in side panels or popovers; selection shared across modes. Layout, landing view and visual design: Gui's UI pass decides. (R0)
- [x] ~~3.18 **P1** Tested-result label on every driver layer toggle / legend, from `correlations`; "not tested" fallback. (R2.16)~~ Dropped Oct 24: hardcoded copies of the audit numbers, not the ML model; removed from the layer panel.
- [ ] 3.1 **P0** RPCs: map_incidents, map_sites, incident_detail, site_detail; typed wrappers in `web/src/lib/queries.ts`. (R2, R3)
- [ ] 3.2 **P0** MapView: basemap, clustered rodent layer (open/closed/recurred), sites layer, click→select, highlight, flyTo, bbox refetch. (R2.1, R2.2, R2.4, R2.6)
- [ ] 3.3 **P0** Layer control + legend + date/status filters; other incident categories. (R2.3, R2.5, R2.12)
- [ ] 3.4 **P0** IncidentCard, SiteCard (counts + Due, timeline with return marks, escalation ladder, closure speed, notes with tags, drivers, building, return probability vs base rate, what worked with caveat, recommended), TopSites empty state, SourceCite. (R3.1, R3.2, R3.7, R3.8)
- [ ] 3.5 **P0** ActionReview (approve/edit/reject with required reason → decisions) + WorkOrder print view with check-again date; past decision + returns since on the case. (R4.1–R4.4)
- [ ] 3.15 **P0** Act: SiteQueue (Due first, columns per R4.0, neighborhood filter); select → fly + highlight. (R4.0, R2.15)
- [ ] 3.16 **P0** TrialDesigner (N + intervention → pairs on map, CSV export, stated measure) + TrialResult. (R11.1, R11.2)
- [ ] 3.17 **P1** PracticeCard, FollowUps, enforcement-gap list, unknowns editor, reporting-normalized layer, season-adjusted queue column. (R5.7, R4.6, R11.3, R3.11, R2.14, R4.7)
- [ ] 3.6 **P0** TopBar: live badge + Refresh, search. (R1.6, R2.10)
- [x] 3.7 **P0** FeatureList keyboard alternative; a11y pass. (R2.11, R9.1, R9.2)
  <!-- FeatureList (map twin, `L` key, selection sync): web/src/components/map/FeatureList.tsx + featuresInView in map-store.ts, wired in MapView.tsx.
       Skip link + <main> landmark: web/src/app/page.tsx. In-app Reduce-motion toggle (+ `M` key, OS default): web/src/lib/a11y-store.ts, TopBar.tsx.
       Reference: docs/design/accessibility.md §"Shipped". -->
- [ ] 3.8 **P0** Forecast layer + CellCard. (R6.1, R3.5)
- [ ] 3.9 **P1** Places + events layers; PlaceCard, EventCard. (R2.3, R3.3, R3.4)
- [ ] 3.10 **P1** Timeline scrubber with event marks + play; heatmap. (R2.7, R2.8)
- [ ] 3.11 **P1** Area draw + area_stats. (R2.9)
- [ ] 3.13 **P1** City filter; approximate-location styling for block centroids; smart-box layer. (R2.13)
- [ ] 3.14 **P1** `/api/reveal` route + `Reveal` component (blurred + eye icon) on owner, address and raw note; owner portfolio after reveal. (R3.12, R3.13)
- [ ] 3.12 **P2** Tract choropleths, listings layer, mobile bottom sheet. (R3.6, R9.4)

## 4. Agent track — `/api/chat`, `components/chat`, `lib/agent`
- [ ] 4.1 **P0** Provider switch (`gateway|anthropic|bedrock`), "not configured" state. (R8.9)
- [ ] 4.2 **P0** Route with system prompt (incl. never recommend rodenticide); tools geocode, search_incidents, top_sites, due_sites, get_site, nearby_drivers, what_worked, draft_work_order. (R8.1, R8.7, R8.8)
- [ ] 4.3 **P0** Client map tools (fly_to, set_layers, set_filters, highlight, select, show_forecast, open_panel) + selection/bbox context; P1 `app_set_mode` (mode + depth). (R8.2, R8.5, R8.11)
- [ ] 4.4 **P0** ChatPanel: streaming, tool steps, source chips, feature chips, starters, a11y. (R8.3, R8.4, R8.10, R9.2)
- [ ] 4.5 **P1** Tools get_findings, forecast, price_impact, events_near, compare_areas, get_trial, base_rates, area_stats. (R8.6)
- [ ] 4.6 **P0** Tests: tools vs live DB; fake-model loop test. (R10.4)

## 5. Integration, quality, submission — integrator + Kiro
- [ ] 5.1 **P0** Merge tracks; resolve `package.json`; `pnpm build` green; push. 
- [ ] 5.2 **P0** Vercel project (root `web/`), env vars, cron, model provider; public URL. (R10.1, R10.2)
- [ ] 5.3 **P0** Re-run analytics on full data; verify demo path numbers against the Kiro Crew campaign results: what worked matched RR ≈ 1.03 (no difference; naive before/after 15.3% → 12.2% is confounded), return rate 8–12% with no prior reports vs 56–75% with 5+, forecast top-10% capture ≈ 0.229 baseline vs ≈ 0.257 with trash/dumping features, 46 chronic addresses with only 14 violations, trash storage block partial ρ ≈ +0.13, Normandy St counts under the 50 m site rule. Also settle: N and the overall 60-day return rate for the opening line; one cost figure ($776K vs $783K) with its date; the Due threshold. (R6, R5, R7.4)
- [ ] 5.4 **P0** Playwright E2E happy path (open → Act → Due site → case → approve → work order with check-again date; reject needs a reason) wired to the `demo-path-green` hook. (R10.4)
- [ ] 5.5 **P0** README run instructions; `docs/submission/description.md`, `kiro-usage.md`, `demo-script.md`. (R10.3)
- [ ] 5.6 **P0** Demo-to-requirement map (design §11) checked on the deployed URL.
- [ ] 5.7 **P0** Record video (2:40–2:55), upload public, submit on SundAI by 7:00.
