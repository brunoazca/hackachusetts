# Rat Audit — who builds what (Oct 24)

Four tracks from `CONTRACT.md`, one owner each so nobody edits the same file.
Do every **P0** before any **P1**. Keep `main` deployable; commit small.

## Owners

| Person | Track | Owns (paths) | Tasks |
|---|---|---|---|
| **Bruno** | Data + Models | `pipeline/rat_audit/ingest/**`, `pipeline/rat_audit/model/**`, `web/src/app/api/refresh/**`, `web/vercel.json`, `supabase/migrations/*_data_*.sql` | 1.1–1.11, 2.6 (forecast), 2.11 (recurrence) |
| **Carol** | Analytics + Agent | `pipeline/rat_audit/analytics/**`, `web/src/components/insights/**`, `web/src/app/api/chat/**`, `web/src/components/chat/**`, `web/src/lib/agent/**`, `supabase/migrations/*_analytics_*.sql`, `*_agent_*.sql` | 2.1–2.5, 2.7–2.9, 2.12–2.14, 4.1–4.6 |
| **Gui** | Map + Inspector (UI/product) | `web/src/components/map/**`, `web/src/components/inspector/**`, `web/src/components/shell/TopBar.tsx`, `web/src/lib/queries.ts`, `supabase/migrations/*_api_*.sql` | 3.1–3.14 |
| **Kiro** | Integration | shared files only (`page.tsx`, `SidePanel.tsx`, `map-store.ts`, `supabase.ts`, `package.json`), merge, deploy prep, submission docs | 5.1–5.7 |

## Build order (the dependencies)

```
Bruno: load 311 into Supabase        ← everything waits on this
   │
   ├─► Carol: grid_cells + sites + closure action_tag + correlations
   │         │
   │         └─► Bruno: forecast model (trains on Carol's grid/sites)
   │                   └─► Carol: Insights panel reads model output
   │
   └─► Gui: RPCs + MapView + SiteCard (reads incidents + sites)
            └─► Carol: agent client tools drive Gui's map store
```

So: **Bruno first (311 load)**, then Carol + Gui in parallel, model + insights last.

## Rules

- No secrets in the repo. Token lives in `.env.local` (git-ignored). Run
  `python3 .kiro/scripts/scan_secrets.py` before any commit.
- Live data from Supabase on the demo path; if 311 ingest isn't done, seed from
  `data/civic/` CSVs and label the badge "seeded", not "live" (R1.1).
- A human pushes to `main` — the Kiro agent is blocked from pushing.
- Log real work in `.kiro/KIRO_LOG.md` (or `.kiro/klog.sh`).
