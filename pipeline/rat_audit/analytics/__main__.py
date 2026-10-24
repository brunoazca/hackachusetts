"""python -m rat_audit.analytics [--steps grid,classify,...]  (uses SUPABASE_DB_URL)."""
from __future__ import annotations

import argparse
import json

from .. import db
from . import STEPS, run_all, select_steps


def _steps(value: str) -> list[str]:
    try:
        return select_steps([s.strip() for s in value.split(",")])
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from exc


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="python -m rat_audit.analytics")
    p.add_argument("--steps", type=_steps, help=f"comma-separated subset of {','.join(STEPS)} (default: all)")
    a = p.parse_args(argv)
    with db.connect() as conn:
        out = run_all(conn, a.steps)
    print(json.dumps(out, indent=2, default=str))
    return 0 if out["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
