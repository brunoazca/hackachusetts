"""Inline data.json into film.html → index.html (a single file that opens offline except for web fonts)."""
from pathlib import Path

here = Path(__file__).parent
html = (here / "film.html").read_text().replace("__DATA__", (here / "data.json").read_text())
(here / "index.html").write_text(html)
print("wrote", here / "index.html", len(html) // 1024, "KB")
