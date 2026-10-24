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
  all sources are listed in `knowledge/23_live_data_sources.md`.

Full write-up: `docs/submission/kiro-usage.md`.

## Data & evidence
Uses a committed, cited data snapshot (no live API on the demo path). Source and
retrieval date are documented in-product and in the snapshot file.

## Accessibility
Keyboard operable, screen-reader labels, WCAG AA contrast — a scored requirement.

## Repo layout
See `/.kiro/steering/structure.md`.

## Secrets & safety (public repo)
- Secrets live only in `.env.local` (git-ignored; template `.env.example`). Share it through a private channel.
- `python3 .kiro/scripts/scan_secrets.py` scans the repo; the `secret-scan` Kiro hook runs it on save.
- Turn on the git pre-commit block once per clone: `git config core.hooksPath .githooks`.
- `bash .kiro/audit/sync-audit-log.sh` writes `.kiro/audit/audit.log`, a **sanitized** excerpt of the Kiro Crew audit log (this repo only, no outputs, secrets redacted). It is git-ignored by `*.log`; to publish it, add `!.kiro/audit/audit.log` to `.gitignore`.
- `python3 .kiro/scripts/check_submission_ready.py` checks artifacts plus secrets, MCP health and license in one go.

## License
MIT, see `LICENSE`. Datasets keep their own licenses (each `data/civic/datasets/*/README.md`).
