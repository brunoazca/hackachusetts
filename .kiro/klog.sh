#!/usr/bin/env bash
# klog — add one entry to the Kiro work log. Works from anywhere.
#
# Easiest use (positional):
#   .kiro/klog.sh "Guilherme" "default" "Added X" "because Y" "src/a.ts" "idea: Z"
#
# Or with flags (any order, any omitted):
#   .kiro/klog.sh -t Guilherme -a default -d "Added X" -w "because Y" -f src/a.ts -i "idea: Z"
#
# Fields: -t teammate  -a agent  -d did  -w why  -f where(files)  -i idea
# Any missing field is written as "—". Newest entry goes to the TOP.

set -euo pipefail

# Resolve the log next to this script, no matter the current directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$SCRIPT_DIR/KIRO_LOG.md"

t="" a="" d="" w="" f="" i=""

# Flag mode if the first arg starts with "-", else positional.
if [[ "${1:-}" == -* ]]; then
  while getopts "t:a:d:w:f:i:" opt; do
    case "$opt" in
      t) t="$OPTARG" ;; a) a="$OPTARG" ;; d) d="$OPTARG" ;;
      w) w="$OPTARG" ;; f) f="$OPTARG" ;; i) i="$OPTARG" ;;
      *) echo "usage: klog.sh -t teammate -a agent -d did -w why -f where -i idea" >&2; exit 2 ;;
    esac
  done
else
  t="${1:-}"; a="${2:-}"; d="${3:-}"; w="${4:-}"; f="${5:-}"; i="${6:-}"
fi

: "${t:=—}"; : "${a:=—}"; : "${d:=—}"; : "${w:=—}"; : "${f:=—}"; : "${i:=—}"

stamp="$(date '+%Y-%m-%d %H:%M')"
title="$d"
[[ "$title" == "—" ]] && title="(no title)"
# Trim a long title to keep the heading short.
[[ ${#title} -gt 60 ]] && title="${title:0:57}..."

entry_file="$(mktemp)"
cat > "$entry_file" <<EOF

### $stamp — $title
- Teammate: $t
- Agent: $a
- Did: $d
- Why: $w
- Where: $f
- Idea: $i
EOF

if [[ ! -f "$LOG" ]]; then
  echo "error: $LOG not found" >&2
  rm -f "$entry_file"
  exit 1
fi

# Insert the new entry right after the "## Log" marker line.
tmp="$(mktemp)"
awk -v ef="$entry_file" '
  { print }
  /^## Log[[:space:]]*$/ && !done {
    while ((getline line < ef) > 0) print line
    close(ef); done=1
  }
' "$LOG" > "$tmp"
mv "$tmp" "$LOG"
rm -f "$entry_file"

echo "logged: $stamp — $title"
