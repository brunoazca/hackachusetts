# Kiro Work Log

This file is the record of what we did with Kiro.
Every chat and every agent adds a line here.
At the end, we read this file to write the Kiro usage story.

## Rules
- Add the newest entry at the TOP of the log below.
- Never delete old entries. Only add.
- One entry per real piece of work — code, a decision, OR a pure-talk idea.
- Ideas count: a brainstorm with no file change still gets an entry. Put the
  thought in `Did:` and `Idea:`, set `Where: none`.
- Skip only true no-ops (pure reading, a yes/no with no thinking).
- Keep each line short and true.

## Entry format
```
### YYYY-MM-DD HH:MM — <short title>
- Teammate: <name of the person who asked for this>
- Agent: <which Kiro agent did it>
- Did: <what changed or was decided>
- Why: <reason, one line>
- Where: <files touched, or "none">
- Idea: <any idea raised, or "none">
```

We are a team. Always name the teammate who drove the work AND the agent.
If the agent does not know the teammate's name, it asks before logging.

---

## Log

### 2026-10-24 11:14 — Expanded Civic research with 15 creative concepts and ver...
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Expanded Civic research with 15 creative concepts and verified public resources
- Why: Connect public priorities and resident friction to distinctive feasible demos
- Where: knowledge/02,04,07,08,09,10,11,README; knowledge/sources; data/civic/CATALOG.md
- Idea: Prioritize Last 100 Feet, ShiftFits or OpenDoor after proving one dependency; retain BlockBrief as fallback

### 2026-10-24 10:51 — Full repo review; shortlisted 5 build ideas, recommend Bl...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Full repo review; shortlisted 5 build ideas, recommend BlockBrief + overdue view
- Why: Pick an app now; 0 code at 10:50 AM
- Where: none
- Idea: 311 on_time: Dorchester 24% overdue vs Back Bay 14%; Wait Watch, Safe Last Mile, Cost-to-Career as alternates

