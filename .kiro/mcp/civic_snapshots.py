"""MCP server: query the repo's committed civic data snapshots with SQL.

Loads every data/civic/datasets/<name>/data.csv into an in-memory SQLite
database on first use (one table per dataset, hyphens -> underscores) and
exposes read-only tools. Offline, deterministic, no dependencies: this is the
same data the demo ships with, so answers Kiro gets here match the app.

Tools:
  list_datasets()                  -> table names, row counts, source titles
  describe_dataset(name)           -> columns, sample rows, README excerpt
  query_sql(sql, limit=200)        -> results of ONE read-only SELECT/WITH
"""

from __future__ import annotations

import csv
import re
import sqlite3
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # keep __pycache__ out of .kiro/
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _mcp_stdio import Tool, serve  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "civic" / "datasets"
MAX_ROWS = 1000

_conn: sqlite3.Connection | None = None
_meta: dict[str, dict] = {}


def _table(name: str) -> str:
    return re.sub(r"[^a-z0-9_]", "_", name.lower())


def _db() -> sqlite3.Connection:
    global _conn
    if _conn is not None:
        return _conn
    csv.field_size_limit(sys.maxsize)
    conn = sqlite3.connect(":memory:")
    for folder in sorted(p for p in DATA.iterdir() if (p / "data.csv").exists()):
        tbl = _table(folder.name)
        with (folder / "data.csv").open(newline="", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            if not header:
                continue
            cols = [_table(c) or f"col{i}" for i, c in enumerate(header)]
            coldefs = ", ".join('"' + c + '"' for c in cols)
            conn.execute(f'CREATE TABLE "{tbl}" ({coldefs})')
            ph = ",".join("?" * len(cols))
            rows = (r + [None] * (len(cols) - len(r)) if len(r) < len(cols) else r[: len(cols)]
                    for r in reader)
            conn.executemany(f'INSERT INTO "{tbl}" VALUES ({ph})', rows)
        readme = folder / "README.md"
        title = ""
        if readme.exists():
            first = readme.read_text(errors="replace").splitlines()
            title = next((l.lstrip("# ").strip() for l in first if l.strip()), "")
        count = conn.execute(f'SELECT COUNT(*) FROM "{tbl}"').fetchone()[0]
        _meta[tbl] = {"folder": folder.name, "title": title, "rows": count, "columns": cols}
    conn.commit()
    # Read-only from here on: block any write the model might attempt.
    conn.execute("PRAGMA query_only = ON")
    _conn = conn
    return conn


def list_datasets() -> str:
    _db()
    lines = ["table | rows | title (source folder: data/civic/datasets/<folder>)"]
    for tbl, m in _meta.items():
        lines.append(f"{tbl} | {m['rows']} | {m['title']} (folder: {m['folder']})")
    lines.append("\nAll values are stored as TEXT; CAST(x AS REAL) for math. Snapshot saved 2026-10-18.")
    return "\n".join(lines)


def describe_dataset(name: str) -> str:
    conn = _db()
    tbl = _table(name)
    if tbl not in _meta:
        return f"Unknown dataset '{name}'. Call list_datasets first."
    m = _meta[tbl]
    cur = conn.execute(f'SELECT * FROM "{tbl}" LIMIT 3')
    sample = [dict(zip(m["columns"], r)) for r in cur.fetchall()]
    readme = DATA / m["folder"] / "README.md"
    excerpt = readme.read_text(errors="replace")[:1500] if readme.exists() else "(no README)"
    return (f"table: {tbl}\nrows: {m['rows']}\ncolumns: {', '.join(m['columns'])}\n"
            f"sample: {sample}\n\nREADME (source + license):\n{excerpt}")


_READ_ONLY = re.compile(r"^\s*(select|with)\b", re.IGNORECASE)


def query_sql(sql: str, limit: int = 200) -> str:
    conn = _db()
    stmt = sql.strip().rstrip(";")
    if ";" in stmt or not _READ_ONLY.match(stmt):
        return "Only a single SELECT or WITH statement is allowed."
    limit = max(1, min(int(limit), MAX_ROWS))
    cur = conn.execute(stmt)
    cols = [d[0] for d in cur.description or []]
    rows = cur.fetchmany(limit + 1)
    more = len(rows) > limit
    rows = rows[:limit]
    out = [" | ".join(cols)] + [" | ".join("" if v is None else str(v) for v in r) for r in rows]
    if more:
        out.append(f"... truncated at {limit} rows")
    out.append(f"({len(rows)} row(s); source: committed snapshot in data/civic/datasets)")
    return "\n".join(out)


if __name__ == "__main__":
    serve("civic-snapshots", "1.0.0", [
        Tool("list_datasets", "List the committed Massachusetts civic data snapshots (tables, row counts, titles).",
             {"type": "object", "properties": {}}, list_datasets),
        Tool("describe_dataset", "Columns, 3 sample rows and README (source URL, license) for one snapshot table.",
             {"type": "object", "properties": {"name": {"type": "string", "description": "Table or folder name, e.g. boston-311"}},
              "required": ["name"]}, describe_dataset),
        Tool("query_sql", "Run ONE read-only SQLite SELECT/WITH over the snapshots. Tables are dataset names with _ for -, e.g. boston_311, vision_zero.",
             {"type": "object", "properties": {"sql": {"type": "string"}, "limit": {"type": "integer", "default": 200}},
              "required": ["sql"]}, query_sql),
    ])
