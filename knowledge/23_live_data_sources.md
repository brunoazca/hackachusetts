# Live data sources and how Kiro reaches them

Checked **October 24, 2026**. Every source below is reachable by Kiro through
an MCP server in `.kiro/settings/mcp.json`; code is in `.kiro/mcp/`. Run
`python3 .kiro/scripts/check_mcp.py` to confirm each one answers (PASS / SKIP / FAIL).

These are **development** tools: Kiro uses them while we build. If the app
itself calls one of these APIs at runtime, say so separately in
`docs/submission/kiro-usage.md`. The demo path still uses the committed
snapshots in `data/civic/datasets/` (steering: `tech.md`).

## Sources

| Source | Portal / API | Platform | Auth | MCP server | Good for |
|---|---|---|---|---|---|
| Boston open data | [data.boston.gov](https://data.boston.gov) · CKAN API `https://data.boston.gov/api/3/action/` | CKAN | None | `boston-opendata` | Full 311, permits, violations, Vision Zero, budgets; SQL on whole tables |
| MassGIS | [gis.data.mass.gov](https://gis.data.mass.gov) · Hub search `/api/search/v1` | ArcGIS Hub | None | `massgis` | EJ block groups, flood zones, transit, campuses, boundaries |
| Cambridge open data | [data.cambridgema.gov](https://data.cambridgema.gov) · SODA `/resource/<id>.json` | Socrata | App token | `cambridge-opendata` | Crash log, permits, Commonwealth Connect (311), bike counts, sanitary inspections, ramps |
| Somerville open data | [data.somervillema.gov](https://data.somervillema.gov) | Socrata | App token | `somerville-opendata` | Walk/bike counts, 311, permits |
| MBTA | [api-v3.mbta.com](https://api-v3.mbta.com/docs/swagger/index.html) | JSON:API | Optional key | `mbta` | Live alerts, routes, stops with wheelchair status, elevators/escalators |
| Our snapshots | `data/civic/datasets/*/data.csv` (saved 2026-10-18) | SQLite in memory | None | `civic-snapshots` | Every number the demo shows; offline, deterministic |
| Socrata catalog (all US portals) | `https://api.us.socrata.com/api/catalog/v1` | Socrata Discovery API | None for public assets; app token recommended | none (call directly) | Finding a dataset across many cities, e.g. `?domains=data.cambridgema.gov&q=crash` |
| AWS docs | docs.aws.amazon.com | — | None | `aws-docs` | Bedrock, Amplify, Lambda while deploying |

The three portal servers run the **City of Boston's own
[OpenContext](https://github.com/CityOfBoston/OpenContext)** code (MIT, City
of Boston DoIT), pinned to commit `5549481a`, through our stdio bridge
`.kiro/mcp/opencontext_stdio.py`. Configs are in `.kiro/mcp/opencontext/`.

## Secrets: where they live

| Variable | Needed by | Where to get it |
|---|---|---|
| `SOCRATA_APP_TOKEN` | `cambridge-opendata`, `somerville-opendata` | Sign in at [data.cambridgema.gov](https://data.cambridgema.gov/login), then [Developer Settings](https://data.cambridgema.gov/profile/edit/developer_settings) → **Create New App Token**. One token works on every Socrata portal. Use the **App Token**, not the secret token |
| `MBTA_API_KEY` (optional) | `mbta` | [api-v3.mbta.com/register](https://api-v3.mbta.com/register) |

- Put values in **`.env.local`** at the repo root. It is git-ignored. Template: `.env.example`.
- The OpenContext bridge reads `.env.local` itself, so Kiro needs no shell exports.
- Without the token, the two Socrata servers are skipped; everything else still works.
- Share `.env.local` only through a private channel (a password manager share,
  or a direct encrypted message). Never in the repo, an issue, a public
  channel, or the demo video.
- A Socrata **API key ID/secret** is a different, stronger credential (it acts
  as your account). We do not need it. Do not store it here.

### Guards that keep secrets out of the public repo

| Guard | What it does | Where |
|---|---|---|
| Secret scanner | Flags `.env.local` values and common credential formats in tracked files; never prints the value | `.kiro/scripts/scan_secrets.py` |
| Kiro hook | Runs the scanner when code, docs, data or `.kiro/` change | `.kiro/hooks/secret-scan.kiro.hook` |
| Git pre-commit | Blocks a commit with a finding or with `.env.local` staged. Enable once: `git config core.hooksPath .githooks` | `.githooks/pre-commit` |
| Audit-log sanitizer | The raw Kiro Crew audit log covers the whole machine and can contain secrets; we publish only this repo's entries, no outputs, redacted | `.kiro/audit/sanitize_audit_log.py` (run by `sync-audit-log.sh`) |
| Readiness check | Fails while any of the above is red | `.kiro/scripts/check_submission_ready.py` |

Presigned S3 links from data.boston.gov contain `X-Amz-Credential=AKIA…`. That
is a public key ID with an expiring signature, not a secret; the scanner skips it.

## Limits to remember

- Live data is untrusted input and can change during the day. Label anything
  shown from it with its fetch time; the demo numbers come from the snapshot.
- Socrata without a token is throttled; with a token the limit is per token,
  shared by everyone who uses it.
- Cambridge publishes most data under the
  [ODC PDDL](https://opendatacommons.org/licenses/pddl/); check each dataset's
  license (every snapshot README repeats its own) before republishing a slice.
