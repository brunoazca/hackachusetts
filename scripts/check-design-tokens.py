#!/usr/bin/env python3
"""Piper design-token guard.

tokens.json is the source of truth. This script:
  * checks every theme color in tokens.json appears in web/src/styles/piper.css
    and web/src/lib/design-tokens.ts (so code never drifts from the spec);
  * checks WCAG contrast for the text pairs the standards promise;
  * with --write, regenerates docs/design/mockup/tokens.css from tokens.json.

  python3 scripts/check-design-tokens.py          # check only (exit 1 on drift)
  python3 scripts/check-design-tokens.py --write  # regenerate mockup tokens, then check
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKENS = ROOT / "docs/design/tokens/tokens.json"
CSS = ROOT / "web/src/styles/piper.css"
TS = ROOT / "web/src/lib/design-tokens.ts"
MOCK = ROOT / "docs/design/mockup/tokens.css"

# (foreground, background, minimum ratio) per theme — the promises in foundations/color.md
PAIRS = [
    ("fg", "bg", 4.5), ("fg-2", "bg", 4.5), ("fg-3", "bg", 4.5),
    ("accent", "bg", 4.5), ("accent-fg", "accent", 4.5),
    ("return", "bg", 4.5), ("forecast", "bg", 4.5), ("held", "bg", 4.5),
    ("fg", "card", 4.5), ("fg-2", "card", 4.5), ("fg-3", "card", 4.5),
    ("edge", "bg", 3.0),
]


def lum(hex_: str) -> float:
    h = hex_.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4)
    r, g, b = out
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a: str, b: str) -> float:
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def write_mock(t: dict) -> None:
    lines = ["/* GENERATED from docs/design/tokens/tokens.json by scripts/check-design-tokens.py --write. Do not edit. */"]
    for name, sel in (("night", ":root, [data-theme=\"night\"]"), ("bone", "[data-theme=\"bone\"], .theme-bone")):
        lines.append(f"{sel} {{")
        lines.append(f"  color-scheme: {'dark' if name == 'night' else 'light'};")
        for k, v in t["themes"][name].items():
            lines.append(f"  --p-{k}: {v};")
        lines.append("}")
    lines.append(":root {")
    for k, v in t["palette"].items():
        lines.append(f"  --c-{k}: {v};")
    for k, v in t["font"].items():
        lines.append(f"  --font-{k}: {v};")
    for k, v in t["radius"].items():
        lines.append(f"  --r-{k}: {v}px;")
    for k, v in t["motion"]["dur"].items():
        lines.append(f"  --dur-{k}: {v}ms;")
    for k, v in t["motion"]["ease"].items():
        lines.append(f"  --ease-{k}: {v};")
    for k, v in t["z"].items():
        lines.append(f"  --z-{k}: {v};")
    for k, v in t["text"].items():
        lines.append(f"  --t-{k}: {v['weight']} {v['size']}px/{v['line']}px var(--font-{v['family']});")
        lines.append(f"  --t-{k}-tracking: {v['tracking']};")
    lines.append("}")
    MOCK.parent.mkdir(parents=True, exist_ok=True)
    MOCK.write_text("\n".join(lines) + "\n")
    print(f"wrote {MOCK.relative_to(ROOT)}")


def main() -> int:
    t = json.loads(TOKENS.read_text())
    if "--write" in sys.argv:
        write_mock(t)
    errors: list[str] = []
    hexes = {v.upper() for th in t["themes"].values() for v in th.values() if v.startswith("#")}
    for path in (CSS, TS, MOCK):
        if not path.exists():
            errors.append(f"missing {path.relative_to(ROOT)}")
            continue
        found = {h.upper() for h in re.findall(r"#[0-9A-Fa-f]{6}", path.read_text())}
        for h in sorted(hexes - found):
            errors.append(f"{path.relative_to(ROOT)}: theme color {h} not present")
    for name, th in t["themes"].items():
        for fg, bg, need in PAIRS:
            r = ratio(th[fg], th[bg])
            flag = "ok " if r >= need else "LOW"
            print(f"{flag} {name:5} {fg:10} on {bg:7} {r:5.2f} (need {need})")
            if r < need:
                errors.append(f"contrast {name}: {fg} on {bg} = {r:.2f} < {need}")
    for e in errors:
        print("ERROR", e)
    print("tokens OK" if not errors else f"{len(errors)} problem(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
