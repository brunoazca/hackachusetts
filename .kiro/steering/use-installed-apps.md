---
inclusion: always
---

# Rule — prefer our installed apps when they do a job better

We have Kiro apps installed. Some do a job better than a plain chat turn.
When that is true, SAY SO in the session and hand the user ready-to-paste text.

## The rule
Whenever the current task could be done better by one of our installed apps:
1. Say which app fits and why, in one line.
2. Give the exact text/prompt the user should paste into that app.
3. Do not silently do the worse version yourself.

## Apps we rely on (one-day hackathon scope)
- **Design Critique** — judge a screen/flow/URL like a designer. Hand over the
  screenshot, repo, Figma, or live URL.
- **Spec Builder** — turn a feature idea into Requirements → Design → Tasks.
- **Task Runner** — hand off a long multi-step job to run unattended.
- **Research Lab** — find/verify public datasets and sources while we build.
- **PPTX Maker** — build the pitch deck near the end.

## Constraints for this event
- One-day hackathon: do not suggest an app whose setup costs more than it saves.
- We are NOT opening pull requests. Never suggest PR-review or issue-triage apps.
- An app must be ENABLED before use. If it is off, tell the user to enable it
  in the App Store first; never claim it ran.
