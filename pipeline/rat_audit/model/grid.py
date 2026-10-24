"""250 m grid helper (fallback) for the prediction model.

Analytics (Carol) owns the authoritative `grid_cells` table. This module is a
*read-only, pure* fallback the model can use when `grid_cells` is empty: it
builds the same 250 m square grid in EPSG:26986 (Massachusetts State Plane,
meters), clipped to the Boston footprint, and returns the cells in memory.

It never writes to `grid_cells` — `build_grid()` returns a list of dicts and
`load_or_build_cells()` reads the real table first, only falling back to the
in-memory grid when the table has no rows. Cell ids match Carol's scheme
(`g250_<col>_<row>`) so downstream joins are stable either way.

Design: `.kiro/specs/rat-audit/design.md` §4 (Grid) and §5 (Prediction).
"""
from __future__ import annotations

from typing import Iterable

import psycopg
from pyproj import Transformer
from shapely.geometry import Polygon, box, mapping, shape
from shapely.ops import transform as shp_transform, unary_union

CELL_M = 250  # cell edge length in meters (EPSG:26986 units)
SRID_M = 26986  # Massachusetts State Plane, meters
SRID_LL = 4326  # WGS84 lon/lat (matches grid_cells.geom geography)

# Boston extent in EPSG:26986 (meters), a generous bounding box covering all
# neighborhoods incl. Hyde Park, East Boston and the Harbor Islands. Used only
# when no boundary geometry is supplied and the DB footprint is unavailable.
_BOSTON_BBOX_26986 = (221_000.0, 881_000.0, 245_000.0, 906_000.0)  # minx, miny, maxx, maxy

_to_m = Transformer.from_crs(SRID_LL, SRID_M, always_xy=True)
_to_ll = Transformer.from_crs(SRID_M, SRID_LL, always_xy=True)


def _project_to_m(geom_ll):
    """Project a lon/lat (EPSG:4326) shapely geometry to EPSG:26986 meters."""
    return shp_transform(lambda x, y, z=None: _to_m.transform(x, y), geom_ll)


def _project_to_ll(geom_m):
    """Project an EPSG:26986 shapely geometry back to lon/lat (EPSG:4326)."""
    return shp_transform(lambda x, y, z=None: _to_ll.transform(x, y), geom_m)


def build_grid(
    boundary_ll=None,
    *,
    cell_m: int = CELL_M,
) -> list[dict]:
    """Build 250 m square cells over Boston, clipped to ``boundary_ll``.

    Pure function: no DB access, no side effects. Returns a list of cells, each::

        {
            "id": "g250_<col>_<row>",   # matches grid_cells.id scheme
            "col": int, "row": int,
            "geom_ll": shapely.Polygon,  # EPSG:4326 lon/lat, ready for geography(4326)
            "lon": float, "lat": float,  # centroid, EPSG:4326
        }

    Parameters
    ----------
    boundary_ll:
        Optional clip boundary in EPSG:4326 — a shapely geometry, a GeoJSON
        mapping, or an iterable of such. Cells that do not intersect it are
        dropped and each kept cell is clipped to it. When ``None`` the full
        Boston bounding box is tiled (no clipping).
    cell_m:
        Cell edge length in meters (default 250).
    """
    boundary_m = None
    if boundary_ll is not None:
        boundary_m = _project_to_m(_coerce_boundary(boundary_ll))
        minx, miny, maxx, maxy = boundary_m.bounds
    else:
        minx, miny, maxx, maxy = _BOSTON_BBOX_26986

    # Snap the origin to a global cell_m lattice so ids are stable regardless of
    # the extent used — col/row index off (0, 0), not off the local min corner.
    col0 = int(minx // cell_m)
    row0 = int(miny // cell_m)
    col1 = int(maxx // cell_m)
    row1 = int(maxy // cell_m)

    cells: list[dict] = []
    for col in range(col0, col1 + 1):
        for row in range(row0, row1 + 1):
            x0 = col * cell_m
            y0 = row * cell_m
            square = box(x0, y0, x0 + cell_m, y0 + cell_m)
            if boundary_m is not None:
                if not square.intersects(boundary_m):
                    continue
                clipped = square.intersection(boundary_m)
                if clipped.is_empty or clipped.area <= 0:
                    continue
            else:
                clipped = square
            geom_ll = _project_to_ll(clipped)
            cen = _project_to_ll(clipped.centroid)
            cells.append(
                {
                    "id": f"g250_{col}_{row}",
                    "col": col,
                    "row": row,
                    "geom_ll": geom_ll,
                    "lon": float(cen.x),
                    "lat": float(cen.y),
                }
            )
    return cells


def boston_boundary_from_db(conn: psycopg.Connection):
    """Derive a Boston clip boundary from the data footprint in the DB.

    There is no neighborhood-boundary table, so approximate Boston's extent from
    the convex hull of Boston rodent/311 incident points, buffered 250 m. Pure
    read — no writes. Returns a shapely geometry in EPSG:4326, or ``None`` if
    there are no usable points.
    """
    row = conn.execute(
        """
        select st_asgeojson(
                 st_buffer(
                   st_convexhull(st_collect(geom::geometry))::geography, %s
                 )::geometry
               )
        from incidents
        where city = 'boston' and geom is not null
        """,
        (CELL_M,),
    ).fetchone()
    if not row or not row[0]:
        return None
    return shape(__import__("json").loads(row[0]))


def grid_cells_count(conn: psycopg.Connection) -> int:
    """Rows in Carol's authoritative grid_cells table (read-only)."""
    return int(conn.execute("select count(*) from grid_cells").fetchone()[0])


def load_or_build_cells(conn: psycopg.Connection) -> list[dict]:
    """Return grid cells, preferring Carol's `grid_cells`, else the fallback.

    Never writes to `grid_cells`. If the table has rows, read them (id, lon,
    lat, geom as GeoJSON). Otherwise build the 250 m grid in memory clipped to
    the Boston data footprint (or the bounding box if no footprint is found).
    """
    if grid_cells_count(conn) > 0:
        out: list[dict] = []
        for cid, lon, lat, gj in conn.execute(
            "select id, lon, lat, st_asgeojson(geom::geometry) from grid_cells"
        ):
            out.append(
                {
                    "id": cid,
                    "col": None,
                    "row": None,
                    "geom_ll": shape(__import__("json").loads(gj)) if gj else None,
                    "lon": float(lon),
                    "lat": float(lat),
                }
            )
        return out
    return build_grid(boston_boundary_from_db(conn))


def cells_to_wkt(cells: Iterable[dict]) -> list[tuple[str, str, float, float]]:
    """Helper: (id, geom_wkt_4326, lon, lat) tuples for bulk insert by an owner.

    Provided for convenience only; this module never performs the insert.
    """
    return [(c["id"], c["geom_ll"].wkt, c["lon"], c["lat"]) for c in cells]


def _coerce_boundary(boundary_ll):
    """Coerce a shapely geom / GeoJSON mapping / iterable of them to one geom."""
    if hasattr(boundary_ll, "geom_type"):
        return boundary_ll
    if isinstance(boundary_ll, dict):
        return shape(boundary_ll)
    geoms = []
    for b in boundary_ll:
        geoms.append(b if hasattr(b, "geom_type") else shape(b))
    return unary_union(geoms)


__all__ = [
    "CELL_M",
    "SRID_M",
    "SRID_LL",
    "build_grid",
    "boston_boundary_from_db",
    "grid_cells_count",
    "load_or_build_cells",
    "cells_to_wkt",
    "Polygon",
]