### 2026-10-24 10:48 — Committed on main (68d2e23): clean civic-service spec + i...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Committed on main (68d2e23): clean civic-service spec + idea-neutral Kiro automation; ready for human to push
- Why: Save the spec reset and automation work; idea to come later
- Where: 13 files: .kiro/specs/civic-service/*, .kiro/agents/snapshot-validator.json, .kiro/hooks/snapshot-citation-check.kiro.hook, .kiro/scripts/*, README.md, docs/submission/kiro-usage.md, data/civic/CATALOG.md, .kiro/steering/structure.md
- Idea: Human runs: git push origin main

### 2026-10-24 10:45 — dry-run scorecard of current state
- Teammate: Guilherme
- Agent: civic-judge
- Did: dry-run scorecard of current state
- Why: surface the biggest submission risk early
- Where: none
- Idea: Pick the idea now and ship one real end-to-end slice; a template spec and zero app code is the submission's biggest risk at 10:45 AM.

### 2026-10-24 10:45 — Built idea-neutral Kiro automation: snapshot-validator ag...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Built idea-neutral Kiro automation: snapshot-validator agent+hook+script, submission-readiness script+cron, hourly demo-path-health cron, and triggered a civic-judge dry run
- Why: Set up useful, idea-agnostic Kiro automation that leaves a visible proof trail before the app idea is chosen
- Where: .kiro/agents/snapshot-validator.json, .kiro/hooks/snapshot-citation-check.kiro.hook, .kiro/scripts/validate_snapshots.py, .kiro/scripts/check_submission_ready.py, 2 cron jobs
- Idea: Crons fire on the Schedule page; validators enforce the civic cite+ready rules for any idea

### 2026-10-24 10:39 — Removed parking-permit-navigator spec; created clean idea...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Removed parking-permit-navigator spec; created clean idea-neutral civic-service spec (requirements/design/tasks) and fixed all references in README, structure.md, kiro-usage.md, CATALOG.md
- Why: Start fresh on a new civic idea with a complete, blank-but-structured spec
- Where: .kiro/specs/civic-service/*, README.md, .kiro/steering/structure.md, docs/submission/kiro-usage.md, data/civic/CATALOG.md
- Idea: Rename civic-service to the chosen outcome (e.g. block-brief) once the team decides

### 2026-10-24 10:36 — Pulled origin/main and reviewed KB + repo state; found no...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Pulled origin/main and reviewed KB + repo state; found no app code yet, submission docs still templates, spec still parking-permit template while research recommends BlockBrief
- Why: User asked for a full state review and showcase recommendations
- Where: .kiro/KIRO_LOG.md
- Idea: Pick BlockBrief, rename spec to block-brief, build 3-screen app from boston-311 snapshot; wire historian agent to fill kiro-usage.md at the end

### 2026-10-24 10:35 — Recommended three scoped Civic MVPs; team choice remains ...
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Recommended three scoped Civic MVPs; team choice remains open
- Why: Connect creativity to the rubric and verified available data
- Where: knowledge/08_idea_shortlist_and_build_recommendation.md
- Idea: Prefer BlockBrief for waste-service evidence briefs; Notice to Action for accessible public notices; MoveReady for a narrow preparation flow

### 2026-10-24 10:31 — Made pure-talk ideas/brainstorm loggable
- Teammate: Guilherme
- Agent: default
- Did: Made pure-talk ideas/brainstorm loggable
- Why: ideas are our strongest Kiro story; must be captured even with no code
- Where: .kiro/steering/kiro-log.md, .kiro/KIRO_LOG.md
- Idea: log a brainstorm with Where: none
### 2026-10-24 10:16 — Correction: the three '— (unconfirmed)' entries from 10:1...
- Teammate: Bruno
- Agent: default (kiro-cli chat)
- Did: Correction: the three '— (unconfirmed)' entries from 10:13–10:14 were driven by Bruno
- Why: attribute the app-enable, catch-all logging hook, and decisions to the right teammate
- Where: none (attribution correction)
- Idea: —

### 2026-10-24 10:14 — Replaced spec-only hook with catch-all log-all-work hook ...
- Teammate: — (unconfirmed)
- Agent: default (kiro-cli chat)
- Did: Replaced spec-only hook with catch-all log-all-work hook covering all apps/files
- Why: every app's work product should auto-log, not just two apps
- Where: .kiro/hooks/log-all-work.kiro.hook (added), .kiro/hooks/spec-log.kiro.hook (removed)
- Idea: hooks fire on repo file changes, not on in-dashboard app clicks — logging follows the files any app writes

### 2026-10-24 10:13 — Added spec-log hook to auto-log spec changes
- Teammate: — (unconfirmed)
- Agent: default (kiro-cli chat)
- Did: Added spec-log hook to auto-log spec changes
- Why: make Spec Builder work self-logging so it is visible to judges
- Where: .kiro/hooks/spec-log.kiro.hook
- Idea: Design Critique work already logged by existing accessibility-check hook on src/**

### 2026-10-24 10:13 — Enabled Spec Builder + Design Critique in Crew; dropped C...
- Teammate: — (unconfirmed)
- Agent: default (kiro-cli chat)
- Did: Enabled Spec Builder + Design Critique in Crew; dropped Code Review Sage (no PRs) and others (1-day scope)
- Why: focus on apps that feed required artifacts: spec = meaningful .kiro usage, design critique = scored a11y
- Where: none (Crew app state)
- Idea: Crew is single-user/local; real team sharing stays on GitHub

### 2026-10-24 10:13 — Mirrored the Civic Action datasets into the repo
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Pulled origin/main (ff), then downloaded all 23 Civic Action datasets + 6 starter-kit zips from the Hackachusetts data portal into data/civic/, with a CATALOG.md index.
- Why: Have authoritative, demo-safe static snapshots in-repo instead of relying on live APIs.
- Where: data/civic/CATALOG.md, data/civic/datasets/* (23 datasets: data.csv + README + fetch.py/js), data/civic/kits/*.zip
- Idea: permits + boston-311 + neighborhoods + violations are the snapshots to wire into the parking-permit-navigator demo.

### 2026-10-24 10:07 — Expanded sourced Civic research and dataset audit
- Teammate: Guilherme
- Agent: Codex (research; not Kiro build activity)
- Did: Added caption notes, recent City sources, municipal awards, and all 22 CSV audits.
- Why: Ground the project choice in verified needs, existing tools, and usable data.
- Where: knowledge/02–04, knowledge/06–07, knowledge/README.md, knowledge/sources/
- Idea: Show one completed service task with measured results and explicit data limits.

### 2026-10-24 10:04 — Pushed self-logging rule + historian agent
- Teammate: Guilherme
- Agent: default
- Did: Pushed self-logging rule + historian agent
- Why: team gets auto-logging on pull
- Where: .kiro/steering/kiro-log.md, .kiro/agents/kiro-historian.json
- Idea: run kiro-historian at the end to write kiro-usage.md

### 2026-10-24 10:00 — Scaffolded full .kiro structure, submission docs, and ver...
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Scaffolded full .kiro structure, submission docs, and verbatim rules/event reference; pushed to GitHub
- Why: Set up the repo to use Kiro well and satisfy submission requirements
- Where: .kiro/steering/*, .kiro/specs/parking-permit-navigator/*, .kiro/hooks/*, .kiro/agents/civic-judge.json, docs/submission/*, knowledge/00 + 05, README.md, .gitignore
- Idea: end-of-event: read KIRO_LOG.md to write docs/submission/kiro-usage.md

### 2026-10-24 10:00 — Built klog helper + summarizer agent
- Teammate: Guilherme
- Agent: default
- Did: Built klog helper + summarizer agent
- Why: make logging everything one easy command
- Where: .kiro/klog.sh
- Idea: end-of-event agent reads log for full context

### 2026-10-24 13:56 — Added the Kiro work log
- Teammate: Guilherme
- Agent: default (kirocrew)
- Did: Created this log file and a steering rule so all chats/agents write here.
- Why: We must prove our Kiro usage. A living log is the proof.
- Where: `.kiro/KIRO_LOG.md`, `.kiro/steering/kiro-log.md`
- Idea: Read this log at the end to fill `docs/submission/kiro-usage.md`.
