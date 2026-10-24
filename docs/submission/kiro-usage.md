# How we used Kiro

We used Kiro to turn a civic-data idea into a testable specification, investigate public records, build and critique the prototype, and run a small crew of review agents while we worked. The evidence is in the repository, not just in a list of tools. Our timestamped [work log](../../.kiro/KIRO_LOG.md) carries 242 entries from 10:00 to 17:30 on October 24 and names the teammate and agent for each contribution. It is a team-maintained record, not an independent audit of every execution. Codex contributions are labeled separately and are not counted as Kiro activity.

## Specifications and steering

The [requirements](../../.kiro/specs/rat-audit/requirements.md), [design](../../.kiro/specs/rat-audit/design.md), and [tasks](../../.kiro/specs/rat-audit/tasks.md) capture the inspector workflow, data model, evidence requirements, and unfinished work. The log records importing the specification into **Kiro Spec Builder** and revising it after data tests (a later "Spec v2" merge widened task scope 2.2/2.3/4.2/4.3). A requirement in those files is not, by itself, proof that a feature shipped.

[Product steering](../../.kiro/steering/product.md) keeps the work focused on an inspector reviewing evidence. Other steering files cover architecture, design, accessibility, submission requirements, and the append-only work log.

## The agent crew

We ran five Kiro agents in [`.kiro/agents/`](../../.kiro/agents/), each scoped to one job. They are configured review and watch aids; a cron-scheduled agent is not a guarantee that every file passed.

| Agent | Job | Tools |
|---|---|---|
| [`da-vinci`](../../.kiro/agents/da-vinci.json) | Hourly design critic — measures contrast and tap-target sizes from the live DOM at desktop and phone sizes; writes heuristic critiques (Nielsen, WCAG, Gestalt, Fitts) to [`docs/design-critique/`](../../docs/design-critique/) | read, write, shell, glob, grep, @playwright |
| [`hopper`](../../.kiro/agents/hopper.json) | Build watcher (every 3h) — runs lint, type-check, and a production build of `web/` without touching the dev server; writes pass/fail and the first exact error to [`docs/health/latest.md`](../../docs/health/) | read, write, shell, glob, grep |
| [`direction-check`](../../.kiro/agents/direction-check.json) | Every 30 min reads the rules, intentions, and data, then gives a blunt go / off-track verdict with the one fix that matters most | read, grep, glob, code, execute_bash, @civic-snapshots, @boston-opendata |
| [`a11y-auditor`](../../.kiro/agents/a11y-auditor.json) | On-demand audit of the scored accessibility requirement — runs the deterministic scanner, confirms hits in context, then walks the live demo by keyboard and takes a screen-reader/contrast snapshot | read, grep, glob, code, shell, @playwright |
| [`civic-judge`](../../.kiro/agents/civic-judge.json) | Reviews the way a Hackachusetts Civic Action judge would: community value, authoritative evidence, accessibility, a human decision point, and meaningful Kiro usage | read, grep, glob, code, @civic-snapshots, @playwright |

The log records trimming the crew down to these useful members and removing ones that did not earn their keep (Einstein, kiro-historian, snapshot-validator, and others).

## Research campaigns: question to artifact

We ran Kiro Crew research campaigns and recorded each by id in the work log. The headline result is that human review **narrowed** the story when the data failed to support it.

