"""Smoothed forecast surface for the map: nested contour polygons clipped to land.

The 250 m block values are interpolated onto a 25 m raster (bilinear + light Gaussian),
cut at fixed levels of expected reports (1, 1.5, 2, …), turned into polygons, rounded,
and clipped to Boston's land (census tracts, which exclude the harbor and the Charles).
Each level is a filled area "expected ≥ level", so drawing them in order gives a smooth
color transition instead of hard-edged squares, and nothing below 1 expected report shows.

Periods: '4w' = total over the forecast weeks, plus one per forecast week (ISO date).
Writes `model_forecast_surface`; never commits — the caller owns the transaction.
"""
from __future__ import annotations

import json

import numpy as np
import psycopg
from pyproj import Transformer
from scipy import ndimage
from shapely import wkb
from shapely.geometry import box, mapping
from shapely.ops import transform as shp_transform, unary_union

from .grid import CELL_M, SRID_LL, SRID_M

LEVELS = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]
UPSAMPLE = 10  # 250 m → 25 m pixels
PX = CELL_M / UPSAMPLE
_to_ll = Transformer.from_crs(SRID_M, SRID_LL, always_xy=True)


def land_boundary(conn: psycopg.Connection):
    """Boston land in EPSG:26986 (union of census tracts; water areas are not in any tract)."""
    row = conn.execute(
        "select st_asbinary(st_transform(st_union(geom::geometry), %s)) from tracts where city = 'boston'",
        (SRID_M,),
    ).fetchone()
    return wkb.loads(bytes(row[0])).buffer(0) if row and row[0] else None


def raster(values: dict[tuple[int, int], float]) -> tuple[np.ndarray, int, int]:
    """Upsample block values to a smooth 25 m raster. Returns (array[x, y], col0, row0)."""
    cols = [c for c, _ in values]
    rows = [r for _, r in values]
    col0, row0 = min(cols) - 1, min(rows) - 1  # one empty block of margin so contours close
    grid = np.zeros((max(cols) - col0 + 2, max(rows) - row0 + 2), dtype=float)
    for (c, r), v in values.items():
        grid[c - col0, r - row0] = v
    fine = ndimage.zoom(grid, UPSAMPLE, order=1, grid_mode=True, mode="grid-constant")
    return ndimage.gaussian_filter(fine, sigma=UPSAMPLE / 4), col0, row0


def contours(fine: np.ndarray, col0: int, row0: int, land, levels=LEVELS) -> list[tuple[float, object]]:
    """Polygons (EPSG:26986) where the raster is ≥ each level, smoothed and clipped to land."""
    x0, y0 = col0 * CELL_M, row0 * CELL_M
    out = []
    for lvl in levels:
        ix, iy = np.nonzero(fine >= lvl)
        if len(ix) == 0:
            break
        boxes = [box(x0 + i * PX, y0 + j * PX, x0 + (i + 1) * PX, y0 + (j + 1) * PX) for i, j in zip(ix, iy)]
        poly = unary_union(boxes).buffer(PX * 1.2, join_style="round").buffer(-PX * 1.2, join_style="round")
        poly = poly.simplify(PX / 3)
        if land is not None:
            poly = poly.intersection(land)
        if not poly.is_empty:
            out.append((lvl, poly))
    return out


def to_geojson(poly) -> dict:
    return mapping(shp_transform(lambda x, y, z=None: _to_ll.transform(x, y), poly))


def build_surfaces(conn: psycopg.Connection, run_id: str) -> dict:
    rows = conn.execute(
        "select cell_id, week_start, expected from predictions where model_run_id = %s and actual is null",
        (run_id,),
    ).fetchall()
    if not rows:
        return {"periods": 0}
    by_period: dict[str, dict[tuple[int, int], float]] = {}
    for cid, week, exp in rows:
        _, c, r = cid.split("_")
        key = (int(c), int(r))
        by_period.setdefault(str(week), {})[key] = float(exp)
        tot = by_period.setdefault("4w", {})
        tot[key] = tot.get(key, 0.0) + float(exp)

    land = land_boundary(conn)
    conn.execute("delete from model_forecast_surface where model_run_id = %s", (run_id,))
    counts = {}
    for period, values in by_period.items():
        fine, col0, row0 = raster(values)
        polys = contours(fine, col0, row0, land)
        counts[period] = len(polys)
        for lvl, poly in polys:
            conn.execute(
                "insert into model_forecast_surface (model_run_id, period, level, geojson) values (%s, %s, %s, %s::jsonb)",
                (run_id, period, lvl, json.dumps(to_geojson(poly))),
            )
    return {"periods": len(by_period), "levels_per_period": counts}


__all__ = ["LEVELS", "land_boundary", "raster", "contours", "build_surfaces"]
