from shapely.geometry import MultiPolygon, Polygon, box

from rat_audit.analytics.common import cell_ids_for, project, unproject
from rat_audit.analytics.grid import _to_ll, build_cells
from rat_audit.model.grid import build_grid


def _ll(geom_m):
    return _to_ll(geom_m)


# Two synthetic "tracts" near Dorchester, in EPSG:26986 meters.
A = box(234_010, 893_020, 234_900, 893_700)
B = box(234_900, 893_020, 235_480, 893_700)
TRACTS = [(_ll(A), "Fixture North"), (_ll(B), "Fixture South")]


def test_ids_deterministic_and_match_model_lattice():
    cells = build_cells(TRACTS)
    again = build_cells(list(reversed(TRACTS)))
    assert [c["id"] for c in cells] == [c["id"] for c in again]
    model_ids = {c["id"] for c in build_grid(_ll(A.union(B)))}
    assert {c["id"] for c in cells} == model_ids


def test_cells_are_clipped_and_land_frac():
    cells = build_cells(TRACTS)
    for c in cells:
        assert isinstance(c["geom_ll"], Polygon)
        assert 0.01 <= c["land_frac"] <= 1.0
    # edge column x in [234000, 234250) only covers 234010..234250 -> 240/250 of the width
    edge = {c["row"]: c for c in cells if c["col"] == 234_000 // 250}
    assert abs(edge[893_250 // 250]["land_frac"] - 240 / 250) < 1e-3  # full-height row, 240 of 250 m wide
    full = [c for c in cells if c["land_frac"] == 1.0]
    assert full


def test_neighborhood_by_largest_overlap():
    cells = {c["id"]: c for c in build_cells(TRACTS)}
    x, y = 234_400, 893_300
    cid = cell_ids_for(*unproject([x], [y]))[0]
    assert cells[cid]["neighborhood"] == "Fixture North"


def test_multipart_clip_stored_as_single_polygon():
    left = box(234_000, 893_000, 234_050, 893_250)
    right = box(234_200, 893_000, 234_250, 893_250)
    cells = build_cells([(_ll(MultiPolygon([left, right])), None)])
    assert len(cells) == 1 and cells[0]["multipart"] and isinstance(cells[0]["geom_ll"], Polygon)
    assert abs(cells[0]["land_frac"] - 0.4) < 1e-3


def test_slivers_dropped_and_empty_input():
    sliver = box(234_000, 893_000, 234_002, 893_250)  # 500 m² < 625 m²
    assert build_cells([(_ll(sliver), None)]) == []
    assert build_cells([]) == []


def test_cell_ids_for_points_and_missing_coords():
    lon, lat = unproject([234_100.0], [893_100.0])
    assert cell_ids_for([lon[0], None], [lat[0], None]) == ["g250_936_3572", None]
    x, y = project(lon, lat)
    assert int(x[0] // 250) == 936
