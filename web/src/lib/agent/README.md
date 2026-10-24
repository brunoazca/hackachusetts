# Agent track: `/api/chat`, `lib/agent`, `components/chat`

This worktree owns tasks 4.1–4.6. Core tasks 4.1–4.4 and 4.6 are implemented with the validation limits below, including v2 `due_sites` and `app_set_mode`. Task 4.5 remains unimplemented P1 work; the whole Agent track is not being marked complete.

## Ranked region chat tools — October 24, 2026 (local, not pushed)

- `rank_regions({limit, neighborhood?, people_above?, sort_by})`: severity uses the
  published rank; people sorts estimated residents; benefit sorts published
  `after_fix.delta_4w`. No weighted severity × benefit score is invented. Threshold
  is strict (more than), applied before top-N; published rank remains stable.
- `explain_region({region_id | rank | neighborhood})`: returns problem, solution,
  evidence, future and estimated residents with source IDs and available coordinates.
- `compare_regions({left, right})`: same five fields side by side. Each selector is
  exactly one ID, published rank or neighborhood. A neighborhood means its top
  published region, not neighborhood totals. Unknown or identical selections fail.
- “Take me to the worst region”: rank top one, enable forecast, then `map_select`
  with kind `cell`, its returned ID and focus coordinates. Reuses existing Inspect.

Live adapter first calls read-only `insights_regions(lim: 201, hood: null)`. Only a
missing RPC triggers compatibility reads of `region_solutions`, matching the current
card parser. Permission/connection errors never silently switch sources. Coordinates
come from `cell_detail`; missing coordinates do not become invented targets.
The compatibility ranking is capped at 201 and explicitly marked truncated at that
boundary. Filters and comparisons apply to the loaded published regions, not all
possible cells or live map filters.

Resident totals use `cell_population` over distinct member cells, only with complete
coverage and contributing tracts. Do not substitute the averaged demographics from
`region_context`. Missing population makes that filter unavailable; partial coverage
never passes the threshold. Residents are not guaranteed beneficiaries; overlapping
regions cannot be summed. The existing solution model publishes no after-fix effect,
so fallback `after_fix` stays null. Benefit ordering becomes available only when
published estimates exist. No RPC/table migration or database write is included.

Validation uses fixtures and mocked GET responses, not a live LLM/browser deployment.

## Point selection from the current viewport — October 24, 2026

“Which is the main point here?” is an action request: look up matching incidents
using the question's captured bounds and date/category/status filters, explain the
selection criterion, then call `map_select` with the returned kind, ID and `focus`
coordinates. The tool centers the map (default zoom 17) and calls the same
`select` action as a manual click. ChatPanel also opens the existing right panel.
No Inspect layout is added or replaced: that presentation remains Bruno's work.

Without a supported severity ranking, choose a review candidate from the returned
matches (open first, then recent), explicitly not a “most severe” claim. Chronic-site
queue rankings have a historical scope and must not be described as filtered
incident rankings. Missing matches or coordinates must not produce invented points.
An ambiguous “open that one” requires disambiguation. Explanatory “why here?”
questions still preserve the camera; opening a point is an explicit exception.

`map_select` without `focus` remains compatible with existing callers. Its success
acknowledges selection, not a completed Inspect data fetch. Existing selection and
panel components own loading/error states. Conversation remains mounted when the
tab switches. This change is local only, pending coordination; no push authorized.

## Main integration for publication — October 24, 2026

Carol requested commit and push of this chat's changes. The integration on remote main
`eed900a` preserves the newer English-only response policy, collapsed source/record
disclosure and per-block profile. All 24 block-profile choices now share map/chat state
through `map_set_view.block_metric`; null clears it and omitted values preserve the
manual choice. Metric metadata is shared without importing browser data access into tools.

