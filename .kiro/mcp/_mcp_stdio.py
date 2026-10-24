"""Tiny dependency-free MCP stdio server helper (JSON-RPC 2.0, one message per line).

Used by the repo's own MCP servers in .kiro/mcp/. Implements just what Kiro
needs: initialize, ping, tools/list, tools/call. Standard library only, so a
teammate needs nothing but python3.
"""

from __future__ import annotations

import json
import sys
import traceback
from typing import Any, Callable, Dict, List

PROTOCOL_VERSION = "2025-03-26"


class Tool:
    def __init__(self, name: str, description: str, schema: Dict[str, Any],
                 fn: Callable[..., str]) -> None:
        self.name, self.description, self.schema, self.fn = name, description, schema, fn

    def spec(self) -> Dict[str, Any]:
        return {"name": self.name, "description": self.description, "inputSchema": self.schema}


def serve(server_name: str, version: str, tools: List[Tool]) -> None:
    by_name = {t.name: t for t in tools}

    def reply(msg_id: Any, result: Any = None, error: Any = None) -> None:
        msg: Dict[str, Any] = {"jsonrpc": "2.0", "id": msg_id}
        if error is not None:
            msg["error"] = error
        else:
            msg["result"] = result
        sys.stdout.write(json.dumps(msg) + "\n")
        sys.stdout.flush()

    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            req = json.loads(raw)
        except json.JSONDecodeError:
            reply(None, error={"code": -32700, "message": "Parse error"})
            continue
        msg_id, method = req.get("id"), req.get("method")
        params = req.get("params") or {}
        if msg_id is None:  # notification
            continue
        if method == "initialize":
            reply(msg_id, {
                "protocolVersion": params.get("protocolVersion", PROTOCOL_VERSION),
                "capabilities": {"tools": {}},
                "serverInfo": {"name": server_name, "version": version},
            })
        elif method == "ping":
            reply(msg_id, {})
        elif method == "tools/list":
            reply(msg_id, {"tools": [t.spec() for t in tools]})
        elif method == "tools/call":
            tool = by_name.get(params.get("name"))
            if tool is None:
                reply(msg_id, error={"code": -32602, "message": f"Unknown tool: {params.get('name')}"})
                continue
            try:
                text = tool.fn(**(params.get("arguments") or {}))
                reply(msg_id, {"content": [{"type": "text", "text": text}], "isError": False})
            except Exception as exc:  # report tool errors to the model, keep serving
                traceback.print_exc(file=sys.stderr)
                reply(msg_id, {"content": [{"type": "text", "text": f"Error: {exc}"}], "isError": True})
        else:
            reply(msg_id, error={"code": -32601, "message": f"Method not found: {method}"})
