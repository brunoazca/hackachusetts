---
inclusion: always
---

# Tech — conventions and stack

> Update this once the stack is chosen. Defaults below favor a fast, judge-friendly
> web demo. Change freely — this file steers Kiro on every task.

## Stack (decided Oct 24)
- Language/runtime: TypeScript (Node 24) for the app; Python 3.12 via `uv` for the data pipeline.
- Framework: Next.js 16 App Router in `web/` (read `web/node_modules/next/dist/docs/` before Next-specific code).
- Map: MapLibre GL via `react-map-gl/maplibre`, OpenFreeMap basemap.
- Styling/UI: Tailwind 4; recharts for small charts.
- Data: **live** Supabase Postgres + PostGIS (project `rat-audit`). The browser reads through read-only RPCs; writes only via service role (pipeline, `/api/refresh`) and the `decisions` insert.
- Agent: Vercel AI SDK v7; `MODEL_PROVIDER` = gateway | anthropic | bedrock.
- Deploy: Vercel, root directory `web/`, daily cron for `/api/refresh`.
- Spec: `.kiro/specs/rat-audit/`. Track ownership: `docs/rat-audit/CONTRACT.md`.

## Rules for every change
- Keep the demo path working at all times. A broken build on submission day loses.
- Live data from Supabase on the demo path. Every fact cites a `sources` row (name, URL, retrieved time).
- Accessibility is a scored requirement: semantic HTML, labels, focus order, contrast.
- No secrets in the repo. Use `.env.local`, keep it git-ignored, document required vars.
  The repo is PUBLIC: run `python3 .kiro/scripts/scan_secrets.py` before committing
  (the `secret-scan` hook and `.githooks/pre-commit` do it for you). Never print a
  secret in chat, a commit, a log entry, or the demo video.
- Small, reviewable commits. The commit history is evidence of real work.
- We work directly on `main`. No feature branches, no pull requests — this is a
  one-day hackathon. Commit small and push straight to `main`.
  (Note: the Kiro agent cannot push to `main` itself; it prepares the commit on
  `main` and a human runs `git push origin main`.)
- The Kiro agent is BLOCKED by a safety policy from pushing to `main` (and any
  protected branch). This cannot be turned off by a file or setting. The agent
  stages and commits on `main`; a human always runs `git push origin main`.
  Do not ask the agent to retry the push — it will be refused every time.

## Commands (fill in)
- Install: _TBD_
- Dev: _TBD_
- Build: _TBD_
- Test: _TBD_
- Lint: _TBD_

## Testing
- Add a test when you add a feature or fix a bug.
- At minimum, one end-to-end check of the demo's happy path.
