#!/usr/bin/env python3
"""Submission-readiness checker for Hackachusetts 2026.

Checks the required artifacts exist and are no longer empty template stubs, so
the team is warned about gaps well before the 8 PM lock. Deterministic (no LLM),
safe to run from a cron.

Required artifacts (from .kiro/steering/submission-guardrails.md):
  1. Public repo with a root /.kiro directory holding real work.
  2. A working project (app code under src/).
  3. English project description (docs/submission/description.md), filled.
  4. Demo video script (docs/submission/demo-script.md), present.
  5. Kiro usage write-up (docs/submission/kiro-usage.md), filled.
Safety checks (public repo): secret scan clean, MCP servers answer, LICENSE present.

"Filled" = the file exists and has no unfilled <angle-bracket> placeholders left
in it. Prints a READY / NOT READY summary with the missing items.

Exit code 0 = ready, 1 = gaps remain. Either way it prints the checklist, so a
cron can deliver the text regardless of code.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
PLACEHOLDER_RE = re.compile(r"<[^>\n]{1,80}>")


def has_placeholders(path: Path) -> bool:
    try:
        return bool(PLACEHOLDER_RE.search(path.read_text(encoding="utf-8")))
    except OSError:
        return True


def src_has_code() -> bool:
    src = REPO / "src"
    if not src.is_dir():
        return False
    exts = {".ts", ".tsx", ".js", ".jsx", ".vue", ".html", ".py", ".svelte"}
    return any(p.suffix in exts for p in src.rglob("*") if p.is_file())


def _run(script: str) -> bool:
    import subprocess
    try:
        return subprocess.run([sys.executable, str(REPO / ".kiro/scripts" / script)], cwd=REPO,
                              capture_output=True, timeout=300).returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def check() -> list[tuple[bool, str]]:
    """Return (ok, label) for each required artifact."""
    results: list[tuple[bool, str]] = []

    kiro = REPO / ".kiro"
    results.append((kiro.is_dir() and any(kiro.iterdir()),
                    "root /.kiro directory with real work"))

    results.append((_run("scan_secrets.py"),
                    "no secrets in the public repo (scan_secrets.py clean)"))

    results.append((_run("check_mcp.py"),
                    "Kiro MCP servers answer (check_mcp.py: PASS or SKIP)"))

    results.append(((REPO / "LICENSE").is_file(),
                    "LICENSE file present"))

    results.append((src_has_code(),
                    "working project (app code under src/)"))

    desc = REPO / "docs/submission/description.md"
    results.append((desc.is_file() and not has_placeholders(desc),
                    "docs/submission/description.md filled (no <placeholders>)"))

    demo = REPO / "docs/submission/demo-script.md"
    results.append((demo.is_file(),
                    "docs/submission/demo-script.md present"))

    usage = REPO / "docs/submission/kiro-usage.md"
    results.append((usage.is_file() and not has_placeholders(usage),
                    "docs/submission/kiro-usage.md filled (no <placeholders>)"))

    return results


def main() -> int:
    results = check()
    ready = all(ok for ok, _ in results)
    print("Hackachusetts submission readiness — "
          + ("READY ✅" if ready else "NOT READY ⚠️"))
    for ok, label in results:
        print(f"  {'✓' if ok else '✗'} {label}")
    if not ready:
        missing = [label for ok, label in results if not ok]
        print("\nStill needed before 8 PM lock:")
        for m in missing:
            print(f"  - {m}")
    return 0 if ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
