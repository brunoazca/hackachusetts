#!/usr/bin/env python3
"""Smoke-test every MCP server in .kiro/settings/mcp.json.

For each enabled server: launch it exactly as Kiro would (same command, args,
env, cwd = repo root), send initialize + tools/list, and for our own data
servers make one real tool call. Prints one line per server and exits 1 if
any server fails, so it can back a hook or a cron.

    python3 .kiro/scripts/check_mcp.py            # all servers
    python3 .kiro/scripts/check_mcp.py mbta civic-snapshots
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / ".kiro" / "settings" / "mcp.json"

# One cheap, real call per server we own, proving data actually flows.
PROBES = {
    "civic-snapshots": ("query_sql", {"sql": "SELECT neighborhood, COUNT(*) n FROM boston_311 GROUP BY 1 ORDER BY n DESC LIMIT 3"}),
    "mbta": ("alerts", {"route": "Red", "limit": 1}),
    "boston-opendata": ("ckan__search_datasets", {"query": "311", "limit": 1}),
    "massgis": ("arcgis__search_datasets", {"q": "environmental justice", "limit": 1}),
}
TIMEOUT_S = 180  # first uv/npx run downloads packages


def _rpc(proc: subprocess.Popen, msg_id: int, method: str, params: dict | None = None) -> dict:
    proc.stdin.write(json.dumps({"jsonrpc": "2.0", "id": msg_id, "method": method, "params": params or {}}) + "\n")
    proc.stdin.flush()
    while True:
        line = proc.stdout.readline()
        if not line:
            raise RuntimeError("server closed stdout")
        line = line.strip()
        if not line.startswith("{"):
            continue  # tolerate stray non-protocol output
        msg = json.loads(line)
        if msg.get("id") == msg_id:
            if "error" in msg:
                raise RuntimeError(msg["error"].get("message"))
            return msg["result"]


def check(name: str, spec: dict) -> tuple[bool, str]:
    env = {**os.environ, **spec.get("env", {})}
    proc = subprocess.Popen([spec["command"], *spec.get("args", [])], cwd=ROOT, env=env,
                            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            text=True)
    killer = threading.Timer(TIMEOUT_S, proc.kill)
    killer.start()
    start = time.time()
    try:
        _rpc(proc, 1, "initialize", {"protocolVersion": "2025-03-26", "capabilities": {},
                                     "clientInfo": {"name": "check_mcp", "version": "1"}})
        proc.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
        proc.stdin.flush()
        tools = [t["name"] for t in _rpc(proc, 2, "tools/list")["tools"]]
        detail = f"{len(tools)} tools"
        if name in PROBES:
            tool, args = PROBES[name]
            res = _rpc(proc, 3, "tools/call", {"name": tool, "arguments": args})
            text = res["content"][0]["text"]
            if res.get("isError"):
                return False, f"{detail}; {tool} returned error: {text[:120]}"
            first = next((l for l in text.splitlines() if l.strip()), "")
            detail += f"; {tool} ok: {first[:70]!r}"
        return True, f"{detail} ({time.time() - start:.1f}s)"
    except Exception as exc:
        err = proc.stderr.read()[-300:] if proc.poll() is not None else ""
        return False, f"{exc} {err.strip()}"
    finally:
        killer.cancel()
        proc.kill()


def main() -> int:
    servers = json.loads(CONFIG.read_text())["mcpServers"]
    wanted = sys.argv[1:] or [n for n, s in servers.items() if not s.get("disabled")]
    failed = 0
    for name in wanted:
        ok, detail = check(name, servers[name])
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name:16} {detail}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
