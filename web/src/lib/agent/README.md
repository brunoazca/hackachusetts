# Agent track: `/api/chat`, `lib/agent`, `components/chat`

Tasks 4.1–4.4 and 4.6. P1 tools from task 4.5 are not implemented here.

## Layout

| File | What it does |
|---|---|
| `provider.ts` | `MODEL_PROVIDER` = `gateway` (default) \| `anthropic` \| `bedrock`, with an optional `MODEL_ID`. Returns `null` / "not configured" instead of throwing when credentials are missing (R8.9). |
| `chat.ts` | `createChatHandler(deps)` runs `streamText`, with server tools, client tools, the system prompt and `stopWhen: stepCountIs(8)`. It returns a UI message stream. |
| `../../app/api/chat/route.ts` | `POST` is the chat handler. `GET` returns `{configured, provider, data}`, which the panel uses to show "Assistant not configured". |
| `tools/server.ts` | The tools `geocode`, `search_incidents`, `top_sites`, `get_site`, `nearby_drivers`, `what_worked` and `draft_work_order`. Each returns `{ok, data, sources, features, caveats}` or `{ok:false, error}`. |
| `tools/client.ts` | Schemas for `map_fly_to`, `map_set_layers`, `map_set_filters`, `map_highlight`, `map_select`, `map_show_forecast` and `open_panel`, plus `executeClientTool` (runs them on the map store). |
| `context.ts` | `{selection, view, bbox, filters, layers}` sent with each message (R8.5) and validated on the server. |
| `prompt.ts` | System prompt rules: answer from tools, cite sources, show the map, no names or house numbers, draft but never decide. |
| `data/` | `AgentData` interface. `supabase.ts` is the live adapter (anon key, read-only through RLS). `memory.ts` is for tests only. |
| `ui.ts` | Tool-step labels and source / feature chip collection for `ChatPanel`. |

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
NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npx -y tsx@4.20.6 --test src/lib/agent/__tests__/live.test.ts
```

The tests use `node:test`, so the shared `package.json` and the typecheck are unaffected. Integrator, optionally: add `"tsx": "4.20.6"` to devDependencies and the script `"test:agent": "tsx --test src/lib/agent/__tests__/*.test.ts"`.

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

- Live validation against Supabase has not run: no credentials were available in this workspace.
- The end-to-end map integration (fly/highlight/select visibly on MapLibre) depends on MapView (3.2) consuming `flyToTarget`, `highlight` and `selection` from the store. It is not verified here.
- `get_site` groups the timeline by `address_block`. A site `address_key` column or a `site_detail` RPC (3.1) would make it exact.
- `top_sites` and `what_worked` return nothing until analytics tasks 2.3 and 2.4 fill `sites` and `action_outcomes`.
- `closure_note` is never sent to the model until the name scrub (1.11) lands.
