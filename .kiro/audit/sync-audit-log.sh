#!/usr/bin/env bash
# Sync a SAFE excerpt of the Kiro Crew audit log into the repo, so proof of
# Kiro usage travels with the code to GitHub / teammates.
#
# The raw log (~/.kiro/crew/audit.log) covers every tool call on this machine,
# including other projects, full outputs and any secret that ever appeared in a
# command. This repo is PUBLIC, so we never copy it raw: the sanitizer keeps only
# this repo's entries, drops outputs, and redacts secrets and home paths. Then the
# secret scanner double-checks the result.
#
#   bash .kiro/audit/sync-audit-log.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
python3 "$REPO_ROOT/.kiro/audit/sanitize_audit_log.py"

if ! python3 "$REPO_ROOT/.kiro/scripts/scan_secrets.py" >/dev/null; then
  rm -f "$REPO_ROOT/.kiro/audit/audit.log"
  echo "Secret scan flagged the sanitized audit log; removed it. Do not commit an audit log until fixed."
  exit 1
fi
