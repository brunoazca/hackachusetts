# How we used Kiro

We used Kiro to turn a civic-data idea into a testable specification, investigate public records, and build and review parts of the prototype. The evidence is in the repository, not just in a list of tools. Our timestamped [work log](../../.kiro/KIRO_LOG.md) identifies the teammate and agent for each contribution. It is a team-maintained record, not an independent audit of every execution. Codex contributions are labeled separately and are not counted as Kiro activity.

## Specifications and steering

The [requirements](../../.kiro/specs/rat-audit/requirements.md), [design](../../.kiro/specs/rat-audit/design.md), and [tasks](../../.kiro/specs/rat-audit/tasks.md) capture the inspector workflow, data model, evidence requirements, and unfinished work. The log records importing the specification into Kiro Spec Builder and revising it after data tests. A requirement in those files is not, by itself, proof that a feature shipped.

[Product steering](../../.kiro/steering/product.md) keeps the work focused on an inspector reviewing evidence. Other steering files cover architecture, design, accessibility, submission requirements, and the append-only work log.

## Concrete research-to-product examples

| Question given to Kiro | Recorded work | Result and product implication |
|---|---|---|
| Which real place illustrates repeated reports and recorded city responses? | Kiro Crew campaign `2b8f7f81`; log entries at 12:16 and 12:26; [demo-site research](../../knowledge/sources/rats/demo_site.md) | A Normandy Street case with 18 reports supplied a traceable example. Nearby vacant-lot and trash records are inspection context, not proof of a cause. |
| Which data layers deserve attention? | Campaigns `93c1ad29` and `e241ffc6`, followed by the [source audit](../../.kiro/specs/rat-audit/data-audit.md) and [validation scripts/results](../../knowledge/sources/rats/validation/) | The team recorded associations and null findings, then revised the specification. Layer labels distinguish tested associations from untested context. Exploratory correlations are not intervention effects. |
| Does escalation actually outperform monitoring? | Matched-study campaign `4fb70394`, documented in the work log and [data report](data-report.md) | The later result overturned the earlier before/after story: risk ratio 1.03, 95% interval 0.89–1.20. We replaced the unsupported causal headline with “no clear difference”; that is not proof of equivalence. |
| Do more inputs improve forecasting? | Forecast campaign `072d5a66`, model/backtest implementation in [pipeline/rat_audit/model](../../pipeline/rat_audit/model/), and the October 24 16:02 log entry | The team tested candidate input groups against a baseline. The later seven-group ablation did not promote a new group. We distinguish report forecasting from evidence that a civic intervention works. |

The log also records Kiro UI work on the Transit visual system, readable controls, panel behavior, and map interaction. The current submission cleanup and copy corrections were performed with Codex; they should not be described as Kiro-generated implementation.

## Tools, hooks, and review: configuration versus execution

- [MCP configuration](../../.kiro/settings/mcp.json) and [bridges](../../.kiro/mcp/) give Kiro access to Boston OpenContext, SQL over committed civic snapshots, and other source/review tools. The log records connectivity checks during development; this write-up does not claim a fresh health check of every server.
- [Accessibility hook](../../.kiro/hooks/accessibility-check.kiro.hook) and [overclaim hook](../../.kiro/hooks/overclaim-guard.kiro.hook) are configured review prompts. Their presence is not evidence that every file passed an audit.
- [Secret scanning](../../.kiro/scripts/scan_secrets.py) and the Git pre-commit hook provide an executable repository check. Keep credentials outside the repository.
- [Demo-path hook](../../.kiro/hooks/demo-path-green.kiro.hook) is currently **disabled**. We do not claim it automatically kept the build or demo green.
- [Civic-judge agent](../../.kiro/agents/civic-judge.json) is configured, and the work log records an early dry run. It is a review aid, not an official judge score or proof of submission readiness.

## Where human judgment mattered

We narrowed the story when the evidence failed to support it. Reports are not rat counts; a repeated report after closure does not establish treatment failure; absence of a linked violation does not prove no enforcement occurred. We retained a human review step and documented incomplete features. The useful Kiro contribution was an inspectable chain of questions, artifacts, tests, and revisions—not a claim that every planned feature or every automated safeguard is complete.