The integrated Agent/Insights suite passed **131 tests**, with 19 conditional skips and
zero failures; five repository tests also passed. Scoped lint, production build/TypeScript,
secret scanning and whitespace checks passed. A real-model browser turn selected
People per km² in the original controls, retained points plus heatmap, read live Insights,
answered in English and left sources collapsed; no console errors were captured.
All log content from both histories was preserved, including both sides of conflict
markers that had already reached upstream. This validates the integrated local build;
production deployment status must be checked separately from Git publication.

## Shared map controls and Insights — October 24, 2026

This local follow-up on `3599998` supersedes the older map-control limitations below.
The original map and chat now share every actual category/context layer, date range,
report status, points/heat/both display, nearby-record visibility, forecast period,
site neighborhood and current viewport. Manual changes travel with the next message.
Highlights render for loaded incidents or visible sites; tool results state that scope.
Map changes reveal Assess controls, while site-queue filtering reveals Act.

`get_insights` reads the same `insights_summary` RPC and parser as the panel, including
findings, forecast, costs and exploratory prices, plus its dated historical research.
It preserves sources, missing sections and uncertainty, and identifies stored results
as study-wide rather than recomputed for the current map. Forecast comparison uses
the panel's shared calculation: better hotspot ranking can coexist with worse count
accuracy. This does not implement every individual P1 tool listed in the older audit.

- Agent/Insights suite: **130 passed, 0 failed, 19 environment/export-dependent checks skipped**; five repository regression tests also passed.
- Scoped ESLint, production build (including TypeScript), secret scanner and diff whitespace checks passed. Existing Atkinson fallback warnings remain.
- Real-model browser flow with connected data verified category/date/status changes, original map controls, contextual layers, forecast dates and Insights citations. A manual status change was recognized by the next message.
- The final model response correctly distinguished hotspot capture (about 65% versus 54%) from count MAE (0.073 versus 0.071, worse). No browser console errors were captured; the existing `wood-pattern` sprite warning remains.
- Local preview: `http://127.0.0.1:3046`. No push, deployment, credential change, migration or shared database write was performed in this follow-up. Earlier deployment observations below are historical, not a fresh production check.

## Final integration check — October 24, 2026

Rebased the Agent follow-up onto local main `7d74d6b`, retaining the working Gateway
default, exact-count/breakdown safeguards, Piper chat UI and Insights improvements.
Only documentation conflicted; every existing main/Agent log entry was preserved.

- **62 local tests passed**, 7 live checks skipped in that no-env run. Mocks/fixtures/store only.
- **6 shared-DB checks passed, 0 failed, 1 skipped** in the post-rebase run. `what_worked` remains blocked by empty `action_outcomes`; no retry was needed in this final run. Earlier timeout evidence below remains historical.
- TypeScript, scoped ESLint and production build passed. Build retains the existing Atkinson font-fallback warning.
- Current SELECT snapshot: sites, active sites, action_outcomes, base_rates and correlations all zero. Analytics A's latest log (`62b22c1`) reports its Python refresh blocked by pooler password authentication. This front did not run writers or migrations.
- Public `https://piper-app.vercel.app/api/chat` returned HTTP 200 with `configured:false`, `data:live`, and `AI_GATEWAY_API_KEY is not set`. The deployed chat is **not operational** until its environment is configured and redeployed.
- The configured deployment project is `piper` under team `bruno-team3`. Vercel project access returned 403; the team-consent helper returned 404 by both known id and slug. No production configuration could be changed from this connection.

The validated Agent code is ready for the authorized local main integration. Publication
still follows the repository's human-push workflow. Local env values are not deployed by Git.

## Other integrated validation — October 24, 2026

Evidence inherited from the main integrator; current Agent validation follows.

