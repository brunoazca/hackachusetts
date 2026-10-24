#!/usr/bin/env bash
# Sync the Kiro Crew audit log (every tool call, HMAC-protected) into the repo
# so our proof of Kiro usage travels with the code to GitHub / teammates.
#
# The live audit log lives OUTSIDE the repo at ~/.kiro/crew/audit.log and is
# personal to each machine. This copies the current state into
# .kiro/audit/audit.log. Run it any time, or let the hook run it after work.
#
#   bash .kiro/audit/sync-audit-log.sh
set -euo pipefail

SRC="$HOME/.kiro/crew/audit.log"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST="$REPO_ROOT/.kiro/audit/audit.log"

if [[ ! -f "$SRC" ]]; then
  echo "No audit log at $SRC — nothing to sync."
  exit 0
fi

mkdir -p "$(dirname "$DEST")"
cp "$SRC" "$DEST"
echo "Synced audit log: $(wc -l < "$DEST" | tr -d ' ') entries -> .kiro/audit/audit.log"