| Question given to Kiro | Recorded work | Result and product implication |
|---|---|---|
| Which real place illustrates repeated reports and recorded city responses? | Campaign `2b8f7f81`; log at 12:16 and 12:26; [demo-site research](../../knowledge/sources/rats/demo_site.md) | A Normandy Street case with 18 reports supplied a traceable example. Nearby vacant-lot and trash records are inspection context, not proof of a cause. |
| Which data layers deserve attention? | Campaigns `93c1ad29` and `95a7dbd6`, then the [source audit](../../.kiro/specs/rat-audit/data-audit.md) and [validation scripts/results](../../knowledge/sources/rats/validation/) | The team recorded associations and null findings, then revised the spec. Layer labels distinguish tested associations from untested context. Exploratory correlations are not intervention effects. |
| Does escalation actually outperform monitoring? | Matched-study campaign, documented in the log and [data report](data-report.md) | The later result **overturned** the earlier before/after story: risk ratio 1.03, 95% interval 0.89–1.20, null every year. We replaced the causal headline with "no clear difference"; that is not proof of equivalence. |
| Do more inputs improve forecasting? | Forecast campaign `072d5a66`, model/backtest in [pipeline/rat_audit/model](../../pipeline/rat_audit/model/), 16:02 log entry | A seven-group ablation (leave-one-group-out) did not promote a new input group; some lifts came with worse MAE. We distinguish report forecasting from evidence that a civic intervention works. |
| Cover the thirteen open research tracks before the deadline | Umbrella **Research Lab** campaign `947e85a6`: 13 tracks (R01–R13) as sub-questions, 5 parallel researchers, 45 cycles; reports exported to [`knowledge/research/`](../../knowledge/research/) | Findings fed spec revisions directly — e.g. the block-level trash signal was weak (+0.13), so the recommendation logic escalates after repeat monitoring rather than leading on trash. |

## Watching the three work fronts

The log records a **read-only Kiro monitor loop** (~2 hours, 21 cycles) over three parallel worktrees — analytics-core, agent, and insights — that alerted only on real signals and wrote nothing during the run. It flagged when `main` moved under the fronts (Spec v2 merged, the model built on main, deploy-on-push went live) so the team could reconcile instead of colliding.

## Hooks: automatic safeguards on save

Eight hooks in [`.kiro/hooks/`](../../.kiro/hooks/) fire on file save. Their presence is a configured safeguard, not proof every file passed an audit.

- [Overclaim guard](../../.kiro/hooks/overclaim-guard.kiro.hook) (enabled) — on any UI/content save under `web/src/**` or `src/**`, runs `check_overclaims.py` and flags banned phrasings (reports stated as rats, "closed = solved", infestation prediction, "worst", auto-submit), then asks for human confirmation before any rewrite.
- [Accessibility check](../../.kiro/hooks/accessibility-check.kiro.hook) (enabled) — on UI-component save, reviews the file against the scored a11y requirements (landmarks, single h1, labels, focus order, `aria-describedby`, WCAG AA contrast).
- [Snapshot citation check](../../.kiro/hooks/snapshot-citation-check.kiro.hook) (enabled) — on data-snapshot save, runs `validate_snapshots.py` and requires a real source name, URL, and retrieved date; it will not invent a source.
- [Secret scan](../../.kiro/hooks/secret-scan.kiro.hook) + the Git pre-commit hook — an executable repository check; the latest submission commit passed it clean.
- [Log all work](../../.kiro/hooks/log-all-work.kiro.hook) and [sync audit log](../../.kiro/hooks/sync-audit-log.kiro.hook) — keep the append-only [`KIRO_LOG.md`](../../.kiro/KIRO_LOG.md) current and in the repo.
- [MCP health](../../.kiro/hooks/mcp-health.kiro.hook) — checks the MCP servers stay reachable during development.
- [Demo-path green](../../.kiro/hooks/demo-path-green.kiro.hook) is currently **disabled**. We do not claim it automatically kept the build or demo green.

## MCP: what Kiro could reach

[MCP configuration](../../.kiro/settings/mcp.json) and [bridges](../../.kiro/mcp/) gave Kiro access to Boston OpenContext/OpenData, SQL over committed civic snapshots (`@civic-snapshots`), and Playwright for live-DOM review. The log records connectivity checks during development; this write-up does not claim a fresh health check of every server at submission time.

## Where human judgment mattered

We narrowed the story when the evidence failed to support it. Reports are not rat counts; a repeated report after closure does not establish treatment failure; absence of a linked violation does not prove no enforcement occurred. We trimmed the agent crew to the ones that earned their place, kept a human review step, and documented incomplete features. The useful Kiro contribution was an inspectable chain of questions, campaigns, artifacts, tests, agent critiques, and revisions — not a claim that every planned feature or every automated safeguard is complete.
