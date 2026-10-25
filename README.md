# Piper — Hackachusetts 2026

Piper helps Boston rodent inspectors review places with repeated 311 reports, read recorded responses, and examine nearby records before deciding where to investigate. It counts **reports**, not rats, and does not infer that a closed case solved a problem.

**[Explore the live app →](https://piper-app.vercel.app/)**

## Working product

The app opens in **Places to visit**. Choose an address to see its report timeline, closure notes, reports after earlier closures, and nearby records. Switch to **Map** to explore available Boston, Cambridge, and Somerville layers and the four-week Boston report forecast. The Insights panel presents a dated research snapshot, not a live treatment-effect estimate.

Place summaries count distinct **report days**, **closure days**, and **return days**; the response history lists individual records. Open **Inspection brief** from a place to print/save a PDF or download a standalone HTML snapshot with the full history, source links, and field questions. See [brief setup and verification](docs/rat-audit/inspection-brief.md), including the database migration needed for nearby-source citations.

“Review suggested” flags a recently closed place with a prior report after closure. It is a heuristic for human review, not an inspection deadline or a prediction that rats will return. The available records do not establish which treatment works better or whether a nearby parcel caused the reports.

The Ask assistant, recommendations, approval/work-order flow, and trial designer are unfinished. No civic submission is sent by the current interface. The strongest completed workflow is **review a place and its evidence**; the prototype does not yet finish a resident service request end to end.

## Run locally

Use Node.js 24 and pnpm 11.22.0 (the version pinned in `web/package.json`).

```bash
cd web
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill in the two NEXT_PUBLIC_SUPABASE_* values for the populated project.
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The app needs a populated Supabase project with this repository's schema and RPCs. The existing team project is the quickest development path; obtain its public URL and anon key through the team's private channel. Committed CSVs are research/development inputs, **not an automatic offline fallback** for the web app. A fresh checkout without database configuration will not load the data views.

The frontend reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `web/.env.local`. Only the public client key belongs there; never put a service-role key in a `NEXT_PUBLIC_` variable. Refresh is optional and additionally needs the server-only `MODAL_REFRESH_URL` and `RAT_AUDIT_WORKER_TOKEN`. Without those, the app can read existing data but cannot request a pipeline refresh.

The Python ingestion/model worker has separate setup and credentials in [pipeline/README.md](pipeline/README.md). Source modes are defined in `pipeline/rat_audit/ingest/update_modes.py`: “live” means refreshable, while daily jobs currently run manually. Do not treat a source's update mode as proof of its latest successful ingestion.

## Checks

```bash
cd web
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Repository checks: `python3 .kiro/scripts/check_overclaims.py` and `python3 .kiro/scripts/scan_secrets.py`. The submission checker also contacts configured MCP services, so it is not an offline test. Build success is not a complete accessibility audit.

## Evidence and limitations

- [Data report](docs/submission/data-report.md): historical findings, cutoffs, methods, and caveats.
- [Data audit](.kiro/specs/rat-audit/data-audit.md): exploratory source tests and their results.
- [Boston 311](https://data.boston.gov/dataset/311-service-requests): the main report/closure source.
- [Boston Rodent Action Plan](https://www.boston.gov/departments/inspectional-services/boston-rodent-action-plan-brap): existing city work that Piper aims to support.

Reporting frequency reflects reporting behavior as well as conditions. Missing linked enforcement records do not prove no enforcement happened. Nearby records supply context, not causes. Different municipal systems are not directly comparable. Forecasts estimate recorded reports, not infestations or treatment effects.

## Kiro and submission

The team used Kiro for specifications, data research, implementation, and review. The [Kiro write-up](docs/submission/kiro-usage.md) links concrete artifacts and distinguishes configured hooks from observed execution. The append-only [.kiro/KIRO_LOG.md](.kiro/KIRO_LOG.md) records who did each piece of work, including non-Kiro contributions.

- [Project description](docs/submission/description.md)
- [Current-build demo script](docs/submission/demo-script.md)
- [Repository](https://github.com/brunoazca/hackachusetts)
- [Deployment target](https://piper-app.vercel.app) configured by `.github/workflows/deploy.yml`; a local branch change does not update that deployment.

Submission still needs a public video under three minutes. Accessibility features include a list alternative to map selection, labeled controls, focus styles, and reduced-motion support; full keyboard, screen-reader, contrast, and responsive audits remain outstanding.

## Layout and license

`web/`: Next.js app. `pipeline/`: Python ingestion and forecast worker. `supabase/`: database migrations. `data/civic/` and `knowledge/`: source snapshots and research. `.kiro/`: specs, steering, hooks, agents, and work log.

MIT; see [LICENSE](LICENSE). Datasets retain their source licenses documented with each dataset.
