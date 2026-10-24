# Agent track: `/api/chat`, `lib/agent`, `components/chat`

This worktree owns tasks 4.1–4.6. Core tasks 4.1–4.4 and 4.6 are implemented with the validation limits below, including v2 `due_sites` and `app_set_mode`. Task 4.5 remains unimplemented P1 work; the whole Agent track is not being marked complete.

## Scope audit before integration

Re-read `docs/rat-audit/TEAM.md`, `CONTRACT.md`, the rat-audit requirements/design/tasks,
v2 proposal, data audit, repository steering, and this front's code/log. Carol also owns
Analytics and Insights, but those are separate worktrees; this audit does not certify them.
A's published analytics handoff remains partial, as described below.

| Task | Agent implementation and evidence | Remaining limitation |
|---|---|---|
| 4.1 P0 | Gateway / Anthropic / Bedrock switch; missing-provider state; unit tests and actual GET/POST checks | Real provider call blocked by absent credentials |
| 4.2 P0 | Eight core server tools; tool-only answers, privacy, no-rodenticide and unsaved-draft rules; malformed messages return 400 using SDK validation | Shared Analytics tables empty; Due uses the explicitly provisional draft rule |
| 4.3 P0 + mode P1 | All listed client-tool schemas/executors; current selection/view/mode context; actual store regression tests; forecast store wiring now in main | Highlight, non-forecast layer toggles, category/status filters and visible bbox still need Map/integrator work; depth removed by main |
| 4.4 P0 | Streaming UI, steps, feature/source chips, starters, labelled controls and aria-live; source cadence plus retrieval time in Boston timezone | Browser verified the no-provider state in both modes at 1280×800; live-model streaming and mobile not certified |
| 4.5 P1 | **Not implemented:** get_findings, forecast, price_impact, events_near, compare_areas, get_trial, base_rates, area_stats | Keep pending; P0 integration comes first. `map_show_forecast` is a client toggle, not the missing forecast data tool |
| 4.6 P0 | 55 local tests (mock model/HTTP, fixtures, store); 6 shared-DB passes; A's real local outputs checked separately | 1 shared-DB check blocked (`what_worked`); real-model end-to-end chat not validated |

Build/static checks are green; this is not a claim that every Carol task or the full product
acceptance flow is complete. Integration/deployment/submission tasks 5.x belong to the integrator.
No shared task checkboxes were marked complete by this front.

## Spec v2 handoff

`679a41c` contained none of the three newly requested items. They are included in this delivery:

- `due_sites`: reads the database Due flag, filters before the limit, returns counts and citations. Current live results use the draft queue and explicitly say **provisional**; the v2 base-rate threshold remains Analytics task 2.19.
- System prompt: "Never recommend rodenticide or poison"; past baiting can be reported as history. Recommendation outputs are filtered, and work-order drafts exclude baiting/pesticide actions and notes.
- `app_set_mode`: switches **Assess / Act** using the actual store and preserves selection; current mode travels with chat context. **No depth parameter:** main commit `01c2fa4` removed Simple/Explore (R0.5, design §7, store). Task 4.3, R8.11 and design §8 still mention depth and need integrator reconciliation.

Prepared for the authorized local integration: rebased on fetched `origin/main` `a78765f`; the original Agent commit is now `106ad71`. All local changes and both histories of log entries were preserved, with a recovery snapshot and stash retained. This delivery includes the v2 and validation fixes. Publication, deployment and migrations remain outside this integration.

## Compatibility with Agent A's published branch

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
- A's current sites lack `summary.due`. Once those sites reach the shared DB, `due_sites` will
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
| `tools/client.ts` | Schemas for `map_fly_to`, `map_set_layers`, `map_set_filters`, `map_highlight`, `map_select`, `map_show_forecast`, `open_panel` and `app_set_mode`, plus `executeClientTool` (runs them on the map store). |
| `context.ts` | `{selection, view, bbox, filters, layers, mode}` sent with each message (R8.5) and validated on the server. |
| `prompt.ts` | System prompt rules: answer from tools, cite sources, show the map, no names or house numbers, draft but never decide. |
| `data/` | `AgentData` interface. `supabase.ts` is the live adapter (anon key, read-only through RLS). `memory.ts` is for tests only. |
| `ui.ts` | Tool-step labels, source / feature chip collection and source update cadence / Boston retrieval-time labels for `ChatPanel`. |

## Env (server)

