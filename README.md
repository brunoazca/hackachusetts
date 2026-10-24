# Hackachusetts 2026 — Civic Action

One useful Massachusetts civic workflow: a resident finishes one concrete public
service task end to end, with authoritative cited evidence, an accessible UI, and
a clear human decision point before any action.

> Status: scaffolding. Stack and app code land under `src/` on day one.

## What it is
_<One sentence once the service is chosen — see `docs/submission/description.md`.>_

## Run it
_<Fill in from `.kiro/steering/tech.md` once the stack exists.>_
```bash
# install
# dev
# build
# test
```

## How we used Kiro
This project is spec-driven with Kiro. Real work lives in `/.kiro`:
- `/.kiro/steering/` — always-on product, tech, and structure guidance.
- `/.kiro/specs/civic-service/` — requirements, design, tasks (rename to the chosen feature).
- `/.kiro/hooks/` — automated accessibility and demo-path checks on save.
- `/.kiro/agents/civic-judge.json` — a judge-style reviewer agent.
- `/.kiro/settings/mcp.json` + `/.kiro/mcp/` — MCP servers Kiro uses while building:
  the **City of Boston's own [OpenContext](https://github.com/CityOfBoston/OpenContext)**
  (data.boston.gov and MassGIS, through a small stdio bridge), SQL over our committed
  data snapshots, live MBTA, AWS docs, and Playwright for UI checks.
  Check them all with `python3 .kiro/scripts/check_mcp.py` (needs `python3`, `uv`, `node`).
  Cambridge/Somerville need a free token in `.env.local` (copy `.env.example`);
  all sources are listed in `knowledge/live_data_sources.md`.

Full write-up: `docs/submission/kiro-usage.md`.

## Data & evidence
Uses a committed, cited data snapshot (no live API on the demo path). Source and
retrieval date are documented in-product and in the snapshot file.

## Accessibility
Keyboard operable, screen-reader labels, WCAG AA contrast — a scored requirement.

## Repo layout
See `/.kiro/steering/structure.md`.

## License
_<Choose one (MIT is simple and judge-friendly).>_
