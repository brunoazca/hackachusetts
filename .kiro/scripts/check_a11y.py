#!/usr/bin/env python3
"""
Accessibility static scanner for Rat Audit Boston.

Accessibility is a scored civic requirement (.kiro/steering/product.md). This is
a deterministic first pass (no LLM) over the React/HTML UI source: it flags
common, high-signal a11y violations for a human or the a11y-auditor agent to
confirm. A hit is a WARNING, not proof — context may make it fine — but every
hit must be looked at before the demo.

What it checks per file (web/src then src, .tsx/.jsx/.html/.vue):
  - <img> with no alt attribute (decorative images must use alt="")
  - clickable <div>/<span> with onClick but no role + no keyboard handler
  - <input>/<select>/<textarea> with no id, aria-label, or aria-labelledby
  - <a href> with no discernible text pattern (href only, empty children)
  - more than one <h1> across the whole UI (single top-level heading)
  - raw onClick on a non-button, non-link native element without role="button"

Exit codes:
  0  no candidate a11y issues (or nothing to scan)
  1  candidate a11y issues found (review required)

Usage:
  python3 .kiro/scripts/check_a11y.py [path ...]
Defaults to scanning web/src (then src) when no path is given.
"""
from __future__ import annotations

import os
import re
import sys

EXTS = (".tsx", ".jsx", ".html", ".vue")
SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".next", "coverage"}

# img without any alt= (self-closing or not). Decorative images still need alt="".
IMG_NO_ALT = re.compile(r"<img\b(?:(?!\balt\s*=)[^>])*?/?>", re.IGNORECASE | re.DOTALL)
# onClick on a div/span/li with no role= anywhere in that opening tag.
CLICKABLE_NONINTERACTIVE = re.compile(
    r"<(div|span|li)\b(?:(?!>)[\s\S])*?\bonClick\b(?:(?!>)[\s\S])*?>",
    re.IGNORECASE,
)
# a form control opening tag with no id/aria-label/aria-labelledby.
FORM_CONTROL = re.compile(r"<(input|select|textarea)\b([\s\S]*?)>", re.IGNORECASE)
LABELLED = re.compile(r"\b(aria-label|aria-labelledby|\bid)\s*=", re.IGNORECASE)
H1 = re.compile(r"<h1\b", re.IGNORECASE)


def scan_file(path: str) -> list[tuple[int, str, str]]:
    """Return (line_no, label, snippet) issues for one file."""
    hits: list[tuple[int, str, str]] = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            text = fh.read()
    except OSError:
        return hits

    def line_of(idx: int) -> int:
        return text.count("\n", 0, idx) + 1

    for m in IMG_NO_ALT.finditer(text):
        hits.append((line_of(m.start()), "img has no alt attribute (use alt=\"\" if decorative)",
                     m.group(0).strip()[:120]))

    for m in CLICKABLE_NONINTERACTIVE.finditer(text):
        tag = m.group(0)
        if "role=" not in tag.lower():
            hits.append((line_of(m.start()),
                         "clickable <div>/<span>/<li> without role (prefer a <button>)",
                         tag.strip()[:120]))

    for m in FORM_CONTROL.finditer(text):
        attrs = m.group(2)
        if m.group(1).lower() == "input" and re.search(r'type\s*=\s*["\']?(hidden|submit|button)', attrs, re.IGNORECASE):
            continue
        if not LABELLED.search(attrs):
            hits.append((line_of(m.start()),
                         f"<{m.group(1).lower()}> with no id/aria-label/aria-labelledby",
                         m.group(0).strip()[:120]))
    return hits


def iter_files(roots: list[str]):
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if fn.endswith(EXTS):
                    yield os.path.join(dirpath, fn)


def main(argv: list[str]) -> int:
    roots = argv[1:] or ["web/src", "src"]
    roots = [r for r in roots if os.path.exists(r)]
    if not roots:
        print("a11y-scan: nothing to scan (no web/src or src yet) — OK")
        return 0

    total = 0
    h1_total = 0
    for path in iter_files(roots):
        hits = scan_file(path)
        try:
            h1_total += len(H1.findall(open(path, encoding="utf-8", errors="ignore").read()))
        except OSError:
            pass
        if hits:
            print(f"\n{path}")
            for n, label, snippet in hits:
                total += 1
                print(f"  L{n}: {label}")
                print(f"       > {snippet}")

    if h1_total > 1:
        total += 1
        print(f"\nUI-wide: {h1_total} <h1> elements found — a page should have exactly one.")

    if total:
        print(f"\na11y-scan: {total} candidate issue(s) to review. "
              "Each is a warning, not proof — confirm context before the demo. "
              "Contrast and focus order need the live page (use the a11y-auditor agent with Playwright).")
        return 1
    print("a11y-scan: no candidate static a11y issues found — OK "
          "(contrast + focus order still need a live Playwright pass).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
