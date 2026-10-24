#!/usr/bin/env python3
"""
Overclaim scanner for RodentOps.

Scans UI/content source for phrasings the knowledge base explicitly bans,
because they overstate what public 311 rodent data can support. This is a
deterministic first pass (no LLM): it flags candidate phrases for a human or
the rodent-honesty agent to review. A hit is a WARNING, not proof of error —
context may make it fine — but every hit must be looked at before the demo.

Exit codes:
  0  no candidate overclaims found (or no files to scan)
  1  candidate overclaims found (review required)

Usage:
  python3 .kiro/scripts/check_overclaims.py [path ...]
Defaults to scanning src/ when no path is given.
"""
import os
import re
import sys

# Each rule: (compiled regex, short label, the honest alternative)
RULES = [
    (r"\brats?\s+(are\s+)?(up|rising|increasing|down|declining)\b",
     "report trend stated as a rat-population trend",
     "say 'reports are up/down', never 'rats are up/down'"),
    (r"\brats?\s+eliminated\b|\brodents?\s+eliminated\b",
     "closure framed as elimination",
     "a closed ticket is an administrative state, not 'rats eliminated'"),
    (r"\b(problem|issue|case)\s+(solved|resolved)\b",
     "closure framed as the problem being solved",
     "closed != solved; show the documented action and any follow-up separately"),
    (r"\bpredict(s|ed|ing|ion)?\b.*\b(infestation|outbreak|rats?)\b",
     "prediction of infestation",
     "public records cannot predict infestations; show observed reports only"),
    (r"\binfestation\s+(map|risk\s*score|forecast|prediction)\b",
     "infestation risk/forecast surface",
     "rank by declared, visible criteria as a review aid, not a risk score"),
    (r"\bworst[-\s]?(served|neighborhood|block|rat)\b",
     "'worst' superlative claim",
     "report counts only; 'worst' is not supported by report data"),
    (r"\brat\s+count\b|\bnumber\s+of\s+rats\b|\bhow\s+many\s+rats\b",
     "counting rats",
     "the data counts reports, not rats"),
    (r"\b(automatically|auto)\s+(submit|send|file|dispatch|notify)\b",
     "automatic binding action",
     "nothing binding is automated — a human must confirm"),
    (r"\blive\s+work\s+orders?\b",
     "snapshot presented as live work orders",
     "label the demo data as a dated historical snapshot"),
]
COMPILED = [(re.compile(p, re.IGNORECASE), label, fix) for p, label, fix in RULES]

EXTS = (".tsx", ".jsx", ".ts", ".js", ".html", ".vue", ".md", ".json")
SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".next", "coverage"}


def scan_file(path):
    hits = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            for n, line in enumerate(fh, 1):
                for rx, label, fix in COMPILED:
                    if rx.search(line):
                        hits.append((n, label, fix, line.strip()[:120]))
    except (IOError, OSError):
        pass
    return hits


def iter_files(roots):
    for root in roots:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                if fn.endswith(EXTS):
                    yield os.path.join(dirpath, fn)


def main(argv):
    roots = argv[1:] or ["src"]
    roots = [r for r in roots if os.path.exists(r)]
    if not roots:
        print("overclaim-scan: nothing to scan (no src/ yet) — OK")
        return 0

    total = 0
    for path in iter_files(roots):
        hits = scan_file(path)
        if hits:
            print(f"\n{path}")
            for n, label, fix, snippet in hits:
                total += 1
                print(f"  L{n}: {label}")
                print(f"       > {snippet}")
                print(f"       fix: {fix}")

    if total:
        print(f"\noverclaim-scan: {total} candidate(s) to review. "
              "Each is a warning, not proof — confirm context before the demo.")
        return 1
    print("overclaim-scan: no candidate overclaims found — OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
