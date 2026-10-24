# Kiro Work Log

This file is the record of what we did with Kiro.
Every chat and every agent adds a line here.
At the end, we read this file to write the Kiro usage story.

## Rules
- Add the newest entry at the TOP of the log below.
- Never delete old entries. Only add.
- One entry per real piece of work — code, a decision, OR a pure-talk idea.
- Ideas count: a brainstorm with no file change still gets an entry. Put the
  thought in `Did:` and `Idea:`, set `Where: none`.
- Skip only true no-ops (pure reading, a yes/no with no thinking).
- Keep each line short and true.

## Entry format
```
### YYYY-MM-DD HH:MM — <short title>
- Teammate: <name of the person who asked for this>
- Agent: <which Kiro agent did it>
- Did: <what changed or was decided>
- Why: <reason, one line>
- Where: <files touched, or "none">
- Idea: <any idea raised, or "none">
```

We are a team. Always name the teammate who drove the work AND the agent.
If the agent does not know the teammate's name, it asks before logging.

---

## Log

### 2026-10-24 14:02 — Auto-sync: .kiro/scripts/autopush.sh commits and pushes e...
- Teammate: Bruno
- Agent: —
- Did: Auto-sync: .kiro/scripts/autopush.sh commits and pushes every change to origin/main every 3 min (secret scan still gates; conflicts abort, never force)
- Why: Bruno asked to guarantee things are pushed constantly
- Where: .kiro/scripts/autopush.sh
- Idea: Run it in any session: INTERVAL=180 .kiro/scripts/autopush.sh

### 2026-10-24 13:59 — Draft UI: live MapLibre map of all incident categories (c...
- Teammate: Bruno
- Agent: —
- Did: Draft UI: live MapLibre map of all incident categories (clustered, colored, open vs closed), layer + period panel, click-to-inspect card (dates, scrubbed city note, same-address history, source + Live/Daily/Static), live badge + Refresh
- Why: Bruno wanted to see the data on a map now; map track (Gui) can build on it
- Where: web/src/components/{map,inspector,shell/TopBar}, web/src/lib/queries.ts, supabase/migrations/20261024300001_api_map_draft.sql, web/package.json
- Idea: MapLibre 6 worker must be served from /public under Next 16 (postinstall copies it)

### 2026-10-24 13:44 — Added Supabase MCP (local scope, project rat-audit) and l...
- Teammate: Bruno
- Agent: —
- Did: Added Supabase MCP (local scope, project rat-audit) and linked Supabase CLI to the rat-audit project
- Why: Let agents query schema/data and run migrations against rat-audit directly
- Where: ~/.claude.json (local scope), supabase/.temp
- Idea: —

### 2026-10-24 13:42 — Audited Supabase usage (410 MB: incidents 210, private de...
- Teammate: Bruno
- Agent: —
- Did: Audited Supabase usage (410 MB: incidents 210, private details 43, parcels+owners 77, volume tables 51) and account setup
- Why: Decide whether to move Supabase/Vercel to personal Free account; kept rat-audit on bone@blackbone.ai since Free caps at 500 MB and no data will be cut
- Where: supabase (rat-audit)
- Idea: Boston 2026 has ~2x incidents (ce_* 36k only in 2026, litter 12k) — possible date bug in enforcement loader

### 2026-10-24 13:36 — Marked every source live/daily/static: update_modes.py re...
- Teammate: Bruno
- Agent: —
- Did: Marked every source live/daily/static: update_modes.py registry → sources.update_mode/update_note (7 live, 3 daily, 20 static); README table
- Why: Bruno asked to mark which data gets live updates
- Where: pipeline/rat_audit/ingest/update_modes.py, pipeline/rat_audit/db.py, pipeline/rat_audit/jobs.py, pipeline/README.md, supabase/migrations/20261024100004_data_update_mode.sql, docs/rat-audit/CONTRACT.md
- Idea: UI can badge each layer Live / Daily / Static from sources.update_mode

### 2026-10-24 13:36 — Shrank parcels: dropped 8,545 condo-parking parcels, null...
- Teammate: Bruno
- Agent: —
- Did: Shrank parcels: dropped 8,545 condo-parking parcels, nulled mail_address, VACUUM FULL (parcels 101→51 MB, owners 35→26 MB)
- Why: Supabase free-tier 500 MB cap had made the DB read-only
- Where: pipeline/rat_audit/ingest/parcels.py, ingest/README.md
- Idea: —

### 2026-10-24 13:35 — Filled the blank _TBD_ Commands section in steering/tech....
- Teammate: Guilherme
- Agent: kirocrew
- Did: Filled the blank _TBD_ Commands section in steering/tech.md with the real pnpm (web/) and uv (pipeline/) commands from web/package.json; audited all .kiro config against the merged rat-audit tree - no stale rodent-ops/civic-service/src-only refs remain
- Why: The demo-path hook and agents rely on tech.md for build/test commands; they were all _TBD_
- Where: .kiro/steering/tech.md
- Idea: Left partner's in-flight uncommitted knowledge/design changes untouched - not mine to commit

