"""MCP server: live MBTA V3 API (alerts, routes, stops, accessibility facilities).

Public API, no key required (about 20 requests/minute without one). Set
MBTA_API_KEY in your environment for 1000/minute; never commit it.
Docs: https://api-v3.mbta.com/docs/swagger/index.html

Tools:
  alerts(route=None, stop=None, activity=None, limit=20)
  routes(route_type=None)
  stops(route, limit=100)
  facilities(stop, facility_type=None)   # elevators, escalators, ramps...
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.dont_write_bytecode = True  # keep __pycache__ out of .kiro/
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _mcp_stdio import Tool, serve  # noqa: E402

BASE = "https://api-v3.mbta.com"


def _get(path: str, params: dict) -> dict:
    q = {k: v for k, v in params.items() if v not in (None, "")}
    url = f"{BASE}{path}?{urllib.parse.urlencode(q)}"
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.api+json"})
    key = os.environ.get("MBTA_API_KEY")
    if key:
        req.add_header("x-api-key", key)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def _stamp() -> str:
    from datetime import datetime, timezone
    return f"(live from {BASE}, fetched {datetime.now(timezone.utc).isoformat(timespec='seconds')})"


def alerts(route: str | None = None, stop: str | None = None,
           activity: str | None = None, limit: int = 20) -> str:
    data = _get("/alerts", {"filter[route]": route, "filter[stop]": stop,
                            "filter[activity]": activity, "page[limit]": min(int(limit), 100)})
    out = []
    for a in data.get("data", []):
        at = a["attributes"]
        routes = sorted({e.get("route") for e in at.get("informed_entity", []) if e.get("route")})
        periods = at.get("active_period") or [{}]
        out.append(f"- [{at.get('effect')}, severity {at.get('severity')}] {at.get('header')}\n"
                   f"  routes: {', '.join(routes) or '-'} | active: {periods[0].get('start')} -> {periods[0].get('end')}"
                   f" | updated: {at.get('updated_at')} | id: {a['id']}")
    return ("\n".join(out) or "No matching alerts.") + "\n" + _stamp()


def routes(route_type: str | None = None) -> str:
    data = _get("/routes", {"filter[type]": route_type})
    out = [f"{r['id']} | type {r['attributes']['type']} | {r['attributes']['long_name'] or r['attributes']['short_name']}"
           for r in data.get("data", [])]
    return "id | type (0 light rail, 1 subway, 2 rail, 3 bus, 4 ferry) | name\n" + "\n".join(out) + "\n" + _stamp()


def stops(route: str, limit: int = 100) -> str:
    data = _get("/stops", {"filter[route]": route, "page[limit]": min(int(limit), 500)})
    wc = {0: "unknown", 1: "accessible", 2: "not accessible"}
    out = [f"{s['id']} | {s['attributes']['name']} | wheelchair: {wc.get(s['attributes'].get('wheelchair_boarding'), '?')}"
           f" | {s['attributes'].get('latitude')},{s['attributes'].get('longitude')}"
           for s in data.get("data", [])]
    return "stop id | name | wheelchair boarding | lat,lon\n" + "\n".join(out) + "\n" + _stamp()


def facilities(stop: str, facility_type: str | None = None) -> str:
    data = _get("/facilities", {"filter[stop]": stop, "filter[type]": facility_type})
    out = [f"{f['id']} | {f['attributes'].get('type')} | {f['attributes'].get('long_name') or f['attributes'].get('short_name')}"
           for f in data.get("data", [])]
    return ("facility id | type | name\n" + "\n".join(out) if out else "No facilities found.") + "\n" + _stamp()


if __name__ == "__main__":
    serve("mbta", "1.0.0", [
        Tool("alerts", "Current MBTA service alerts, optionally filtered by route id (e.g. Red, 39), stop id, or activity (e.g. USING_WHEELCHAIR).",
             {"type": "object", "properties": {"route": {"type": "string"}, "stop": {"type": "string"},
                                               "activity": {"type": "string"}, "limit": {"type": "integer", "default": 20}}},
             alerts),
        Tool("routes", "List MBTA routes. route_type: 0 light rail, 1 subway, 2 commuter rail, 3 bus, 4 ferry; comma list allowed.",
             {"type": "object", "properties": {"route_type": {"type": "string"}}}, routes),
        Tool("stops", "Stops on a route with wheelchair-boarding status and coordinates.",
             {"type": "object", "properties": {"route": {"type": "string"}, "limit": {"type": "integer", "default": 100}},
              "required": ["route"]}, stops),
        Tool("facilities", "Accessibility and station facilities (ELEVATOR, ESCALATOR, RAMP, ...) at a stop id.",
             {"type": "object", "properties": {"stop": {"type": "string"}, "facility_type": {"type": "string"}},
              "required": ["stop"]}, facilities),
    ])