- Gateway default: `openai/gpt-4.1-mini`, verified with the configured API key and free credits. `MODEL_ID` still overrides it. Sonnet 5.5 returned HTTP 403 for that free-credit account.
- A real browser conversation called `search_incidents`, streamed a Portuguese answer and rendered source links. For October 1–24, the answer was 658 rodent reports: 563 Boston, 54 Somerville, 41 Cambridge; 78 open and 580 closed. An independent query fetched all 658 unique IDs and matched the total. The corresponding Boston local-day window also counted 658 at validation time.
- One recent report from each city was checked against its official public API: `311:101006765523`, `som311:1646106`, `camrod:23087338`. IDs, status and opening timestamps matched after local-to-UTC conversion. This is a source sample, not certification of every upstream record.
- Search status/category/action breakdowns cover the fetched sample, not necessarily every match. The tool now labels that scope and the prompt requires separate status-filtered searches for exact population totals.
- Shared-DB suite: 5 passes, 1 failure and 1 skip. The health check fails because `grid_cells` returns HTTP 500 / PostgreSQL `57014` (statement timeout), even for one ID. `what_worked` is skipped because `action_outcomes` is empty. Search, geocode/drivers, exact site histories, provisional Due IDs and unsaved drafts passed.
- Combined-tree validation: 105 local tests passed, 19 environment/export-dependent checks skipped; 4 secret-scanner regression tests passed; production build, TypeScript, scoped ESLint and design-token checks passed. In the integrated Piper browser, the model made three searches and correctly answered 658 total, 78 open and 580 closed, matching the independent database counts.
- Remote Piper UI is integrated with the working chat. Insights retains both the live panel and the remote historical research cards; historical cards appear when the live endpoint is unavailable or errors and remain explicitly labelled as snapshots.
- No credentials, migrations or database writes are part of this change. Vercel still needs its own server-side Gateway credential; local `.env.local` is not deployed by Git.

## Scope audit (Oct 24, after real-model validation)

Re-read `docs/rat-audit/TEAM.md`, `CONTRACT.md`, the rat-audit requirements/design/tasks,
v2 proposal, data audit, repository steering, and this front's code/log. Carol also owns
Analytics and Insights, but those are separate worktrees; this audit does not certify them.
The latest adapter changes target A's v2 handoff at `cae4faa`; populated shared v2 data still needs validation.

| Task | Agent implementation and evidence | Remaining limitation |
|---|---|---|
| 4.1 P0 | Gateway / Anthropic / Bedrock switch; missing-provider state; unit tests and actual GET/POST checks | Gateway with configured `MODEL_ID` verified locally; Anthropic/Bedrock live and production env not verified |
| 4.2 P0 | Eight core server tools; tool-only answers, privacy, no-rodenticide and unsaved-draft rules; malformed messages return 400 using SDK validation | Shared Analytics outputs empty at last check; v2 Due covered by fixtures and installed SQL with synthetic records |
| 4.3 P0 + mode P1 | All listed client-tool schemas/executors; current selection/view/mode context; actual store regression tests; forecast store wiring now in main | Highlight, non-forecast layer toggles, category/status filters and visible bbox still need Map/integrator work; depth removed by main |
| 4.4 P0 | Streaming UI, steps, feature/source chips, starters, labelled controls and aria-live; source cadence plus retrieval time in Boston timezone | Real-model conversation, sources, Act and map movement verified at 1280×720; mobile not certified |
| 4.5 P1 | **Not implemented:** get_findings, forecast, price_impact, events_near, compare_areas, get_trial, base_rates, area_stats | Keep pending; P0 integration comes first. `map_show_forecast` is a client toggle, not the missing forecast data tool |
| 4.6 P0 | 61 local tests (mock model/HTTP, fixtures, store); real Gateway/browser flow; shared-DB checks detailed below | `what_worked` blocked by empty outcomes; one DB timeout passed on isolated retry; populated v2 still pending |

Build/static checks are green; this is not a claim that every Carol task or the full product
acceptance flow is complete. Integration/deployment/submission tasks 5.x belong to the integrator.
No shared task checkboxes were marked complete by this front.

## Spec v2 handoff

`679a41c` contained none of the three newly requested items. They are included in this delivery:

