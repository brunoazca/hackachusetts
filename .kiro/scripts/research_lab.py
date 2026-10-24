#!/usr/bin/env python3
"""Research Lab bridge: talks to the local Kiro Crew HTTP API so agents never hand-roll calls.

    python3 .kiro/scripts/research_lab.py list              # every campaign, one line each
    python3 .kiro/scripts/research_lab.py pending           # complete campaigns not yet in the repo
    python3 .kiro/scripts/research_lab.py export <id>       # write its report to knowledge/research/
    python3 .kiro/scripts/research_lab.py export-all        # export every pending one
    python3 .kiro/scripts/research_lab.py create <spec.json> [--parent <id>]   # starts it, or queues it
    python3 .kiro/scripts/research_lab.py drain             # start the oldest queued follow-up if a slot is free
    python3 .kiro/scripts/research_lab.py queue             # show queued follow-ups
    python3 .kiro/scripts/research_lab.py guard             # can we start a follow-up right now?

Reports land in knowledge/research/<id>-<slug>.md and are indexed in knowledge/research/INDEX.md.
Follow-up limits (enforced by `create`/`drain`, reported by `guard`): the Research Lab runs one
campaign at a time, at most MAX_PER_DAY are started per day by this script, depth <= MAX_DEPTH.
A follow-up that cannot start yet waits in knowledge/research/.queue.json (shown in INDEX.md).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:5476"
API = BASE + "/api/apps/auto-research/campaigns"
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "knowledge" / "research"
INDEX = OUT / "INDEX.md"
LEDGER = OUT / ".created.json"  # campaigns this script created: id, parent, depth, ts
QUEUE = OUT / ".queue.json"  # follow-up specs waiting for a free slot, oldest first
MAX_RUNNING = 1  # the Research Lab refuses a second active campaign
MAX_PER_DAY = 6
MAX_DEPTH = 2  # 0 = original campaign, 1 = follow-up, 2 = follow-up of a follow-up
# Reports that must never be copied into the repo. docs/rat-audit/demo_site.md: the exact demo
# address (an owner-occupied home) stays inside Kiro Crew; public material names the block only.
PRIVATE = {"2b8f7f81": "names the exact demo address (owner-occupied home)"}
# A house number followed by a street name. Exports drop the number and keep the street (block level),
# so no private home is identifiable from the repo.
HOUSE_NUMBER = re.compile(r"\b\d{1,5}[A-Z]?\s+((?:[A-Z][a-z]+\s){1,3}(?:St|Street|Ave|Avenue|Rd|Road|Ter|Terrace|Pl|Place|Way|Blvd)\b\.?)")


def token() -> str:
    for exe in ("kirocrew", str(Path.home() / ".local/bin/kirocrew")):
        try:
            out = subprocess.run([exe, "token"], capture_output=True, text=True, timeout=30).stdout
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
        m = re.search(r"token=([^&\s]+)", out)
        if m:
            return m.group(1)
    sys.exit("error: could not get a Kiro Crew token (is the gateway running on :5476?)")


def call(path: str, method: str = "GET", body: dict | None = None):
    sep = "&" if "?" in path else "?"
    req = urllib.request.Request(
        f"{path}{sep}token={token()}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"error: {method} {path} -> {e.code}: {e.read().decode()[:500]}")


def campaigns() -> list[dict]:
    d = call(API)
    return d.get("campaigns", d) if isinstance(d, dict) else d


def slug(name: str) -> str:
    s = re.sub(r"^rat audit\s*[—-]\s*", "", name, flags=re.I)
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60] or "campaign"


def exported_ids() -> set[str]:
    return {p.name.split("-")[0] for p in OUT.glob("*.md") if p.name != "INDEX.md"}


def load(path: Path) -> list[dict]:
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save(path: Path, items: list[dict]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(items, indent=1, ensure_ascii=False) + "\n")


def ledger() -> list[dict]:
    return load(LEDGER)


def depth_of(cid: str, by_id: dict) -> int:
    d, seen = 0, set()
    while cid and cid in by_id and by_id[cid].get("parent_id") and cid not in seen:
        seen.add(cid)
        cid = by_id[cid]["parent_id"]
        d += 1
    return d


def write_index(all_c: list[dict]) -> None:
    by_id = {c["id"]: c for c in all_c}
    have = exported_ids()
    rows = []
    for c in sorted(all_c, key=lambda c: c.get("created_at") or 0, reverse=True):
        when = time.strftime("%Y-%m-%d", time.localtime(c.get("created_at") or 0))
        link = next((f"[report]({p.name})" for p in OUT.glob(f"{c['id']}-*.md")), "—")
        if c["id"] in PRIVATE:
            link = "private, kept in Kiro Crew"
        rows.append(
            f"| {when} | `{c['id']}` | {c['name'].replace('|', '/')} | {c['status']} "
            f"| {('`' + c['parent_id'] + '`') if c.get('parent_id') else '—'} "
            f"| {depth_of(c['id'], by_id)} | {link if c['id'] in have or c['id'] in PRIVATE else '—'} |"
        )
    INDEX.write_text(
        "# Research index\n\n"
        "Every Kiro Crew Research Lab campaign and its full report. Maintained by the "
        "`einstein` crewmate via `.kiro/scripts/research_lab.py`; do not edit by hand.\n"
        "Summaries that feed the product live in `knowledge/15_boston_rat_audit.md`.\n\n"
        "| Created | ID | Campaign | Status | Parent | Depth | Report |\n"
        "|---|---|---|---|---|---|---|\n" + "\n".join(rows) + "\n"
        + (
            "\n## Queued follow-ups\n\nWaiting for the Research Lab to free its single slot, oldest first.\n\n"
            + "\n".join(f"- {q['name']} (follow-up of `{q.get('parent_id') or '—'}`)" for q in load(QUEUE))
            + "\n"
            if load(QUEUE) else ""
        )
    )


def export(cid: str, all_c: list[dict]) -> Path:
    c = next((c for c in all_c if c["id"] == cid), None)
    if not c:
        sys.exit(f"error: no campaign {cid}")
    if cid in PRIVATE:
        sys.exit(f"refused: {cid} is private ({PRIVATE[cid]}); it stays in Kiro Crew")
    report = call(f"{API}/{cid}/report").get("report") or ""
    if not report.strip():
        sys.exit(f"error: campaign {cid} has no report yet (status {c['status']})")
    OUT.mkdir(parents=True, exist_ok=True)
    when = time.strftime("%Y-%m-%d %H:%M", time.localtime(c.get("completed_at") or time.time()))
    header = (
        f"<!-- Exported from Kiro Crew Research Lab. Campaign {cid}, status {c['status']}, "
        f"{c.get('total_cycles')} cycles, completed {when}, parent {c.get('parent_id') or 'none'}. -->\n\n"
        f"> **Question:** {c.get('question', '').strip()}\n>\n"
        f"> **Success criteria:** {(c.get('success_criteria') or '—').strip()}\n\n"
    )
    path = OUT / f"{cid}-{slug(c['name'])}.md"
    report, n = HOUSE_NUMBER.subn(r"\1 (house number removed)", report)
    if n:
        print(f"  {path.name}: removed {n} house number(s), street kept", file=sys.stderr)
    path.write_text(header + report.rstrip() + "\n")
    return path


def running(all_c: list[dict]) -> list[dict]:
    return [c for c in all_c if c["status"] not in ("complete", "failed", "cancelled", "stopped", "error")]


def guard(all_c: list[dict], parent: str | None) -> list[str]:
    by_id = {c["id"]: c for c in all_c}
    problems = []
    if len(running(all_c)) >= MAX_RUNNING:
        problems.append(f"{len(running(all_c))} campaigns already running (max {MAX_RUNNING})")
    today = [e for e in ledger() if e["ts"] > time.time() - 86400]
    if len(today) >= MAX_PER_DAY:
        problems.append(f"{len(today)} follow-ups created in the last 24 h (max {MAX_PER_DAY})")
    if parent:
        if parent not in by_id:
            problems.append(f"parent {parent} does not exist")
        elif depth_of(parent, by_id) + 1 > MAX_DEPTH:
            problems.append(f"parent {parent} is already at depth {depth_of(parent, by_id)} (max {MAX_DEPTH})")
    return problems


def start_or_queue(spec: dict, all_c: list[dict], requeue: bool = True) -> bool:
    """Start the campaign if guards and the Lab's validator allow it, else queue it. True if started."""
    # Defaults match the settings every campaign so far ran with.
    body = {"max_cycles": 8, "parallel_workers": 3, "auto_approve": True, "execution_mode": "agent", **spec}
    problems = guard(all_c, body.get("parent_id"))
    if not problems:
        v = call(BASE + "/api/apps/auto-research/validate", "POST", body)
        busy = [e for e in v.get("errors", []) if "already active" in e]
        if [e for e in v.get("errors", []) if e not in busy]:
            sys.exit("invalid spec: " + "; ".join(e for e in v["errors"] if e not in busy))
        problems = busy
    if problems:
        if requeue:
            save(QUEUE, load(QUEUE) + [spec])
        print("queued (" + "; ".join(problems) + "): " + spec.get("name", "?"))
        return False
    res = call(API, "POST", body)
    cid = res.get("id") or res.get("campaign_id")
    save(LEDGER, ledger() + [{"id": cid, "parent": body.get("parent_id"), "ts": time.time(), "name": body.get("name")}])
    print(f"created {cid}: {body.get('name')}")
    write_index(campaigns())
    return True


