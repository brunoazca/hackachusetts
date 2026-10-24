---
inclusion: always
---

# Rule — log every piece of work in the Kiro log

We must prove how we used Kiro. So we keep one living log.

## The rule
After you do real work in this repo — add code, change a file, make a
decision, or raise a good idea — add ONE entry to `.kiro/KIRO_LOG.md`.

**Do this on your own, without being asked.** If this turn changed a file,
made a decision, OR raised an idea in pure talk (a brainstorm, a direction,
a "what if"), logging is PART of the task — not a separate request. Log it
before you end your turn. The user should never have to ask you to log.

**Ideas count as work.** A chat with no file change still gets an entry when
real thinking happened: an idea, a plan, a decision, a trade-off weighed, a
scope call. Put the thought in `Did:` and `Idea:`, and set `Where: none`.
Do NOT wait for code — the strongest parts of our Kiro story are the ideas.

- Add the new entry at the TOP of the `## Log` section.
- Never delete or rewrite old entries. Only add.
- Skip ONLY true no-ops: pure reading, a status check, a yes/no with no
  thinking behind it. When in doubt, log it.
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

We are a TEAM. Always name the teammate who drove the work AND the agent,
so we can see who did what. If you do not know the teammate's name, ask
before logging.

## Easiest way to log (one command)
From the repo root, run the helper — it stamps the time and puts the entry
at the top for you:
```
.kiro/klog.sh "<teammate>" "<agent>" "<did>" "<why>" "<where>" "<idea>"
```
Use "—" for any field you do not have. You may also edit
`.kiro/KIRO_LOG.md` by hand if you prefer. Hooks, crons and tasks should
call `.kiro/klog.sh` so nothing is forgotten.

## Why this matters
At the end we read `.kiro/KIRO_LOG.md` to write
`docs/submission/kiro-usage.md`. No log entry means that work is invisible
to the judges. The log is the source of truth for our Kiro story.
