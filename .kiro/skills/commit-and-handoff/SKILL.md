---
name: commit-and-handoff
description: Use when committing on this repo. We work directly on main in a worktree teammates also edit, and the agent is hard-blocked from pushing to main. This is the safe-commit recipe — stage only your own files by path, commit, then hand the push to a human — so you never sweep a teammate's edits or retry a push that will always be refused.
---

# Commit your work, hand the push to a human

We do this every time we ship. Two rules get broken most, so this skill exists.

Repo root: `/Users/guilhermeavila/Desktop/ProjetosOficial/Hackachusetts/hackachusetts`

## Before you commit
Run the `verify-demo-path` skill first. Do not commit red.

## 1. See what changed — yours vs. theirs
```bash
git status
git diff --stat
```
Teammates (Guilherme, Bruno, Carol) edit this same worktree at the same time.
Some files you see are theirs, uncommitted. Leave those alone.

## 2. Stage ONLY your own files, by path
```bash
git add web/src/components/map/MapView.tsx web/src/lib/queries.ts
```
Never `git add -A` and never `git add .` here — that sweeps a teammate's
half-done edits into your commit. One `git add` per file you actually changed.

## 3. Secret scan again (staged content only)
```bash
python3 .kiro/scripts/scan_secrets.py
```
Hard gate. A hit = unstage it, move it to `web/.env.local`, re-run.

## 4. Commit — small and true
```bash
git commit -m "<short, true summary of just these files>"
```
- Keep hooks on. Do not pass `--no-verify`.
- Prefer a new commit over `--amend`.

## 5. The push — NOT you
You are **hard-blocked by a safety policy** from pushing to `main`. This cannot
be turned off by any file or setting. Do not run `git push`. Do not retry it.
It will be refused every time.

Instead, tell Guilherme, in words:
> Committed on main. Run `git push origin main` to publish.

If origin is ahead (local is behind), tell them to pull first:
> origin moved. Run `git pull --no-rebase` then `git push origin main`.

## 6. Log it
```bash
.kiro/klog.sh "<teammate>" "<agent>" "<did>" "<why>" "<where>" "<idea>"
```

## The three traps this skill prevents
1. `git add -A` in a shared worktree → you commit someone else's unfinished work.
2. Retrying the blocked push → it never works; stop and hand it off.
3. Committing a leaked secret into a public repo → secret scan is the gate.