def main(argv: list[str]) -> None:
    if not argv:
        sys.exit(__doc__)
    cmd, args = argv[0], argv[1:]
    all_c = campaigns()
    if cmd == "list":
        by_id = {c["id"]: c for c in all_c}
        for c in all_c:
            print(f"{c['id']}  {c['status']:<9} depth={depth_of(c['id'], by_id)} "
                  f"parent={c.get('parent_id') or '-':<8}  {c['name']}")
    elif cmd == "pending":
        have = exported_ids()
        for c in all_c:
            if c["status"] == "complete" and c["id"] not in have and c["id"] not in PRIVATE:
                print(f"{c['id']}  {c['name']}")
    elif cmd == "export":
        print(export(args[0], all_c).relative_to(ROOT))
        write_index(all_c)
    elif cmd == "export-all":
        have = exported_ids()
        for c in all_c:
            if c["status"] == "complete" and c["id"] not in have and c["id"] not in PRIVATE:
                print(export(c["id"], all_c).relative_to(ROOT))
        write_index(all_c)
    elif cmd == "guard":
        parent = args[args.index("--parent") + 1] if "--parent" in args else None
        problems = guard(all_c, parent)
        print("ok: a follow-up can start" if not problems else "blocked: " + "; ".join(problems))
    elif cmd == "create":
        spec = json.loads(Path(args[0]).read_text())
        parent = args[args.index("--parent") + 1] if "--parent" in args else spec.get("parent_id")
        if parent:
            spec["parent_id"] = parent
        if parent and parent in {c["id"] for c in all_c} and depth_of(parent, {c["id"]: c for c in all_c}) + 1 > MAX_DEPTH:
            sys.exit(f"refused: {parent} is already at max depth {MAX_DEPTH}; do not follow it up further")
        if any(q["name"] == spec.get("name") for q in load(QUEUE)) or any(c["name"] == spec.get("name") for c in all_c):
            sys.exit(f"refused: a campaign or queued follow-up named {spec.get('name')!r} already exists")
        if not start_or_queue(spec, all_c):
            write_index(all_c)
    elif cmd == "drain":
        queue = load(QUEUE)
        if not queue:
            print("queue empty")
        elif start_or_queue(queue[0], all_c, requeue=False):
            save(QUEUE, queue[1:])
            write_index(campaigns())
    elif cmd == "queue":
        for q in load(QUEUE):
            print(f"{q['name']}  (parent {q.get('parent_id') or '-'})")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