- `due_sites`: filters before the limit and returns counts/citations. For `dbscan_50m_min3_v2`, recomputes Due at read time using Boston calendar days 0–60, a nonempty base-rate cohort and its threshold (default 0.5); excludes retired clusters. Shared results still use the explicitly **provisional** draft queue until active Analytics rows arrive.
- System prompt: "Never recommend rodenticide or poison"; past baiting can be reported as history. Recommendation outputs are filtered, and work-order drafts exclude baiting/pesticide actions and notes.
- `app_set_mode`: switches **Assess / Act** using the actual store and preserves selection; current mode travels with chat context. **No depth parameter:** main commit `01c2fa4` removed Simple/Explore (R0.5, design §7, store). Task 4.3, R8.11 and design §8 still mention depth and need integrator reconciliation.

Integrated into local `main` after Carol authorized the partial delivery. Agent commits `7551904` (original implementation) and `b30587c` (v2 and validation fixes) were rebased onto `e54370b`, which preserves the Insights integration and fetched remote main `50ed4bf`. All prior changes and log entries were preserved; recovery snapshots and stashes remain available. No push, deployment, migration or shared database write was performed. The published site will only change after a later push/deployment.

## Compatibility with Agent A's current v2 handoff

Read A's v2 implementation (`06081aa`) and RPC transition/forecast fix (`cae4faa`).
The Agent adapter now:

- Orders active v2 sites by current Due, returns in the last 12 months, reports, recency and id. Reads all matching lean pages before sorting/limiting, including when the server caps pages below the requested size.
- Hides the schema's placeholder score; exposes base rates as fractions, threshold and source citations. Stored rank is explicitly from the last Analytics refresh.
- Keeps retired history readable but excludes it from queues and work-order drafting. Existing draft IDs still resolve after Analytics becomes active.
- Fetches every supplied representative report ID in batches instead of truncating at 300; never expands an exact site list to the street.

During this pass, `base_rates`, `analytics_site_case(public.sites)` and `insights_summary()`
became present in the shared DB. `sites` and `action_outcomes` were still empty at the last
read. Installed SQL was checked with **synthetic CTE records, SELECT only**: day 60 eligible;
day 61, future closure, below-threshold rate and retired cluster ineligible. An actual anon
REST query accepted the new JSON projection, returning zero rows. These checks do **not**
validate a populated v2 queue or prove the Analytics refresh has run.

## Earlier compatibility evidence (legacy handoff, retained for context)

Checked `origin/feat/rat-audit-analytics-core` at `f410efe` (implementation `3884561`).
This is explicitly a **partial v2 handoff**, with address-based sites, no v2 Due flags,
and some recommendations containing baiting. Publishing the branch did not populate the
shared database. The subsequent main `75bb782` adds the forecast layer/control/cell card and
its store wiring; the Agent was rebased onto it before the final build and browser checks.

- Recommendations use `action_tag` as the identifier and `action` as display text. The Agent
  accepts this shape and the older identifier-in-`action` shape. Unsupported or pesticide/baiting
  recommendations remain omitted, with a caveat; historical actions remain readable.
- `get_site` uses `summary.timeline` report IDs from Analytics, instead of combining addresses
  on the same street. If the supplied history is capped or reports cannot be read, it labels
  the timeline and its action counts as partial; it never expands a supplied list to the street.
- `what_worked` preserves Wilson intervals, observation windows, censoring and year breakdowns
  when present, and cites the contributing `source_ids`. The adapter also reads the old aggregate
  schema without requiring A's migration.
- Those legacy sites lack `summary.due`. If that legacy output reaches the shared DB, `due_sites` will
  explicitly report `analytics_not_computed` until task 2.19 runs, rather than return an empty success.