- `MODEL_PROVIDER`: `gateway` | `anthropic` | `bedrock`
- `MODEL_ID`: optional. Defaults: `anthropic/claude-sonnet-5.5` (gateway), `claude-sonnet-5-5` (anthropic), `us.anthropic.claude-sonnet-5-5` (bedrock).
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

## Validation status (Oct 24, `feat/rat-audit-agent`, rebased on main a78765f)

| Check | Result |
|---|---|
| Env loaded by app + test process | Supabase URL/anon key: yes. Model credential: **none → real-model chat BLOCKED** |
| Local tests (fixtures, mock model/HTTP, real Zustand store) | **55/55 pass**; no real model calls |
| Live read-only (`live.test.ts`, `--env-file=.env.local`) | **6 passed, 1 skipped/blocked**, no failures or retries in the final run. `what_worked` is blocked by empty `action_outcomes`. Normandy St: 30 reports since 2025 = direct count; exact 19 site report IDs match `site_detail`; draft `saved=false`; area filter matches 2 sites; 10 Due IDs match the independent query and are explicitly provisional. The earlier transient timeout remains recorded in the log |
| Table states (read-only observation) | sources 49; incidents 303,421; places 12,897; events 331; grid_cells 3,442; predictions 206,520. sites, action_outcomes, correlations remain empty |
| Local build / static checks | Next build, TypeScript, scoped ESLint passed |
| Earlier browser check, build on main 75bb782 | In-app browser at 1280×800: Ask reachable in Assess and Act; "Assistant not configured", labelled disabled input/send; real map/queue data visible; forecast control shows weeks/legend. No browser warnings/errors captured. No model call, approval or DB write |
| Actual local API + source metadata | GET `/api/chat` 200, configured=false, data=live; POST 503 `not_configured`. Two real source rows resolve with valid cadence/retrieval metadata |

Sites: while the Analytics `sites` table is empty, the adapter uses the map track's draft queue
(`site_queue`, its underlying `draft_sites`, and `site_detail`, migration `20261024300002`), flagged **provisional**, no score; raw notes are not mapped. Area, neighborhood and text filters run in the database before the limit. Permission, connection and query failures keep their actual reason; only an empty queue or absent optional RPC means unavailable.

`web/.env.local` already links to `/Users/mcarolinaporto/Projetos/hackachusetts/.env.local`
and is git-ignored. Next loads it from `web/`; tests need `--env-file=.env.local`.
Only presence was checked, never values. No key was copied or changed.
The suites contain 62 tests: 55 local passed; the 7 shared-database checks run separately as reported above. The real-model chat remains blocked by absent credentials. Browser checks cover the no-provider state and current map/forecast UI, not a model-driven conversation.

## Remaining blockers (exact change → owner)

| Blocks | Change | Owner |
|---|---|---|
| Real-model chat | Put `MODEL_PROVIDER` + key (e.g. `AI_GATEWAY_API_KEY`) in the shared `.env.local` and in Vercel env | Carol / integrator |
| `what_worked` | Fill `action_outcomes` (task 2.4); closure classifier (2.2) — the checked Normandy cases still have unknown action tags | Analytics (Carol, analytics-core) |
| Base-rate Due semantics | Compute base_rates and sites.summary.due (task 2.19); A's published branch does not implement these flags. Current draft Due is provisional | Analytics |
| Scored sites + recommendations in shared DB | Fill `sites` (task 2.3); Agent compatibility with A's current output is validated locally, but its v2 clustering/legal-lane work remains incomplete | Analytics |
| Analytics site selection in Inspector | A uses `site_<address_key-prefix>` IDs; main's `site_detail`/`queries.ts` still serve draft IDs. Align the Inspector's site source before enabling the populated Analytics path | Map / integrator |
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

- MapView consumes `flyToTarget`, selection and now forecast state. Highlight, non-forecast layers, category/status filters and visible bounds remain integration gaps. A model-driven map conversation cannot be verified without credentials.
- Provisional `get_site` timelines use exact report IDs from `site_detail`; Analytics timelines use `summary.timeline` IDs. Only legacy Analytics rows without that list retain the explicit street-block grouping caveat.
- Scored sites/recommendations and real action outcomes remain blocked on analytics tasks 2.3/2.4. Provisional sites work now. Forecast rows exist, but P1 forecast tools are outside this front’s current implementation.
- `closure_note` is never sent to the model until the name scrub (1.11) lands.
