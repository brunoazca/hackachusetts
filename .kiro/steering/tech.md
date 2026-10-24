---
inclusion: always
---

# Tech — conventions and stack

> Update this once the stack is chosen. Defaults below favor a fast, judge-friendly
> web demo. Change freely — this file steers Kiro on every task.

## Stack (fill in on day one)
- Language/runtime: _TBD (e.g. TypeScript + Node)_
- Framework: _TBD (e.g. Next.js / Vite + React)_
- Styling/UI: _TBD (e.g. Tailwind + shadcn/ui)_
- Data: _TBD (static snapshot JSON for the demo is fine and faster to defend)_
- Deploy: _TBD (a public URL helps; a video is required)_

## Rules for every change
- Keep the demo path working at all times. A broken build on submission day loses.
- Prefer a committed static data snapshot over a live API for the demo. Cite its source.
- Accessibility is a scored requirement: semantic HTML, labels, focus order, contrast.
- No secrets in the repo. Use `.env.local`, keep it git-ignored, document required vars.
- Small, reviewable commits. The commit history is evidence of real work.
- We work directly on `main`. No feature branches, no pull requests — this is a
  one-day hackathon. Commit small and push straight to `main`.
  (Note: the Kiro agent cannot push to `main` itself; it prepares the commit on
  `main` and a human runs `git push origin main`.)
- The Kiro agent is BLOCKED by a safety policy from pushing to `main` (and any
  protected branch). This cannot be turned off by a file or setting. The agent
  stages and commits on `main`; a human always runs `git push origin main`.
  Do not ask the agent to retry the push — it will be refused every time.

## Commands (fill in)
- Install: _TBD_
- Dev: _TBD_
- Build: _TBD_
- Test: _TBD_
- Lint: _TBD_

## Testing
- Add a test when you add a feature or fix a bug.
- At minimum, one end-to-end check of the demo's happy path.