Real-data compatibility check: SELECT-only access to A's existing `rat-analytics-real` PostGIS
container (`default_transaction_read_only=on`), then the Agent's in-memory adapter over the
persisted public rows. **4 sites / 152 incident rows / 13 outcome tags** were checked; exact
site timelines and outcome intervals/source IDs matched. **8** permitted recommendations
produced unsaved drafts; **2** baiting recommendations were omitted. This used real local
outputs, not synthetic fixtures, but did **not** exercise Supabase's REST adapter or an LLM.
The 60-report truncation path was verified with fixtures; none of these four real sites was capped.
The temporary verifier is `/tmp/rat-agent-a-readonly-check.mts`; no repository files were added.

## Layout

| File | What it does |
|---|---|
| `provider.ts` | `MODEL_PROVIDER` = `gateway` (default) \| `anthropic` \| `bedrock`, with an optional `MODEL_ID`. Returns `null` / "not configured" instead of throwing when credentials are missing (R8.9). |
| `chat.ts` | `createChatHandler(deps)` validates message/tool inputs, returns 400 for malformed history, then runs `streamText`, with server tools, client tools, the system prompt and `stopWhen: stepCountIs(8)`. It returns a UI message stream. |
| `../../app/api/chat/route.ts` | `POST` is the chat handler. `GET` returns `{configured, provider, data}`, which the panel uses to show "Assistant not configured". |
| `tools/server.ts` | The tools `geocode`, `search_incidents`, `top_sites`, `due_sites`, `get_site`, `nearby_drivers`, `what_worked` and `draft_work_order`. Each returns `{ok, data, sources, features, caveats}` or `{ok:false, error}`. |
| `geocoder.ts` | Named places (including MIT) resolve through local `places` first, then Photon/OpenStreetMap within Greater Boston; report-derived street lookup remains the fallback. Photon requests are bounded, timed out after 5 seconds and cached for a day (200 entries). Exact name matches take priority. OSM citations describe location only, never incident evidence. The public service is intended for modest traffic and has no availability guarantee. No extra API key is needed. |
| `tools/client.ts` | Schemas for `map_fly_to`, `map_set_layers`, `map_set_filters`, `map_highlight`, `map_select`, `map_show_forecast`, `open_panel` and `app_set_mode`, plus `executeClientTool` (runs them on the map store). |
| `context.ts` | `{selection, view, bbox, filters, layers, mode}` sent with each message (R8.5) and validated on the server. |
| `prompt.ts` | System prompt rules: answer from tools, cite sources, show the map, no names or house numbers, draft but never decide. |
| `data/` | `AgentData` interface. `supabase.ts` is the live adapter (anon key, read-only through RLS). `memory.ts` is for tests only. |
| `ui.ts` | Tool-step labels, source / feature chip collection and source update cadence / Boston retrieval-time labels for `ChatPanel`. |

## Env (server)

- `MODEL_PROVIDER`: `gateway` | `anthropic` | `bedrock`
- `MODEL_ID`: optional. Defaults: `openai/gpt-4.1-mini` (gateway), `claude-sonnet-5-5` (anthropic), `us.anthropic.claude-sonnet-5-5` (bedrock).
- gateway: `AI_GATEWAY_API_KEY` locally. On Vercel, `VERCEL_OIDC_TOKEN` is injected.
- anthropic: `ANTHROPIC_API_KEY`
- bedrock: `AWS_REGION` plus either `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` or `AWS_BEARER_TOKEN_BEDROCK`
- data: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Without them every tool returns `ok:false` ("Live data is not configured"). Fixture data is never used as a fallback.

## Tests

```bash
cd web
npx -y tsx@4.20.6 --test src/lib/agent/__tests__/*.test.ts
# live, read-only (skips without env):
npx -y tsx@4.20.6 --env-file=.env.local --test src/lib/agent/__tests__/live.test.ts
```

The tests use `node:test`, so the shared `package.json` and the typecheck are unaffected. Integrator, optionally: add `"tsx": "4.20.6"` to devDependencies and the script `"test:agent": "tsx --test src/lib/agent/__tests__/*.test.ts"`.

## Validation status (Oct 24, after migrations began)

