---
name: verify-demo-path
description: Use before claiming any code change is done, and before any commit on this repo. Runs the full demo-path + submission gauntlet (typecheck, lint, secret scan, overclaim scan, submission check) in the one right order, and tells you what blocks a commit vs. what is a warning. Prevents shipping a broken demo path or a leaked secret on submission day.
---

# Verify the demo path before you say "done"

We do this on almost every turn. This skill is the one checklist so nobody
forgets a step. Run it before you claim a change works and before any commit.

Repo root: `/Users/guilhermeavila/Desktop/ProjetosOficial/Hackachusetts/hackachusetts`

## Run these in order. Stop at the first HARD-fail.

### 1. Secret scan — HARD gate (never commit a leak; repo is public)
```bash
python3 .kiro/scripts/scan_secrets.py
```
A hit means a secret is staged. Do not commit. Remove it, put it in
`web/.env.local` (git-ignored), and re-run.

### 2. Typecheck — HARD gate (a red type is a broken demo path)
```bash
cd web && pnpm exec tsc --noEmit
```

### 3. Lint — read, don't panic
```bash
cd web && pnpm lint
```
Known pre-existing: 3 React-effect errors + generated maplibre-worker warnings.
New errors you introduced = fix them. Pre-existing ones = leave, don't sweep.

### 4. Build — the demo-path gate (only before a push or a release claim)
```bash
cd web && pnpm build
```
Skip on tiny copy-only edits; always run before "it works" or a release.

### 5. Overclaim scan — HARD gate for submission docs
```bash
python3 .kiro/scripts/check_overclaims.py
```
Blocks claims of features that are not shipped. Fix the wording, not the scan.

### 6. Submission readiness — only when touching docs/submission
```bash
python3 .kiro/scripts/check_submission_ready.py
```

## After it is green

1. Say exactly what you ran and the result. Evidence, not "should work."
2. Stage only your own files by path (`git add <path>`), never `git add -A` —
   teammates edit this worktree in parallel.
3. Commit. **You cannot push to `main`** (hard safety policy). Commit, then
   tell Guilherme to run `git push origin main`.
4. Log it: `.kiro/klog.sh "<teammate>" "<agent>" "<did>" "<why>" "<where>" "<idea>"`

## Hard rules
- A write that reports "no changes" → read the file back from disk before
  claiming success. Do not re-narrate intended content.
- Live demo data comes from the snapshot; every shown fact cites a `sources` row.
