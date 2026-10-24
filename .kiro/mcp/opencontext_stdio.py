"""Stdio bridge for the City of Boston's OpenContext MCP server.

OpenContext (https://github.com/CityOfBoston/OpenContext, MIT, City of Boston
DoIT) ships as an HTTP/Lambda server. Kiro launches MCP servers over stdio, so
this bridge reuses OpenContext's own PluginManager + MCPServer unchanged and
just swaps the transport: one JSON-RPC message per line on stdin/stdout.

Usage (Kiro does this for you, see .kiro/settings/mcp.json):
    OPENCONTEXT_CONFIG=.kiro/mcp/opencontext/boston-ckan.yaml \
      uv run --python 3.12 --with "opencontext @ git+..." python .kiro/mcp/opencontext_stdio.py

stdout is reserved for protocol messages; all logging goes to stderr.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

import yaml

# OpenContext logs JSON to stdout by default; force every handler to stderr
# before importing it so nothing corrupts the protocol stream.
logging.basicConfig(stream=sys.stderr, level=logging.WARNING, force=True)

from core.mcp_server import MCPServer  # noqa: E402  (OpenContext package)
from core.plugin_manager import PluginManager  # noqa: E402


def _load_config() -> dict:
    path = os.environ.get("OPENCONTEXT_CONFIG")
    if not path:
        sys.exit("OPENCONTEXT_CONFIG is not set")
    cfg_path = Path(path)
    if not cfg_path.is_absolute():
        cfg_path = Path(__file__).resolve().parents[2] / cfg_path
    with cfg_path.open() as f:
        return yaml.safe_load(f)


def _quiet_stdout_logging() -> None:
    for logger in [logging.getLogger()] + [
        logging.getLogger(n) for n in logging.root.manager.loggerDict
    ]:
        for h in getattr(logger, "handlers", []):
            if isinstance(h, logging.StreamHandler) and h.stream is sys.stdout:
                h.setStream(sys.stderr)


async def main() -> None:
    config = _load_config()
    pm = PluginManager(config)
    await pm.load_plugins()
    server = MCPServer(pm)
    _quiet_stdout_logging()

    loop = asyncio.get_running_loop()
    reader = asyncio.StreamReader()
    await loop.connect_read_pipe(lambda: asyncio.StreamReaderProtocol(reader), sys.stdin)

    try:
        while True:
            line = await reader.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue
            try:
                request = json.loads(line)
            except json.JSONDecodeError:
                out = {"jsonrpc": "2.0", "id": None,
                       "error": {"code": -32700, "message": "Parse error"}}
                sys.stdout.write(json.dumps(out) + "\n")
                sys.stdout.flush()
                continue
            response = await server.handle_request(request)
            _quiet_stdout_logging()
            if response is not None:
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()
    finally:
        await pm.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