| Check | Result |
|---|---|
| Model/environment | Shared ignored env symlink now supplies a working Gateway credential; configured `MODEL_ID` override. No value exposed or key copied/changed. Production env/deployment not checked. |
| Local tests | **61 passed, 0 failed, 7 live skipped** (68 total). Fixtures, mocked HTTP/model and actual store; these are not live-model tests. |
| Shared DB, read-only | Before edits: 6 passed, 1 skipped. After v2 adapter edits: **5 passed, 1 failed with a database statement timeout, 1 skipped**. The single failing site-tools test passed on one isolated retry. This is not a clean full-suite rerun. `what_worked` remains skipped because `action_outcomes` is empty. |
| Production build/static checks | Final `pnpm build`, TypeScript and scoped ESLint passed on the Agent branch. |
| Real model + real DB through handler | HTTP 200; `search_incidents` returned exactly **30** Normandy St rodent reports from 2025-01-01 through 2026-10-24, matching the independent count. Answer cited Boston 311 2025/2026; no stream errors. No model or DB mocks. |
| Real browser on final local build | At 1280×720: Ask accepted the prompt; actual model switched to Act, counted 30, moved the map, rendered the answer and source/feature chips. After the visual-status fix, it correctly stated that highlighting is unavailable. No captured console warnings/errors. No approval or DB write. |
| V2 evidence | Mock pagination/date-boundary/history tests passed. Installed SQL function passed SELECT-only synthetic cases; actual anon REST projection readable but empty. **Populated real v2 queue/outcomes remain unvalidated.** |
| Shared snapshot during this pass | sources 49; incidents 303,421; places 12,897; events 331; grid_cells 3,442; predictions 206,520; sites/action_outcomes/correlations 0. Concurrent ingestion/migrations may change these counts. |

The browser exposed a false success claim for highlighting: the store accepted ids but
MapView did not render them. Client tools now return `rendered:false` with an explicit caveat
for highlight, non-forecast layers and category/status filters; the prompt prohibits claiming
those visual changes succeeded. Date-only filters and forecast remain supported. The final
real-model browser run verified the highlighting caveat; other unsupported controls have
local regression coverage, not separate live-model conversations.

While active Analytics sites are absent, the adapter uses the map's read-only draft queue
and detail RPCs, flagged **provisional**. Raw notes are not mapped. Actual query/permission
failures remain errors, not an empty successful answer.

`web/.env.local` links to `/Users/mcarolinaporto/Projetos/hackachusetts/.env.local` and is
ignored. Next loads it from `web/`; standalone live tests require `--env-file=.env.local`.
The earlier no-key blocker is resolved **locally**; historical log entries remain unchanged.

The first validation above used the Agent worktree based on `8a1caaa`; the final integration
check at the top supersedes its Git/test status. No new repository files, dependencies, shared-file
edits, migration execution, shared DB writes, push or deployment were introduced by this follow-up.

## Remaining blockers (exact change → owner)

| Blocks | Change | Owner |
|---|---|---|
| Deployed-model chat | Local key works; verify model configuration and a real conversation in the deployed environment | Carol / integrator |
| `what_worked` | Fill `action_outcomes` (task 2.4); closure classifier (2.2) — the checked Normandy cases still have unknown action tags | Analytics (Carol, analytics-core) |
| Populated v2 Due | Run the reviewed Analytics refresh and validate Agent results against the populated queue; installed schema alone is insufficient | Analytics / Agent validation |
| V2 sites + recommendations in shared DB | Populate active clusters and outcomes; v2 has queue priority, not a composite score | Analytics |
| Populated v2 Inspector flow | Validate current cluster IDs across site_queue, site_detail and queries.ts after the refresh | Map / integrator |
| `map_highlight` visible | MapView reads `useMap(s => s.highlight)` and styles those ids | Gui (map) |
| Non-forecast `map_set_layers` visible | MapView/LayerPanel must use store `layers` for these toggles (still local `useState`). Forecast is now wired to store `layers.forecast` / `forecastWeek` and its UI renders | Gui (map) |
| `map_set_filters` categories/status | MapView applies `filters.categories` / `filters.status` | Gui (map) |
| "here" / bbox context | `bounds` + `setBounds` in map-store; MapView calls it in `load`/`moveend` (it already computes the bbox) | integrator (map-store) + Gui (MapView) |

