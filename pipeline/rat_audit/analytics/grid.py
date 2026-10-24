"""Task 2.1: `grid_cells`, 250 m squares in EPSG:26986 clipped to Boston (R6.1).

Boundary: union of the Boston census tracts in `tracts` (`city = 'boston'`, source
`climate-ready-boston-svi`, 2010 tracts). Cell ids use the global lattice shared with
`rat_audit.model.grid`: `g250_<floor(x/250)>_<floor(y/250)>`, so ids never depend on the extent.

A coastline clip can split a square into several land pieces. `grid_cells.geom` is a single
polygon, so those cells store the convex hull of the pieces (still inside the square) and
`land_frac` keeps the true clipped share of the 62,500 m² square.
"""
from __future__ import annotations

import json
from collections import Counter

import numpy as np
import psycopg
import shapely
from shapely import STRtree
from shapely.geometry import box, shape
from shapely.ops import unary_union

from .common import CELL_M, MissingInput, cell_id, project, unproject

BOUNDARY_SOURCE = "climate-ready-boston-svi"
MIN_LAND_FRAC = 0.01  # drop slivers under 625 m²


def _to_m(geom):
    return shapely.transform(geom, lambda xy: np.column_stack(project(xy[:, 0], xy[:, 1])))


def _to_ll(geom):
    return shapely.transform(geom, lambda xy: np.column_stack(unproject(xy[:, 0], xy[:, 1])))


def build_cells(tracts_ll: list[tuple[object, str | None]], cell_m: int = CELL_M) -> list[dict]:
    """Pure: tracts [(shapely geom lon/lat, neighborhood)] -> clipped cells, sorted by id.

    Each cell: id, col, row, geom_ll (Polygon), lon, lat (centroid), land_frac, neighborhood
    (the tract covering most of the cell).
    """
    if not tracts_ll:
        return []
    tracts_m = [(_to_m(g).buffer(0), n) for g, n in tracts_ll]
    boundary = unary_union([g for g, _ in tracts_m]).buffer(0)
    tree = STRtree([g for g, _ in tracts_m])
    minx, miny, maxx, maxy = boundary.bounds
    cells: list[dict] = []
    for col in range(int(minx // cell_m), int(maxx // cell_m) + 1):
        for row in range(int(miny // cell_m), int(maxy // cell_m) + 1):
            sq = box(col * cell_m, row * cell_m, (col + 1) * cell_m, (row + 1) * cell_m)
            if not sq.intersects(boundary):
                continue
            clipped = sq.intersection(boundary)
            frac = clipped.area / (cell_m * cell_m)
            if clipped.is_empty or frac < MIN_LAND_FRAC:
                continue
            poly = clipped if clipped.geom_type == "Polygon" else clipped.convex_hull
            best, best_a = None, 0.0
            for i in tree.query(clipped):
                a = tracts_m[i][0].intersection(clipped).area
                if a > best_a:
                    best, best_a = tracts_m[i][1], a
            cen = _to_ll(clipped.centroid)
            cells.append({
                "id": cell_id(col, row), "col": col, "row": row, "geom_ll": _to_ll(poly),
                "lon": float(cen.x), "lat": float(cen.y), "land_frac": round(min(frac, 1.0), 4),
                "neighborhood": best, "multipart": clipped.geom_type != "Polygon",
            })
    cells.sort(key=lambda c: c["id"])
    return cells


def load_tracts(conn: psycopg.Connection) -> list[tuple[object, str | None]]:
    rows = conn.execute(
        "select st_asgeojson(geom::geometry), attrs->>'neighborhood' from tracts "
        "where city = 'boston' and source_id = %s and geom is not null order by geoid",
        (BOUNDARY_SOURCE,),
    ).fetchall()
    return [(shape(json.loads(g)), n) for g, n in rows]


def cell_zips(conn: psycopg.Connection) -> dict[str, str]:
    """Most common incident ZIP per cell (ties -> smallest ZIP)."""
    rows = conn.execute(
        f"""select floor(st_x(p) / {CELL_M})::int, floor(st_y(p) / {CELL_M})::int, zip, count(*)
            from (select st_transform(geom::geometry, 26986) p, zip from incidents
                  where city = 'boston' and geom is not null and zip is not null) s
            group by 1, 2, 3"""
    ).fetchall()
    best: dict[str, tuple[int, str]] = {}
    for c, r, z, n in rows:
        k = cell_id(c, r)
        cur = best.get(k)
        if cur is None or n > cur[0] or (n == cur[0] and z < cur[1]):
            best[k] = (n, z)
    return {k: v[1] for k, v in best.items()}


def run(conn: psycopg.Connection) -> dict:
    tracts = load_tracts(conn)
    if not tracts:
        raise MissingInput({
            "table": "tracts", "where": f"city = 'boston' and source_id = '{BOUNDARY_SOURCE}'",
            "loader": "rat_audit.ingest.context (Climate Ready Boston SVI tracts)",
            "why": "Boston boundary used to clip the 250 m grid",
        })
    cells = build_cells(tracts)
    zips = cell_zips(conn)
    conn.execute(
        "create temp table _cells (id text, wkt text, lat float8, lon float8, neighborhood text, zip text, "
        "col int, row int, land_frac real) on commit drop"
    )
    with conn.cursor().copy("copy _cells from stdin") as cp:
        for c in cells:
            cp.write_row((c["id"], c["geom_ll"].wkt, c["lat"], c["lon"], c["neighborhood"], zips.get(c["id"]),
                          c["col"], c["row"], c["land_frac"]))
    changed = conn.execute(
        """insert into grid_cells (id, geom, lat, lon, neighborhood, zip, city, col, row, land_frac, boundary_source)
           select id, st_geogfromtext('SRID=4326;' || wkt), lat, lon, neighborhood, zip, 'boston', col, row,
                  land_frac, %s
           from _cells
           on conflict (id) do update set geom = excluded.geom, lat = excluded.lat, lon = excluded.lon,
             neighborhood = excluded.neighborhood, zip = excluded.zip, city = excluded.city, col = excluded.col,
             row = excluded.row, land_frac = excluded.land_frac, boundary_source = excluded.boundary_source
           where (grid_cells.lat, grid_cells.lon, grid_cells.neighborhood, grid_cells.zip, grid_cells.land_frac,
                  grid_cells.boundary_source)
                 is distinct from (excluded.lat, excluded.lon, excluded.neighborhood, excluded.zip,
                  excluded.land_frac, excluded.boundary_source)""",
        (BOUNDARY_SOURCE,),
    ).rowcount
    # Cells outside the new boundary: delete unless a forecast row still points at them.
    removed = conn.execute(
        """delete from grid_cells g where city = 'boston' and not exists (select 1 from _cells c where c.id = g.id)
           and not exists (select 1 from predictions p where p.cell_id = g.id)"""
    ).rowcount
    kept_stale = conn.execute(
        "select count(*) from grid_cells g where city = 'boston' and not exists (select 1 from _cells c where c.id = g.id)"
    ).fetchone()[0]
    conn.commit()
    return {
        "cells": len(cells), "written": changed, "removed": removed, "stale_kept_for_predictions": kept_stale,
        "boundary_source": BOUNDARY_SOURCE, "tracts": len(tracts),
        "multipart_cells": sum(1 for c in cells if c["multipart"]),
        "cells_with_zip": sum(1 for c in cells if c["id"] in zips),
        "neighborhoods": len(Counter(c["neighborhood"] for c in cells if c["neighborhood"])),
    }
