#!/usr/bin/env python3
"""Snapshot citation validator.

Civic rule for this track: every data snapshot used on the demo path must carry
an authoritative citation — a source name, a source URL, and the date it was
retrieved. This script enforces that deterministically (no LLM), so it is safe
to run from a hook, a cron, or by hand.

What it checks, for each JSON snapshot it finds:
  - has a `source` object (or top-level source_* fields)
  - source has a non-empty name, url (http/https), and retrieved_date (YYYY-MM-DD)

Where it looks (whichever exist):
  - src/data/**/*.json           (the app's committed snapshot)
  - data/**/snapshot*.json       (staged snapshots)

Exit code 0 = all good (or nothing to check yet). Exit code 1 = problems found.
Prints a short, human-readable report either way.

Usage:
  python3 .kiro/scripts/validate_snapshots.py [path ...]
If paths are given, only those files are checked.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)

# Directories to scan when no explicit paths are passed.
SCAN_GLOBS = ["src/data/**/*.json", "data/**/snapshot*.json"]


def find_targets(args: list[str]) -> list[Path]:
    if args:
        return [Path(a).resolve() for a in args]
    found: list[Path] = []
    for pattern in SCAN_GLOBS:
        found.extend(sorted(REPO.glob(pattern)))
    # De-duplicate while preserving order.
    seen: set[Path] = set()
    unique: list[Path] = []
    for p in found:
        if p not in seen:
            seen.add(p)
            unique.append(p)
    return unique


def get_source(doc: dict) -> dict:
    """Accept either a nested `source` object or flat source_* fields."""
    if isinstance(doc.get("source"), dict):
        return doc["source"]
    flat = {}
    for key, alias in (("source_name", "name"), ("source_url", "url"),
                       ("retrieved_date", "retrieved_date")):
        if key in doc:
            flat[alias] = doc[key]
    return flat


def check_file(path: Path) -> list[str]:
    """Return a list of problem strings for one file (empty = ok)."""
    problems: list[str] = []
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"invalid JSON: {exc}"]
    except OSError as exc:
        return [f"cannot read: {exc}"]

    if not isinstance(doc, dict):
        return ["top level is not a JSON object; cannot locate a citation"]

    source = get_source(doc)
    if not source:
        return ["no `source` object and no source_name/source_url/retrieved_date fields"]

    name = str(source.get("name", "")).strip()
    url = str(source.get("url", "")).strip()
    date = str(source.get("retrieved_date", "")).strip()

    if not name:
        problems.append("missing source name")
    if not url:
        problems.append("missing source url")
    elif not URL_RE.match(url):
        problems.append(f"source url is not http(s): {url!r}")
    if not date:
        problems.append("missing retrieved_date")
    elif not DATE_RE.match(date):
        problems.append(f"retrieved_date is not YYYY-MM-DD: {date!r}")
    return problems


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(REPO))
    except ValueError:
        return str(path)


def main(argv: list[str]) -> int:
    targets = find_targets(argv)
    if not targets:
        print("snapshot-validator: no snapshots found yet "
              "(src/data/**/*.json, data/**/snapshot*.json). Nothing to check.")
        return 0

    any_problem = False
    print(f"snapshot-validator: checking {len(targets)} file(s)")
    for path in targets:
        problems = check_file(path)
        if problems:
            any_problem = True
            print(f"  ✗ {rel(path)}")
            for p in problems:
                print(f"      - {p}")
        else:
            print(f"  ✓ {rel(path)}")

    if any_problem:
        print("\nFAIL: a snapshot is missing its citation. "
              "Every demo-path fact must cite source name, url, and retrieved_date.")
        return 1
    print("\nOK: every snapshot carries a full citation.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
