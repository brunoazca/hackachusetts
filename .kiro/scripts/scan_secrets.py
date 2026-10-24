#!/usr/bin/env python3
"""Secret scanner for this public repo. Deterministic, standard library only.

Finds credentials before they reach GitHub or the demo video:
  * every non-empty value in the local, git-ignored .env.local (exact match)
  * common credential formats (AWS, GitHub, Slack, private keys, JWT-ish)
  * "token/secret/api_key/password = <long value>" assignments

It never prints a secret, only file:line and which rule matched.

    python3 .kiro/scripts/scan_secrets.py            # tracked + untracked-not-ignored files
    python3 .kiro/scripts/scan_secrets.py --staged   # staged content (git pre-commit hook)

Exit 0 = clean, 1 = findings.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV_LOCAL = ROOT / ".env.local"

# Files that may legitimately mention variable names with empty values.
SKIP_FILES = {".env.local", "scan_secrets.py"}
SKIP_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".zip", ".pdf", ".ico", ".mp4", ".mov"}
MAX_BYTES = 5_000_000

PATTERNS = [
    # X-Amz-Credential=AKIA... inside public presigned S3 URLs (City data links) is a
    # key ID plus an expiring signature, not a secret; skip that form.
    ("aws-access-key", re.compile(r"(?<!Credential=)\b(AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("github-token", re.compile(r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b")),
    ("slack-token", re.compile(r"\bxox[abpors]-[A-Za-z0-9-]{10,}\b")),
    ("private-key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("openai/anthropic-key", re.compile(r"\bsk-(ant-)?[A-Za-z0-9_-]{24,}\b")),
    ("secret-assignment", re.compile(
        r"(?i)\b[\w-]*(token|secret|api[_-]?key|apikey|password|passwd)[\w-]*\b\s*[:=]\s*[\"']?"
        r"(?!\$\{)(?!<)([A-Za-z0-9_\-/+]{16,})")),
]


def env_local_values() -> list[str]:
    if not ENV_LOCAL.exists():
        return []
    vals = []
    for line in ENV_LOCAL.read_text(errors="replace").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            v = line.split("=", 1)[1].strip().strip('"').strip("'")
            if len(v) >= 8:
                vals.append(v)
    return vals


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout


def files_to_scan(staged: bool) -> list[str]:
    if staged:
        out = git("diff", "--cached", "--name-only", "--diff-filter=ACMR")
    else:
        out = git("ls-files", "--cached", "--others", "--exclude-standard")
    names = [n for n in out.splitlines() if n]
    # The synced audit log is a known risk; always scan it if present.
    audit = ".kiro/audit/audit.log"
    if not staged and (ROOT / audit).exists() and audit not in names:
        names.append(audit)
    return names


def read(name: str, staged: bool) -> str | None:
    if Path(name).name in SKIP_FILES or Path(name).suffix.lower() in SKIP_SUFFIXES:
        return None
    try:
        if staged:
            data = subprocess.run(["git", "show", f":{name}"], cwd=ROOT, capture_output=True, check=True).stdout
        else:
            p = ROOT / name
            if not p.is_file() or p.stat().st_size > MAX_BYTES:
                return None
            data = p.read_bytes()
    except (subprocess.CalledProcessError, OSError):
        return None
    if b"\x00" in data[:4096]:
        return None  # binary
    return data.decode("utf-8", errors="replace")


def scan(staged: bool) -> list[str]:
    secrets = env_local_values()
    findings = []
    for name in files_to_scan(staged):
        text = read(name, staged)
        if text is None:
            continue
        for lineno, line in enumerate(text.splitlines(), 1):
            for s in secrets:
                if s in line:
                    findings.append(f"{name}:{lineno}: value from .env.local")
            for rule, rx in PATTERNS:
                if rx.search(line):
                    findings.append(f"{name}:{lineno}: {rule}")
    return findings


def main() -> int:
    staged = "--staged" in sys.argv
    findings = scan(staged)
    if not findings:
        print("secret scan: clean" + (" (staged)" if staged else ""))
        return 0
    print(f"secret scan: {len(findings)} finding(s). Remove them before committing:")
    for f in findings[:50]:
        print("  " + f)
    print("Secrets belong in .env.local (git-ignored). See knowledge/23_live_data_sources.md.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