### 2026-10-24 13:34 — All loaders done: parcels 184,552 (100% coords via Parcel...
- Teammate: Bruno
- Agent: —
- Did: All loaders done: parcels 184,552 (100% coords via Parcels25), 1,157 restaurants, 1,460 permits, Big Belly 542, city lots 1,340, schools 134, colleges 60; listings slimmed to 518 (all rat-review listings + 10% sample); tracts simplified
- Why: Data section complete except full enforcement aggregate
- Where: pipeline/rat_audit/ingest/*.py, contracts/categories.json
- Idea: listings is a sample: weight non-rat rows x10 for rates

### 2026-10-24 13:32 — Fixed submission-readiness checker to detect the real app...
- Teammate: Guilherme
- Agent: kirocrew
- Did: Fixed submission-readiness checker to detect the real app (web/ + pipeline/) instead of src/; now reports 5/7 green with the two blank submission docs as the only gaps
- Why: The readiness cron would have reported 'no working project' forever since the app is in web/, not src/
- Where: .kiro/scripts/check_submission_ready.py
- Idea: The checker is now an honest 8PM safety net: it goes green only when description.md and kiro-usage.md lose their placeholders

### 2026-10-24 13:27 — Realigned all Kiro automation to the real rat-audit tree:...
- Teammate: Guilherme
- Agent: kirocrew
- Did: Realigned all Kiro automation to the real rat-audit tree: added web/src + pipeline + supabase to 6 hook path-globs (were src/** only, would never fire on the Next.js app in web/); repointed rodent-honesty + no-auto-action agents from spec rodent-ops to rat-audit; overclaim scanner now defaults to web/src
- Why: The guards and hooks were stale after the team renamed the spec and put the app in web/ - they would have silently never triggered
- Where: .kiro/hooks/{accessibility-check,demo-path-green,log-all-work,overclaim-guard,secret-scan,sync-audit-log}.kiro.hook, .kiro/agents/{rodent-honesty,no-auto-action}.json, .kiro/scripts/check_overclaims.py
- Idea: Dead automation is worse than none - a judge sees hooks that never ran; aligning paths makes every guard actually fire on the live app

### 2026-10-24 13:33 — Fixed truncated 311 volume (CKAN caps SQL at 32k rows): c...
- Teammate: Bruno
- Agent: —
- Did: Fixed truncated 311 volume (CKAN caps SQL at 32k rows): ckan_sql_all pages aggregates; report_volume now ~300k reports/year; enforcement hybrid (signal_volume 2023+ + 6 months of rows); VACUUM back to 408 MB
- Why: report_volume feeds the model's who-reports control; every year was capped at exactly 32,000 bins
- Where: pipeline/rat_audit/ingest/{common,t311,enforcement}.py
- Idea: Supabase free tier near cap: upgrade to Pro before demo

### 2026-10-24 13:33 — Parcels/food/permits/places_misc loaders written and load...
- Teammate: Bruno
- Agent: —
- Did: Parcels/food/permits/places_misc loaders written and loaded: 184,552 parcels with 100% coordinates (Parcels25 polygon centroids), 6,046 vacant parcels, 1,157 restaurants with rodent violations, 1,460 demolition/excavation permits, Big Belly bins, city lots, schools, colleges
- Why: Context layers for the map and the model; owners kept private
- Where: pipeline/rat_audit/ingest/{parcels,food,permits,places_misc}.py, ingest/README.md, contracts + web categories.json (college)
- Idea: Supabase is near its 500 MB cap (494 MB); VACUUM FULL parcels (~50 MB of dead tuples) once there's headroom

### 2026-10-24 13:30 — Context data loaded: 238 tracts (Boston SVI + Cambridge/S...
- Teammate: Bruno
- Agent: —
- Did: Context data loaded: 238 tracts (Boston SVI + Cambridge/Somerville 2020) with asthma, Zillow 4,131 ZIP-months, 3,579 Airbnb listings (200 rat reviews), 535 iNaturalist rats, city pest spending FY23–26; regional Cambridge 1,872 + Somerville 2,586 rodent + 3,246 program requests
- Why: Data section: R1.10, R1.13, R7.4
- Where: pipeline/rat_audit/ingest/context.py, supabase/migrations/20261024100002_data_spending.sql, contracts/categories.json
- Idea: FY2024 spending table only has July 2023 — show as missing, not a drop

### 2026-10-24 13:27 — Live refresh path working: Vercel /api/refresh (status + ...
- Teammate: Bruno
- Agent: —
- Did: Live refresh path working: Vercel /api/refresh (status + 5-min guard) → Modal refresh; 14-day Boston 311 refresh runs in 12 s on Modal
- Why: Data section: R1.4–R1.6 live data
- Where: web/src/app/api/refresh/route.ts, pipeline/modal_app.py, pipeline/rat_audit/jobs.py
- Idea: Per-source error isolation so one broken loader never blocks the refresh

### 2026-10-24 13:27 — Added 250m grid-cell fallback helper (rat_audit/model/gri...
- Teammate: Bruno
- Agent: --
- Did: Added 250m grid-cell fallback helper (rat_audit/model/grid.py)
- Why: model needs cells even if grid_cells is empty; must not overwrite Carol table
- Where: pipeline/rat_audit/model/grid.py
- Idea: load_or_build_cells reads grid_cells first, builds in-memory fallback clipped to Boston footprint

### 2026-10-24 13:26 — Added model_artifacts table (migration 20261024500001) an...
- Teammate: Bruno
- Agent: --
- Did: Added model_artifacts table (migration 20261024500001) and applied to Supabase
- Why: Modal has no shared disk; trained models must persist in DB to reload for scoring
- Where: supabase/migrations/20261024500001_model_artifacts.sql
- Idea: pickle/joblib model blob stored per model_run_id

### 2026-10-24 13:25 — Boston 311 backfill in Supabase (221,745 rows 2023–2026; ...
- Teammate: Bruno
- Agent: —
- Did: Boston 311 backfill in Supabase (221,745 rows 2023–2026; rodent 2025=5,225, 2026=5,321 match research); hardened note scrubbing (emails, phones, staff names, house numbers); upserts skip unchanged rows
- Why: Data section: everything downstream waits on 311; privacy leaks found in sample notes; Supabase free tier went read-only at 465 MB from reload bloat
- Where: pipeline/rat_audit/ingest/common.py
- Idea: VACUUM FULL brought DB 465→300 MB; free tier is tight — consider Supabase Pro

### 2026-10-24 13:20 — Pushed pending spec edits (closure classifier rules, esca...
- Teammate: Bruno
- Agent: —
- Did: Pushed pending spec edits (closure classifier rules, escalation/adjacent-lot/container recommendations, move-out trash spike, health context) and fixed duplicate R3.9–R3.11 numbering (privacy reveal, portfolio, equity view → R3.12–R3.14)
- Why: Two spec passes had reused the same requirement numbers
- Where: .kiro/specs/rat-audit/*, contracts/categories.json, web/src/lib/categories.json, knowledge/sources/scripts/closure_classifier_rules.py
- Idea: —

### 2026-10-24 13:19 — Applied research to the rat-audit spec: what-worked as le...
- Teammate: Bruno
- Agent: —
- Did: Applied research to the rat-audit spec: what-worked as lead finding, trash finding labelled weak at block level, escalation / adjacent-lot / container recommendation rules (R3.9-R3.11), cost + health facts (R7), classifier rules file + closed_no_action tag + 90% test target, Sept 1 = trash spike not rodent spike; 6 Kiro Crew campaigns all in the knowledge library
- Why: Research changed several P0 items
- Where: .kiro/specs/rat-audit/{requirements,design,tasks}.md, contracts/categories.json, web/src/lib/categories.json, knowledge/sources/scripts/closure_classifier_rules.py, knowledge/15_boston_rat_audit.md, .kiro/campaigns/rat-audit-research-campaigns.md
- Idea: Classifier: monitoring 49% of 2025 closures -> 27% in 2026 as abatement/baiting rose; Sept 1 trash 2x citywide, 4-5x student ZIPs, rodent lag none

### 2026-10-24 13:17 — Data section: ingest helpers + Boston 311 loader (2023–20...
- Teammate: Bruno
- Agent: —
- Did: Data section: ingest helpers + Boston 311 loader (2023–2026 + new system, private details, report_volume); model-section prompt
- Why: Bruno split work: this section retrieves data + live fetchers; another section builds the model
- Where: pipeline/rat_audit/ingest/{common,t311}.py, supabase/migrations/20261024100001_data_report_volume.sql, contracts/categories.json, docs/rat-audit/prompts/model-section.md
- Idea: report_volume per ~100 m bin/month as the who-reports control

### 2026-10-24 13:16 — Merged concurrent team research and preserved completed r...
- Teammate: Guilherme
- Agent: Codex (research integration; not Kiro build activity)
- Did: Merged concurrent team research and preserved completed rat-audit spec
- Why: Publish the evidence expansion without losing upstream work or overstating observational results
- Where: knowledge/15_*, knowledge/19_rat_data_validation.md, knowledge/24_*, knowledge/README.md, README.md, data/civic/CATALOG.md, .kiro/specs/
- Idea: Keep campaign numbers with provenance; distinguish associations, temporal overlap and actual forecast validation; use the completed rat-audit spec

### 2026-10-24 13:16 — Applied the data tests to the rat-audit spec (requirement...
- Teammate: Bruno
- Agent: —
- Did: Applied the data tests to the rat-audit spec (requirements R1.7/R1.9/R1.10/R2.3/R2.7/R3.11/R5.2/R5.3/R6.4/R7.6, tasks 1.6–1.8, 2.9, 2.10, 2.17, 2.18); full test record saved as data-audit.md; research narrative in docs
- Why: Spec still listed drivers the tests ruled out (rain, NWS, work zones, games, asthma)
- Where: .kiro/specs/rat-audit/{data-audit,requirements,tasks,design}.md, docs/rat-audit/data-research.md
- Idea: Spec now matches evidence: trash + housing + season; honest nulls; equity view

### 2026-10-24 13:13 — Modal worker deployed (rat-audit on harvard workspace): b...
- Teammate: Bruno
- Agent: —
- Did: Modal worker deployed (rat-audit on harvard workspace): backfill fan-out, daily/weekly crons, refresh + simulate endpoints; spec updated
- Why: Bruno approved Modal as the single Python worker that fetches data and predicts where reports will appear
- Where: pipeline/, .kiro/specs/rat-audit/*, docs/rat-audit/CONTRACT.md
- Idea: Emerging-hotspot flag (high forecast, little history) and what-if simulator (model estimate) added to spec as R6.7/R6.8
### 2026-10-24 13:12 — Expanded RodentOps evidence: public data, complaints and ...
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Expanded RodentOps evidence: public data, complaints and government priorities
- Why: Make the selected tool more useful with verified sources and realistic limits
- Where: knowledge/19_*, knowledge/24_*, knowledge/15_*, knowledge/16_*, knowledge/README.md, knowledge/sources/
- Idea: Prioritize sourced case reconstruction, missing inspection questions and reviewed follow-up; sensor coverage and bin feasibility are later extensions

### 2026-10-24 13:11 — Wrote docs/rat-audit/TEAM.md: Bruno=data+models, Carol=an...
- Teammate: Bruno Azca
- Agent: kirocrew (Spec agent)
- Did: Wrote docs/rat-audit/TEAM.md: Bruno=data+models, Carol=analytics+agent, Gui=map+inspector UI, Kiro=integration. Recorded build-order dependency chain
- Why: team divided the four CONTRACT tracks before building
- Where: docs/rat-audit/TEAM.md
- Idea: Bruno loads 311 first; Carol+Gui parallel after; model+insights last

### 2026-10-24 13:06 — Moved SOCRATA_APP_TOKEN from .env into .env.local (the fi...
- Teammate: Bruno Azca
- Agent: kirocrew (Spec agent)
- Did: Moved SOCRATA_APP_TOKEN from .env into .env.local (the file the OpenContext MCP bridge and pipeline actually read); verified all 8 MCP servers PASS incl cambridge/somerville
- Why: token was in the wrong env file so regional live data was unreachable
- Where: .env.local
- Idea: Rotate the Socrata token since it was pasted in chat; consider deleting stray .env

### 2026-10-24 13:05 — Reviewed the current RodentOps/Boston Rat Audit idea acro...
- Teammate: Guilherme
- Agent: Claude Code (review; not Kiro build activity)
- Did: Reviewed the current RodentOps/Boston Rat Audit idea across the atlas card, docs 15/16/18, spec, agents, hooks; re-queried 311 closure classes live
- Why: Guilherme asked for a look at the current rodent idea after the direction change
- Where: none
- Idea: Spec is still the blank template; 2,033 of 5,321 2026 rodent closures contain inspector emails (strip from snapshot); atlas headline numbers (237/280, 14.1->14.2) are not reproduced in the repo

### 2026-10-24 13:05 — Privacy-by-reveal: names/full addresses in private schema...
- Teammate: Bruno
- Agent: —
- Did: Privacy-by-reveal: names/full addresses in private schema, blurred with eye icon, fetched via /api/reveal and logged; imported spec into Kiro Crew Spec Builder
- Why: Bruno wants names visible in the demo on demand, not by default; spec reviewed by the Kiro Crew spec agent
- Where: supabase/migrations/20261024000004_private_reveal.sql, .kiro/specs/rat-audit/*, docs/rat-audit/CONTRACT.md
- Idea: Owner portfolio view after reveal; validation shows rain/demolitions/events/restaurants/Big Belly are null predictors

### 2026-10-24 13:05 — Tested all 43 rat datasets on live data (grid, time, trac...
- Teammate: Bruno
- Agent: —
- Did: Tested all 43 rat datasets on live data (grid, time, tract); verdicts on the board; report + scripts; design.md model features updated; data-validation.md added to the spec
- Why: Keep only data that really predicts or explains rodent reports
- Where: knowledge/19_rat_data_validation.md, knowledge/sources/rats/validation/, .kiro/specs/rat-audit/data-validation.md, .kiro/specs/rat-audit/design.md
- Idea: Trash and housing signals predict rats; restaurants, rain and demolitions don't; 311 under-counts vulnerable tracts

### 2026-10-24 13:03 — Reverted the rat-audit scope cut: removed Demo-minimum SC...
- Teammate: Bruno Azca
- Agent: kirocrew (Spec agent)
- Did: Reverted the rat-audit scope cut: removed Demo-minimum SCOPE FREEZE block, restored forecast R6/task 2.6 to P0. Kept the three accuracy fixes (2026 number 5,321, baseline-first forecast labelling, CSV demo-data fallback in R1.1)
- Why: Team has many credits and people; full P0 is back on with parallel tracks
- Where: .kiro/specs/rat-audit/requirements.md, .kiro/specs/rat-audit/tasks.md
- Idea: Build the full P0 across the 4 tracks in CONTRACT.md in parallel rather than cutting

### 2026-10-24 13:02 — Scope-froze rat-audit spec: added Demo-minimum P0 block (...
- Teammate: Bruno Azca
- Agent: kirocrew (Spec agent)
- Did: Scope-froze rat-audit spec: added Demo-minimum P0 block (DM.1–DM.7) to tasks.md, demoted GBM forecast R6/task 2.6 to P1 with last-4-week baseline as P0, fixed demo number to 2026 (5,321), added CSV demo-data fallback to R1.1
- Why: 3h to 8PM deadline; full P0 was multi-day and unbuilt (pipeline empty, no RPCs/components beyond stubs)
- Where: .kiro/specs/rat-audit/requirements.md, .kiro/specs/rat-audit/tasks.md
- Idea: Ship a tiny working map+site+approve demo over a broken full build; label data honestly as seeded vs live

### 2026-10-24 13:01 — Reviewed .kiro/specs/rat-audit against the 4 campaign res...
- Teammate: Bruno
- Agent: —
- Did: Reviewed .kiro/specs/rat-audit against the 4 campaign results; started 2 new Kiro Crew campaigns: closure-note classifier rules (task 2.2) and Sept 1 move-out/events spike (R5.2 P0 finding, unverified)
- Why: Research changes several P0 items in the spec
- Where: none
- Idea: Spec impacts: R5.2 trash finding is weak at block level (+0.13); lead with what-worked; classifier needs a 'no stated action' tag, 80% coverage target unrealistic; rain input (R6.4) adds nothing; recommendation rules should escalate after repeat monitoring and flag adjacent vacant lots

### 2026-10-24 12:54 — Decided where the forecast model runs: batch Python writi...
- Teammate: Bruno
- Agent: —
- Did: Decided where the forecast model runs: batch Python writing predictions to Supabase
- Why: Supabase cannot run Python; the model is batch, not real-time
- Where: none
- Idea: Schedule via GitHub Actions cron (free) or Modal (cron + on-demand what-if endpoint); Vercel only calls the chat LLM API

### 2026-10-24 12:52 — Wrote full initial spec for Rat Audit (requirements EARS,...
- Teammate: Bruno
- Agent: —
- Did: Wrote full initial spec for Rat Audit (requirements EARS, design, tasks) + steering update
- Why: Bruno asked for the complete initial spec before building; adds Cambridge + Somerville scope
- Where: .kiro/specs/rat-audit/, .kiro/steering/{tech,product}.md, contracts/categories.json, supabase/migrations/20261024000003_city_column.sql
- Idea: Somerville 311 has 8,770 Rats + 3,760 Rodent Assistance Program requests (block centroids); Cambridge 5,188 sightings + 528 smart rat boxes with monthly catches — three-city comparison finding

### 2026-10-24 12:51 — Committed RodentOps guards on main (2df47d1): rodent-hone...
- Teammate: Guilherme
- Agent: kirocrew
- Did: Committed RodentOps guards on main (2df47d1): rodent-honesty + no-auto-action agents, overclaim-guard hook + scanner, spec renamed to rodent-ops
- Why: Save the idea-specific Kiro automation; ready for human push
- Where: .kiro/agents/*, .kiro/hooks/overclaim-guard.kiro.hook, .kiro/scripts/check_overclaims.py, .kiro/specs/rodent-ops/*, README.md, data/civic/CATALOG.md
- Idea: none

### 2026-10-24 12:48 — Set up RodentOps-specific Kiro automation: rodent-honesty...
- Teammate: Guilherme
- Agent: kirocrew
- Did: Set up RodentOps-specific Kiro automation: rodent-honesty agent (3-layer rule), no-auto-action agent (human decision point), overclaim-guard hook + check_overclaims.py scanner; renamed spec folder civic-service->rodent-ops and fixed README + CATALOG refs
- Why: Give the chosen idea its own honesty/safety guards without touching the data source (partner owns that)
- Where: .kiro/agents/rodent-honesty.json, .kiro/agents/no-auto-action.json, .kiro/hooks/overclaim-guard.kiro.hook, .kiro/scripts/check_overclaims.py, README.md, data/civic/CATALOG.md, .kiro/specs/rodent-ops/ (renamed)
- Idea: Overclaim scanner encodes the knowledge-base bans (reports!=rats, closed!=solved, no infestation prediction) as a deterministic pre-check so honesty is enforced on every save

### 2026-10-24 12:48 — Kiro Crew campaign b6ba6312 (cost of rats) done; all 4 ca...
- Teammate: Bruno
- Agent: —
- Did: Kiro Crew campaign b6ba6312 (cost of rats) done; all 4 campaign reports exported to Kiro knowledge library; cost section added to knowledge/15
- Why: Defensible impact numbers for the pitch
- Where: knowledge/15_boston_rat_audit.md, .kiro/campaigns/rat-audit-research-campaigns.md
- Idea: Safe numbers: 18% of Boston rats carry Leptospira (Tufts, peer-reviewed); 127 food businesses / 301 rodent violations 2025; NYC containerization -20% (pilot -55%); Boston has published no measured BRAP result; home-value loss claim is marketing only

### 2026-10-24 12:45 — Confirmed the chosen idea is RodentOps (rat one); read kn...
- Teammate: Guilherme
- Agent: kirocrew
- Did: Confirmed the chosen idea is RodentOps (rat one); read knowledge docs 15, 16, 18
- Why: Lock the project direction so spec + build can start
- Where: none
- Idea: RodentOps: recurring 311 rodent complaints -> reviewed inspection/follow-up brief; 3 screens: queue -> timeline -> packet

### 2026-10-24 12:45 — Paused build: stopped the 4 parallel build agents to plan...
- Teammate: Bruno
- Agent: —
- Did: Paused build: stopped the 4 parallel build agents to plan more
- Why: Bruno asked to plan further before building
- Where: none
- Idea: Next: settle correlations, prediction design, scope priorities and demo story before restarting tracks

### 2026-10-24 12:44 — Kiro Crew campaigns 93c1ad29 (what worked) and e241ffc6 (...
- Teammate: Bruno
- Agent: —
- Did: Kiro Crew campaigns 93c1ad29 (what worked) and e241ffc6 (block drivers) done; results added to knowledge/09 and the Data Atlas card
- Why: Integrate research results
- Where: knowledge/09_boston_rat_audit.md
- Idea: Monitoring (1,750 cases) does not cut recurrence (14.1->14.2%), violations do (15.3->12.2%); chronic sites get 237/280 monitoring, 14 violations. Block level: ZIP +0.78 was reporting artifact; trash +0.13, dumping +0.10, restaurants +0.03, rain none, Big Belly ~8% lower

### 2026-10-24 12:43 — Scaffolded Rat Audit: Supabase project + PostGIS schema, ...
- Teammate: Bruno
- Agent: —
- Did: Scaffolded Rat Audit: Supabase project + PostGIS schema, Next.js app shell, build contract
- Why: Foundation so four parallel build tracks (data, analytics, map, agent) can work without colliding
- Where: supabase/migrations/, contracts/categories.json, web/, docs/build/CONTRACT.md
- Idea: Correlation list + cell-week Poisson forecast + site recurrence model; price impact as exploratory; events layer

### 2026-10-24 12:42 — Tested electrical fires vs rodent reports by ZIP (2023–24...
- Teammate: Bruno
- Agent: —
- Did: Tested electrical fires vs rodent reports by ZIP (2023–24 and 2026): no link after controlling for fire-call volume
- Why: Check whether fires are a defensible rat impact
- Where: knowledge/sources/rats/fire_pull.py, knowledge/sources/rats/fire_rats.py, knowledge/10_rat_signals_brainstorm.md
- Idea: Drop fires from the pitch; fire data has no cause or coordinates

### 2026-10-24 12:35 — Revised Rat Audit plan: map-first app with integrated age...
- Teammate: Bruno
- Agent: —
- Did: Revised Rat Audit plan: map-first app with integrated agent chat
- Why: Bruno asked for an interactive map of all rat-related problems, clickable incidents, deep inspection and an agent chat
- Where: none
- Idea: MapLibre+deck.gl layers over a full 2024-2026 snapshot; Claude agent whose tools query the data and drive the map (fly to, filter, highlight); Next.js on Vercel for the chat route

### 2026-10-24 12:29 — Drafted implementation plan for Rat Audit (inspector tool)
- Teammate: Bruno
- Agent: —
- Did: Drafted implementation plan for Rat Audit (inspector tool)
- Why: Turn the rat research (docs 09/10, demo_site) into a buildable 7-hour plan
- Where: none
- Idea: Static snapshot from offline Python pipeline + React inspector UI; closure-note classification precomputed; block-level masking; 4 parallel workstreams against a shared snapshot schema

### 2026-10-24 12:27 — Published an editable Rat Audit Data Plan board (43 datas...
- Teammate: Bruno
- Agent: —
- Did: Published an editable Rat Audit Data Plan board (43 datasets by tier, status, driver group)
- Why: Let the team see and change what data we retrieve
- Where: claude.ai/artifact/6bCS5853Lo3fcDvkGqqXid
- Idea: Board edits save to a shared store, so the plan can be read back and turned into retrieval scripts

### 2026-10-24 12:26 — Kiro Crew campaign 2b8f7f81 finished: demo site = Normand...
- Teammate: Bruno
- Agent: —
- Did: Kiro Crew campaign 2b8f7f81 finished: demo site = Normandy St block, Dorchester 02121 (18 rodent reports 2025-26, full escalation failed, adjacent vacant lot); saved to knowledge/sources/rats/demo_site.md; campaign 2 (93c1ad29) started
- Why: Demo needs one real chronic site
- Where: knowledge/sources/rats/demo_site.md
- Idea: Pitch line: 'the city did everything right at the address; the problem is the lot next door' -> treat blocks, not addresses. Use block, not house number, in public demo

### 2026-10-24 12:22 — Dropped the COVID 2020 test from the rat brainstorm; limi...
- Teammate: Bruno
- Agent: —
- Did: Dropped the COVID 2020 test from the rat brainstorm; limited 311 history to 2023–2026
- Why: Team wants signals that lead to action now, not historical one-offs
- Where: knowledge/10_rat_signals_brainstorm.md
- Idea: Only use predictors the city can act on this year

### 2026-10-24 12:18 — Queued remaining Rat Audit campaigns in Kiro Crew Researc...
- Teammate: Bruno
- Agent: —
- Did: Queued remaining Rat Audit campaigns in Kiro Crew Research Lab: 'what actually worked' (closure notes), 'block-level drivers', 'the cost of rats'; each starts when the previous finishes
- Why: Run all research campaigns inside Kiro Crew
- Where: .kiro/campaigns/rat-audit-research-campaigns.md
- Idea: Reports saved as they finish, then copied into knowledge/09_boston_rat_audit.md

### 2026-10-24 12:17 — Brainstormed rat causes, impacts and actions; checked whi...
- Teammate: Bruno
- Agent: —
- Did: Brainstormed rat causes, impacts and actions; checked which datasets exist on Analyze Boston; pulled city pest-control spending
- Why: Decide what data to retrieve next for the Rat Audit
- Where: knowledge/10_rat_signals_brainstorm.md, knowledge/README.md
- Idea: Rats move when something changes: food, shelter, displacement. Forecast 'rat weather' from rain, demolitions, move-out week and events

### 2026-10-24 12:16 — Started Kiro Crew Research Lab campaign 2b8f7f81 'Rat Aud...
- Teammate: Bruno
- Agent: —
- Did: Started Kiro Crew Research Lab campaign 2b8f7f81 'Rat Audit — pick the demo address' via the local API (agent mode, 10 cycles, 3 workers, unattended)
- Why: Run the rat research inside Kiro Crew
- Where: .kiro/campaigns/rat-audit-research-campaigns.md
- Idea: Research Lab allows one active campaign at a time; run 2, 1, 3 after this one
### 2026-10-24 12:37 — Pulled origin/main (Guilherme's secret-scan + knowledge r...
- Teammate: Carol
- Agent: kirocrew (default)
- Did: Pulled origin/main (Guilherme's secret-scan + knowledge reorg, 53 files); resolved the KIRO_LOG conflict keeping both sides newest-first
- Why: Carol asked to pull the repo
- Where: .kiro/KIRO_LOG.md

### 2026-10-24 12:35 — Re-verified after knowledge reorg: secret scan clean, 8/8...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Re-verified after knowledge reorg: secret scan clean, 8/8 MCP PASS, readiness green except app/docs; fixed stale usage paths in moved knowledge/sources/scripts
- Why: Keep docs and scripts consistent after the renumber
- Where: knowledge/sources/scripts/*.py
- Idea: none

### 2026-10-24 12:31 — Added secret scanner + secret-scan Kiro hook + git pre-co...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Added secret scanner + secret-scan Kiro hook + git pre-commit block; made audit-log sync publish a sanitized repo-only excerpt (raw log had other projects, home paths and the Socrata token); readiness now checks secrets, MCP health, LICENSE; added MIT LICENSE; docs updated
- Why: Repo is public; raw audit sync would have leaked secrets
- Where: .kiro/scripts/scan_secrets.py, .kiro/hooks/secret-scan.kiro.hook, .githooks/pre-commit, .kiro/audit/*, .kiro/scripts/check_submission_ready.py, .kiro/scripts/check_mcp.py, LICENSE, README.md, .kiro/steering/tech.md, knowledge/23_live_data_sources.md
- Idea: Teammates: git config core.hooksPath .githooks

### 2026-10-24 12:26 — Gave civic-judge (civic-snapshots + playwright MCP) and s...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Gave civic-judge (civic-snapshots + playwright MCP) and snapshot-validator (civic-snapshots MCP) access to MCP via includeMcpJson; audit of MCP docs/log coverage
- Why: Custom agents only see MCP when granted; now they can recompute numbers and walk the demo
- Where: .kiro/agents/civic-judge.json, .kiro/agents/snapshot-validator.json
- Idea: none

### 2026-10-24 12:27 — Reviewed the whole repo: scaffold, 22 datasets, civic res...
- Teammate: Carol
- Agent: kirocrew (default)
- Did: Reviewed the whole repo: scaffold, 22 datasets, civic research, rat audit. Mapped the problem and the leading build idea.
- Why: Carol asked for a full understanding of the repo and the problem before building
- Where: none
- Idea: Leading idea: RodentOps evidence-audit tool for the Boston Rodent Action Plan, built on the committed boston-311 snapshot

### 2026-10-24 12:16 — Resolved KIRO_LOG merge conflict: kept both sides' entrie...
- Teammate: Bruno
- Agent: —
- Did: Resolved KIRO_LOG merge conflict: kept both sides' entries, interleaved newest-first
- Why: Pull of origin/main (Guilherme's MCP setup) conflicted on the log
- Where: .kiro/KIRO_LOG.md
- Idea: none

### 2026-10-24 12:13 — Checked how to run Research Lab campaigns programmaticall...
- Teammate: Bruno
- Agent: —
- Did: Checked how to run Research Lab campaigns programmatically: no MCP server for auto-research, but Kiro Crew gateway (localhost:5476, token auth) exposes /api/apps/auto-research/campaigns (create, get, report, to-knowledge)
- Why: Run the rat campaigns inside Kiro Crew without the UI
- Where: none
- Idea: Drive campaigns via the local API with a short-lived token from 'kirocrew token --ttl 2h'

### 2026-10-24 12:11 — Saved 4 Kiro Crew Research Lab campaign prompts for the R...
- Teammate: Bruno
- Agent: —
- Did: Saved 4 Kiro Crew Research Lab campaign prompts for the Rat Audit (block-level drivers, what worked, cost of rats, demo address)
- Why: Run the remaining research inside Kiro Crew
- Where: .kiro/campaigns/rat-audit-research-campaigns.md
- Idea: Run order: 4 (demo site) → 2 (closure notes) → 1 and 3 in parallel

### 2026-10-24 12:08 — Renamed rat research doc to knowledge/09_boston_rat_audit...
- Teammate: Bruno
- Agent: —
- Did: Renamed rat research doc to knowledge/15_boston_rat_audit.md (08 was already taken by the idea shortlist)
- Why: Avoid clashing doc numbers
- Where: knowledge/15_boston_rat_audit.md, knowledge/README.md
- Idea: none

### 2026-10-24 12:08 — Added knowledge/08_boston_rat_audit.md (all rat datasets ...
- Teammate: Bruno
- Agent: —
- Did: Added knowledge/08_boston_rat_audit.md (all rat datasets with resource IDs, findings, impact, property-value evidence, product shape) + scripts in knowledge/sources/scripts/
- Why: Keep the lead idea's research in the repo for the team
- Where: knowledge/08_boston_rat_audit.md, knowledge/README.md, knowledge/sources/scripts/*.py
- Idea: Airbnb: 212 of 267,731 reviews mention rats/mice (Bay Village 0.39%); Zillow vs rodent rate weak (ZHVI -0.18, ZORI +0.30): do not claim value loss

### 2026-10-24 12:16 — Turned on Cambridge + Somerville OpenContext servers with...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Turned on Cambridge + Somerville OpenContext servers with Socrata token in git-ignored .env.local; bridge reads .env.local; check_mcp SKIPs token servers when unset; added .env.example + knowledge/23_live_data_sources.md; 8/8 PASS
- Why: All live civic sources ready, secrets kept out of git
- Where: .kiro/mcp/opencontext_stdio.py, .kiro/scripts/check_mcp.py, .kiro/settings/mcp.json, .kiro/steering/mcp-tools.md, .env.example, knowledge/23_live_data_sources.md, README.md
- Idea: Share .env.local only via private channel

### 2026-10-24 11:58 — Finished MCP setup: env-var expansion in OpenContext brid...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Finished MCP setup: env-var expansion in OpenContext bridge, Cambridge + Somerville Socrata servers (off until SOCRATA_APP_TOKEN), README MCP section; all 6 enabled servers PASS
- Why: Have every civic data source ready before the idea is picked
- Where: .kiro/mcp/opencontext_stdio.py, .kiro/mcp/opencontext/*-socrata.yaml, .kiro/settings/mcp.json, .kiro/steering/mcp-tools.md, README.md
- Idea: none

### 2026-10-24 11:57 — Set up 6 MCP servers for Kiro: City of Boston OpenContext...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Set up 6 MCP servers for Kiro: City of Boston OpenContext (data.boston.gov + MassGIS) via stdio bridge, civic-snapshots SQL, MBTA live, aws-docs, playwright; check_mcp script + hook + steering
- Why: Data tools ready before the idea is picked
- Where: .kiro/settings/mcp.json, .kiro/mcp/*, .kiro/scripts/check_mcp.py, .kiro/hooks/mcp-health.kiro.hook, .kiro/steering/mcp-tools.md, .kiro/steering/structure.md
- Idea: OpenContext is the City's own MCP; using it is a strong City-fit + integration story

### 2026-10-24 11:56 — Reframed Rats into Boston Rat Audit (all sources: 311 rod...
- Teammate: Bruno
- Agent: —
- Did: Reframed Rats into Boston Rat Audit (all sources: 311 rodents/pests/dead animals, RentSmart, food inspections+licenses, trash 311+schedules+Big Belly+PW violations, assessment/owners, permits, vacant/abandoned, rainfall, parks, vulnerability, asthma, closure notes, OpenAlex)
- Why: Team wants a full audit of rat drivers, not one hypothesis
- Where: none (Data Atlas page)
- Idea: ZIP-level 2025: rodent reports vs improper trash storage +0.78, housing pest violations +0.68, dumping +0.63, restaurants +0.41; rats follow trash more than restaurants

### 2026-10-24 11:56 — Wrote knowledge/13: five new concepts (CurbCheck, Three H...
- Teammate: Guilherme
- Agent: Claude Code (research/ideation; not Kiro build activity)
- Did: Wrote knowledge/13: five new concepts (CurbCheck, Three Hours, 311 outcome layer, On the Record, Warrant) with live-verified sources
- Why: User asked for 100% new, best-for-this-hackathon ideas regardless of complexity
- Where: knowledge/17_hidden_ledgers_deep_concepts.md, knowledge/README.md
- Idea: Recommend CurbCheck: photo of a paper no-parking sign -> City Street Occupancy Permit lookup -> verified/no-match/ambiguous card; Parking Enforcement is the #1 2026 311 type (52,623)

### 2026-10-24 11:54 — Chose Rats as lead idea; validated: 5,321 rodent reports ...
- Teammate: Bruno
- Agent: —
- Did: Chose Rats as lead idea; validated: 5,321 rodent reports in 2026 through Oct 23 (already > all 2025: 5,225); 46 addresses had 5+ reports in 2025, 407 came back 30+ days later; closure text records cause/action
- Why: Make the rat idea actionable and check for an existing city program
- Where: none
- Idea: Plug into Boston Rodent Action Plan (BRAP, 2024, ISD-led, 10 agencies): chronic-site list + LLM-classified closure notes ('what worked') + 'closed but came back' metric

### 2026-10-24 11:51 — Agreed Morning Dispatch is a feature, not a product; prop...
- Teammate: Bruno
- Agent: —
- Did: Agreed Morning Dispatch is a feature, not a product; proposed making Problem Landlord Radar the product with rats/no-heat/fire as its evidence
- Why: Product needs a non-obvious core a dashboard can't copy
- Where: none
- Idea: Core = resolving hidden portfolios (125 owner names -> 1 mailing address) + problems per unit; user = ISD / Office of Housing Stability / tenant unions

### 2026-10-24 11:50 — Reframed rodent concept as an operational inspection tool
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Reframed rodent concept as an operational inspection tool
- Why: User wants a practical tool; assess its value and workflow risks candidly
- Where: knowledge/16_rodent_control_creative_playbook.md; knowledge/README.md; knowledge/18_idea_shortlist_and_build_recommendation.md; knowledge/14_creative_civic_opportunity_atlas.md
- Idea: RodentOps: recurring complaints to a reviewed inspection brief, with separate action and outcome evidence

### 2026-10-24 11:49 — Verified Problem Landlord Radar on real data: 913 owner n...
- Teammate: Bruno
- Agent: —
- Did: Verified Problem Landlord Radar on real data: 913 owner names have tenant problems at 2+ parcels; property-assessment mailing address links 125 owner names to one address (128 parcels, 1,053 units, 63 with problems)
- Why: Check the multi-building pattern actually exists before pitching
- Where: none (Data Atlas page updated)
- Idea: Rank by problems per unit (city 0.12): one hidden group at 0.13 (big, not bad), one at 1.43 (11x). Many top owners are nonprofit affordable housing; mailing address is often a property manager

### 2026-10-24 11:45 — Turned the 'city risk dashboard + map + chat' idea into M...
- Teammate: Bruno
- Agent: —
- Did: Turned the 'city risk dashboard + map + chat' idea into Morning Dispatch: daily crew work list, weather-triggered playbooks, bundled visits, silence flags, cited 'why' chat, supervisor approval, next-day loop
- Why: Avoid an obvious super-app; keep it actionable
- Where: none (Data Atlas page)
- Idea: Demo: replay Jan 30 2022 dispatch vs where complaints actually came next 3 days

### 2026-10-24 11:44 — Read team votes (liked: Rats, Dark Corners, Day After the...
- Teammate: Bruno
- Agent: —
- Did: Read team votes (liked: Rats, Dark Corners, Day After the Storm; 14 disliked) and added 6 new ideas in that style: Cold Apartments, Problem Landlord Radar, Clean the Drains First, Clear the Snow Routes, Alarms Before Fires, One Visit per Block
- Why: Likes favor field-crew triage of a visceral hazard with many causal datasets
- Where: none (Data Atlas page)
- Idea: Fire incidents (601,721 rows w/ address) + RentSmart owner join + 311 heat/catchbasin/abandoned cars are the new data hooks

### 2026-10-24 11:43 — Researched eight creative rodent-control concepts and ver...
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Researched eight creative rodent-control concepts and verified source data
- Why: Ground the rodent idea in current City priorities, usable records and a feasible demo
- Where: knowledge/16_rodent_control_creative_playbook.md; knowledge indexes and briefs; knowledge/sources/rodent*; knowledge/sources/scripts/audit_rodent_resources.py
- Idea: NIGHTSHIFT: coordinate one block of overnight waste exposure; RATLAB is the data-analysis alternative

### 2026-10-24 11:39 — Made every idea actionable in the Data Atlas: each card n...
- Teammate: Bruno
- Agent: —
- Did: Made every idea actionable in the Data Atlas: each card now names Who uses it and what they do Tomorrow; storm idea rebuilt as deep dive with real Jan 2022 blizzard example
- Why: Audience must see they can use it tomorrow to fix a real problem
- Where: none (Data Atlas page)
- Idea: Pitch rule: every idea = named user + one concrete next-day action + real number

### 2026-10-24 11:36 — Tested 'Day After the Storm' on the real Jan 29 2022 bliz...
- Teammate: Bruno
- Agent: —
- Did: Tested 'Day After the Storm' on the real Jan 29 2022 blizzard (FEMA DR, Apr 2022): 4,341 snow 311 cases in 8 days, median 10.6 h to close; joined to 180 Climate Ready tracts
- Why: Check if storm impact and equity gap are real before building
- Where: none
- Idea: Gap is modest citywide (most vulnerable third: 6.6 reports/1k, 11.6 h vs 6.9/1k, 10.5 h); a few tracts stand out, e.g. Roxbury 090600 median 39 h. MBTA 2022 alerts and past NWS alerts not available

### 2026-10-24 11:29 — Added one-line short descriptions to the 6 deep-dive idea...
- Teammate: Bruno
- Agent: —
- Did: Added one-line short descriptions to the 6 deep-dive idea cards in the Data Atlas
- Why: Make each deep dive readable at a glance
- Where: none (Data Atlas page)
- Idea: none

### 2026-10-24 11:27 — Added 6 deep-dive ideas to Data Atlas (Rats, Dark Corners...
- Teammate: Bruno
- Agent: —
- Did: Added 6 deep-dive ideas to Data Atlas (Rats, Dark Corners, Sidewalks That Hurt, Move-In Mess, Shade Before Heat, Sharps Route) + 9 datasets
- Why: Rat idea worked well; find more problems with many explaining datasets
- Where: none (Data Atlas page)
- Idea: Live 311: 1,012 of 4,497 streetlight outages open; 69% of 2,752 sidewalk repairs open; 280 move-in trash, 1,264 needle pickups

### 2026-10-24 11:19 — Added team like/dislike voting to the Data Atlas ideas; l...
- Teammate: Bruno
- Agent: —
- Did: Added team like/dislike voting to the Data Atlas ideas; liked float to top, disliked move to a bottom section; votes shared via artifact db
- Why: Team needs to converge on one idea fast
- Where: none (artifact: claude.ai/artifact/Ccw6n593reUG1MQjAawa2W)
- Idea: Use the vote board to shortlist before 12:00 spec deadline

### 2026-10-24 11:17 — Lab to Block check: starter OpenAlex top-500 is mostly bi...
- Teammate: Bruno
- Agent: —
- Did: Lab to Block check: starter OpenAlex top-500 is mostly biomedical (only '15-minute city' fits); live OpenAlex search finds BU Boston-rat studies, Northeastern road-diet work
- Why: Validate idea before building
- Where: none
- Idea: Use live OpenAlex search + 'Boston' filter, not the starter file

### 2026-10-24 11:17 — Rat idea data check: 2025 311 has 5,225 Rodent Activity +...
- Teammate: Bruno
- Agent: —
- Did: Rat idea data check: 2025 311 has 5,225 Rodent Activity + 1,900 Pest Infestation; food inspections 3,608 rodent/mice hits at 833 businesses since 2025; RentSmart 17,594 rodent rows with parcel+lat/long
- Why: Validate 'Rats Follow the Restaurants' before building
- Where: none
- Idea: Add trash schedules, Big Belly, public works violations, demolition permits, rainfall as rat drivers

### 2026-10-24 11:17 — Found live Boston 311 (CKAN 254adca6) has 75,498 rows Aug...
- Teammate: Bruno
- Agent: —
- Did: Found live Boston 311 (CKAN 254adca6) has 75,498 rows Aug 2025-Oct 2026 WITH case_id, close_date, address, lat/long
- Why: Starter 311 drops these; live table unlocks resolution time and maps
- Where: none
- Idea: Use live 311 via datastore_search_sql instead of the 5k starter for any 311 idea

### 2026-10-24 11:17 — Built Civic Data Atlas overview page: 22 starter + 19 fet...
- Teammate: Bruno
- Agent: —
- Did: Built Civic Data Atlas overview page: 22 starter + 19 fetchable public datasets in 8 clusters, 12 cross-cluster ideas
- Why: Team needed one view of all data and integration ideas
- Where: none (artifact: claude.ai/artifact/Ccw6n593reUG1MQjAawa2W)
- Idea: Clusters: requests, housing, people/need, hazards, transit, streets, movement, campus/careers

### 2026-10-24 11:14 — Expanded Civic research with 15 creative concepts and ver...
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Expanded Civic research with 15 creative concepts and verified public resources
- Why: Connect public priorities and resident friction to distinctive feasible demos
- Where: knowledge/02,04,07,08,09,10,11,README; knowledge/sources; data/civic/CATALOG.md
- Idea: Prioritize Last 100 Feet, ShiftFits or OpenDoor after proving one dependency; retain BlockBrief as fallback

### 2026-10-24 11:03 — Re-read full rules, judging, City + sponsor evidence (doc...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Re-read full rules, judging, City + sponsor evidence (docs 00-09); scored ideas vs rubric
- Why: Team found prior ideas obvious/boring
- Where: none
- Idea: Top: Last 100 Feet (A1); runner-up MoveOut Relay (A10); both algorithm-core like City's mattress award

### 2026-10-24 10:52 — Verified audit/log feature complete and teammate-ready
- Teammate: Guilherme
- Agent: default
- Did: Verified audit/log feature complete and teammate-ready
- Why: confirm git pull gives teammates the full logging system
- Where: none
- Idea: none

### 2026-10-24 10:51 — Full repo review; shortlisted 5 build ideas, recommend Bl...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Full repo review; shortlisted 5 build ideas, recommend BlockBrief + overdue view
- Why: Pick an app now; 0 code at 10:50 AM
- Where: none
- Idea: 311 on_time: Dorchester 24% overdue vs Back Bay 14%; Wait Watch, Safe Last Mile, Cost-to-Career as alternates

### 2026-10-24 10:48 — Committed on main (68d2e23): clean civic-service spec + i...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Committed on main (68d2e23): clean civic-service spec + idea-neutral Kiro automation; ready for human to push
- Why: Save the spec reset and automation work; idea to come later
- Where: 13 files: .kiro/specs/civic-service/*, .kiro/agents/snapshot-validator.json, .kiro/hooks/snapshot-citation-check.kiro.hook, .kiro/scripts/*, README.md, docs/submission/kiro-usage.md, data/civic/CATALOG.md, .kiro/steering/structure.md
- Idea: Human runs: git push origin main

### 2026-10-24 10:45 — dry-run scorecard of current state
- Teammate: Guilherme
- Agent: civic-judge
- Did: dry-run scorecard of current state
- Why: surface the biggest submission risk early
- Where: none
- Idea: Pick the idea now and ship one real end-to-end slice; a template spec and zero app code is the submission's biggest risk at 10:45 AM.

### 2026-10-24 10:45 — Built idea-neutral Kiro automation: snapshot-validator ag...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Built idea-neutral Kiro automation: snapshot-validator agent+hook+script, submission-readiness script+cron, hourly demo-path-health cron, and triggered a civic-judge dry run
- Why: Set up useful, idea-agnostic Kiro automation that leaves a visible proof trail before the app idea is chosen
- Where: .kiro/agents/snapshot-validator.json, .kiro/hooks/snapshot-citation-check.kiro.hook, .kiro/scripts/validate_snapshots.py, .kiro/scripts/check_submission_ready.py, 2 cron jobs
- Idea: Crons fire on the Schedule page; validators enforce the civic cite+ready rules for any idea

### 2026-10-24 10:39 — Removed parking-permit-navigator spec; created clean idea...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Removed parking-permit-navigator spec; created clean idea-neutral civic-service spec (requirements/design/tasks) and fixed all references in README, structure.md, kiro-usage.md, CATALOG.md
- Why: Start fresh on a new civic idea with a complete, blank-but-structured spec
- Where: .kiro/specs/civic-service/*, README.md, .kiro/steering/structure.md, docs/submission/kiro-usage.md, data/civic/CATALOG.md
- Idea: Rename civic-service to the chosen outcome (e.g. block-brief) once the team decides

### 2026-10-24 10:36 — Pulled origin/main and reviewed KB + repo state; found no...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Pulled origin/main and reviewed KB + repo state; found no app code yet, submission docs still templates, spec still parking-permit template while research recommends BlockBrief
- Why: User asked for a full state review and showcase recommendations
- Where: .kiro/KIRO_LOG.md
- Idea: Pick BlockBrief, rename spec to block-brief, build 3-screen app from boston-311 snapshot; wire historian agent to fill kiro-usage.md at the end

### 2026-10-24 10:35 — Recommended three scoped Civic MVPs; team choice remains ...
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Recommended three scoped Civic MVPs; team choice remains open
- Why: Connect creativity to the rubric and verified available data
- Where: knowledge/18_idea_shortlist_and_build_recommendation.md
- Idea: Prefer BlockBrief for waste-service evidence briefs; Notice to Action for accessible public notices; MoveReady for a narrow preparation flow

### 2026-10-24 10:31 — Made pure-talk ideas/brainstorm loggable
- Teammate: Guilherme
- Agent: default
- Did: Made pure-talk ideas/brainstorm loggable
- Why: ideas are our strongest Kiro story; must be captured even with no code
- Where: .kiro/steering/kiro-log.md, .kiro/KIRO_LOG.md
- Idea: log a brainstorm with Where: none
### 2026-10-24 10:16 — Correction: the three '— (unconfirmed)' entries from 10:1...
- Teammate: Bruno
- Agent: default (kiro-cli chat)
- Did: Correction: the three '— (unconfirmed)' entries from 10:13–10:14 were driven by Bruno
- Why: attribute the app-enable, catch-all logging hook, and decisions to the right teammate
- Where: none (attribution correction)
- Idea: —

### 2026-10-24 10:14 — Replaced spec-only hook with catch-all log-all-work hook ...
- Teammate: — (unconfirmed)
- Agent: default (kiro-cli chat)
- Did: Replaced spec-only hook with catch-all log-all-work hook covering all apps/files
- Why: every app's work product should auto-log, not just two apps
- Where: .kiro/hooks/log-all-work.kiro.hook (added), .kiro/hooks/spec-log.kiro.hook (removed)
- Idea: hooks fire on repo file changes, not on in-dashboard app clicks — logging follows the files any app writes

### 2026-10-24 10:13 — Added spec-log hook to auto-log spec changes
- Teammate: — (unconfirmed)
- Agent: default (kiro-cli chat)
- Did: Added spec-log hook to auto-log spec changes
- Why: make Spec Builder work self-logging so it is visible to judges
- Where: .kiro/hooks/spec-log.kiro.hook
- Idea: Design Critique work already logged by existing accessibility-check hook on src/**

### 2026-10-24 10:13 — Enabled Spec Builder + Design Critique in Crew; dropped C...
- Teammate: — (unconfirmed)
- Agent: default (kiro-cli chat)
- Did: Enabled Spec Builder + Design Critique in Crew; dropped Code Review Sage (no PRs) and others (1-day scope)
- Why: focus on apps that feed required artifacts: spec = meaningful .kiro usage, design critique = scored a11y
- Where: none (Crew app state)
- Idea: Crew is single-user/local; real team sharing stays on GitHub

### 2026-10-24 10:13 — Mirrored the Civic Action datasets into the repo
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Pulled origin/main (ff), then downloaded all 23 Civic Action datasets + 6 starter-kit zips from the Hackachusetts data portal into data/civic/, with a CATALOG.md index.
- Why: Have authoritative, demo-safe static snapshots in-repo instead of relying on live APIs.
- Where: data/civic/CATALOG.md, data/civic/datasets/* (23 datasets: data.csv + README + fetch.py/js), data/civic/kits/*.zip
- Idea: permits + boston-311 + neighborhoods + violations are the snapshots to wire into the parking-permit-navigator demo.

### 2026-10-24 10:07 — Expanded sourced Civic research and dataset audit
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Added caption notes, recent City sources, municipal awards, and all 22 CSV audits.
- Why: Ground the project choice in verified needs, existing tools, and usable data.
- Where: knowledge/02–04, knowledge/06–07, knowledge/README.md, knowledge/sources/
- Idea: Show one completed service task with measured results and explicit data limits.

### 2026-10-24 10:04 — Pushed self-logging rule + historian agent
- Teammate: Guilherme
- Agent: default
- Did: Pushed self-logging rule + historian agent
- Why: team gets auto-logging on pull
- Where: .kiro/steering/kiro-log.md, .kiro/agents/kiro-historian.json
- Idea: run kiro-historian at the end to write kiro-usage.md

### 2026-10-24 10:00 — Scaffolded full .kiro structure, submission docs, and ver...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Scaffolded full .kiro structure, submission docs, and verbatim rules/event reference; pushed to GitHub
- Why: Set up the repo to use Kiro well and satisfy submission requirements
- Where: .kiro/steering/*, .kiro/specs/parking-permit-navigator/*, .kiro/hooks/*, .kiro/agents/civic-judge.json, docs/submission/*, knowledge/00 + 05, README.md, .gitignore
- Idea: end-of-event: read KIRO_LOG.md to write docs/submission/kiro-usage.md

### 2026-10-24 10:00 — Built klog helper + summarizer agent
- Teammate: Guilherme
- Agent: default
- Did: Built klog helper + summarizer agent
- Why: make logging everything one easy command
- Where: .kiro/klog.sh
- Idea: end-of-event agent reads log for full context

### 2026-10-24 13:56 — Added the Kiro work log
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Created this log file and a steering rule so all chats/agents write here.
- Why: We must prove our Kiro usage. A living log is the proof.
- Where: `.kiro/KIRO_LOG.md`, `.kiro/steering/kiro-log.md`
- Idea: Read this log at the end to fill `docs/submission/kiro-usage.md`.

### 2026-10-24 12:30 — Reorganized the knowledge base (full renumber)
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Renumbered all knowledge docs into clean thematic groups (00–03 competition/event, 10–18 strategy/evidence/ideas, 20–23 data/verification); fixed the duplicate `09_` collision; split `knowledge/sources/` into `scripts/` (code) and `artifacts/` (JSON/CSV outputs); removed `__pycache__`; flattened `sources/rats/` into `sources/scripts/`. Updated every cross-reference (markdown links, bare "document NN" prose, script output paths) and the two README indexes. Patched script path depths (`parents[1→2]`, `parents[2→3]`) and redirected audit outputs into `artifacts/`.
- Why: The KB felt chaotic — gapped/duplicate numbering and research code mixed with data outputs. Guilherme asked to organize and push.
- Where: `knowledge/*.md` (13 renamed), `knowledge/README.md`, `knowledge/sources/README.md`, `knowledge/sources/scripts/*.py`, `data/civic/CATALOG.md`, `data/civic/inventory/README.md`, `README.md`, `.kiro/steering/mcp-tools.md`, `.kiro/campaigns/rat-audit-research-campaigns.md`
- Idea: Audit JSONs under `sources/artifacts/` keep their original doc numbers as dated evidence; re-run a script to regenerate against current filenames.
