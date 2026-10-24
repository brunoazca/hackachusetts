#!/usr/bin/env bash
# Auto-sync: every INTERVAL seconds, commit any change in the repo and push to origin/main.
# The pre-commit secret scanner still runs on every commit; a blocked commit is skipped, not forced.
# On a rebase conflict the rebase is aborted and the loop keeps going (a human resolves it).
#
#   .kiro/scripts/autopush.sh            # loop forever (default every 180 s)
#   INTERVAL=60 .kiro/scripts/autopush.sh
#   .kiro/scripts/autopush.sh --once     # one pass
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1
INTERVAL="${INTERVAL:-180}"
LOG="$ROOT/.cache/autopush.log"
mkdir -p "$ROOT/.cache"

log() { echo "$(date '+%H:%M:%S') $*" | tee -a "$LOG"; }

pass() {
  if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    log "skip: not on main"; return
  fi
  if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] || [ -f .git/MERGE_HEAD ]; then
    log "skip: rebase/merge in progress"; return
  fi

  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    files="$(git diff --cached --name-only | head -5 | tr '\n' ' ')"
    n="$(git diff --cached --name-only | wc -l | tr -d ' ')"
    if git commit -q -m "Auto-sync: ${n} file(s) — ${files}"; then
      log "committed ${n} file(s): ${files}"
    else
      log "commit blocked (secret scan or hook) — files left staged for a human"
      git reset -q
      return
    fi
  fi

  if ! git pull -q --rebase --autostash origin main 2>>"$LOG"; then
    git rebase --abort 2>/dev/null
    log "CONFLICT on pull --rebase; aborted. Resolve by hand."
    return
  fi
  if [ -n "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]; then
    if git push -q origin main 2>>"$LOG"; then
      log "pushed $(git rev-parse --short HEAD)"
    else
      log "push failed"
    fi
  fi
}

if [ "${1:-}" = "--once" ]; then pass; exit 0; fi
log "autopush started (every ${INTERVAL}s)"
while true; do pass; sleep "$INTERVAL"; done