## Contract changes for the integrator (shared files, not edited here)

1. **`map-store.ts`: visible bounds (needed for "here" / bbox context, R8.5).** This is the minimal change:
   ```ts
   // MapState
   bounds: [number, number, number, number] | null;   // [minLon, minLat, maxLon, maxLat]
   setBounds: (b: [number, number, number, number] | null) => void;
   // initial state
   bounds: null,
   setBounds: (bounds) => set({ bounds }),
   ```
   MapView (Gui) calls `setBounds(map.getBounds().toArray().flat())` on `load` and `moveend`. `buildMapContext` already reads `state.bounds`. Until then `bbox` is `null` and the prompt says the bounds are unknown. Bounds are never estimated from center and zoom.
2. **`map-store.ts`: `select()`** always switches the panel to `inspector`. That is correct for feature chips and "Review in Inspect". No change needed.
3. No new packages. Every import (`ai`, `@ai-sdk/*`, `zod`, `@supabase/supabase-js`) is already in `package.json`.

## Not done / depends on others

- MapView consumes `flyToTarget`, selection and now forecast state. Highlight, non-forecast layers, category/status filters and visible bounds remain integration gaps. Mode change and fly-to were verified with the real model; unsupported visual tools now report their limitation.
- Provisional `get_site` timelines use exact report IDs from `site_detail`; Analytics timelines use `summary.timeline` IDs. Only legacy Analytics rows without that list retain the explicit street-block grouping caveat.
- Populated v2 sites/recommendations and real action outcomes await the Analytics refresh. Provisional sites work now. Forecast rows exist, but P1 forecast tools are outside this front’s current implementation.
- `closure_note` is never sent to the model until the name scrub (1.11) lands.


### Temporary ranked-region map focus (local)

After a top-N answer, `map_focus_regions` receives exactly the returned region IDs,
published ranks and complete member-cell IDs. The browser reads only the requested `grid_cells` geometries, decodes PostGIS EWKB
(SRID 4326), dissolves member cells per region,
and draws numbered outlines plus an outside mask. Missing any member geometry fails
without replacing the previous focus. No guessed rectangles or partial boundaries.
The map fits all regions; clicking an outline or rank marker selects its anchor cell
through existing Inspect. Clear highlight removes only the overlay, preserving dates,
categories and status. The current camera is retained when clearing. Overlapping
regions retain their own rank buttons. No shared schema changes or push.

Region highlight lifecycle: manual pan/zoom and discussion retain the overlay. Chat navigation via map_fly_to clears it; map_select retains it only for a highlighted region ID. Another ranking replaces it, and Clear highlight removes it. Clears invalidate pending boundary loads. The automatic ranking fallback repairs individual fly-to calls within a ranking response by fitting all returned regions together. A successful explicit focus/clear or selection after that ranking takes precedence. A later navigation-only response has no ranking to restore.

Each question includes focusedRegions (current outlined IDs and ranks; [] after clearing), separate from historical tool outputs. Repeated top/worst ranking requests must run rank_regions and map_focus_regions again; changed counts/filters trigger a fresh ranking. "Show those same regions again" may reuse known member IDs but must execute a new focus action. Past navigation is never proof of the current viewport or overlay.

Ranking direction: rank_regions accepts order highest (default) or lowest for severity, people, and benefit. In a severity conversation, best means lowest published severity and never adds a population threshold. Least-severe results retain their published ranks and describe only the published priority-region set; a truncated severity set cannot answer its missing least-severe tail.

Map marker numbers are result positions 1..N, including best/filtered rankings. focusedRegions carries position alongside stable ID and published rank; references such as “open #1” resolve the displayed position, not the citywide severity rank.
