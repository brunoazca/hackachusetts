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
