"""Tests for the 250 m grid fallback (rat_audit.model.grid). Pure — no DB."""
from shapely.geometry import box

from rat_audit.model.grid import CELL_M, build_grid, cells_to_wkt

# Small lon/lat box in downtown Boston (~1 km x 1 km).
DOWNTOWN = box(-71.065, 42.350, -71.053, 42.359)


def test_cells_have_expected_shape():
    cells = build_grid(DOWNTOWN)
    assert cells
    for c in cells:
        assert set(c) == {"id", "col", "row", "geom_ll", "lon", "lat"}
        assert c["id"] == f"g250_{c['col']}_{c['row']}"
        assert -71.2 < c["lon"] < -70.9 and 42.2 < c["lat"] < 42.5


def test_ids_unique_and_clipped_to_boundary():
    cells = build_grid(DOWNTOWN)
    ids = [c["id"] for c in cells]
    assert len(ids) == len(set(ids))
    for c in cells:
        assert c["geom_ll"].buffer(1e-9).within(DOWNTOWN.buffer(1e-6))


def test_ids_stable_across_extents():
    small = {c["id"] for c in build_grid(DOWNTOWN)}
    bigger = build_grid(DOWNTOWN.buffer(0.01))
    interior = {c["id"] for c in bigger if c["geom_ll"].within(DOWNTOWN)}
    # Any cell fully inside the small box must carry the same id in the bigger grid.
    assert interior <= small


def test_unclipped_cell_area_is_250m_square():
    cells = build_grid(None)
    from rat_audit.model.grid import _project_to_m

    area = _project_to_m(cells[len(cells) // 2]["geom_ll"]).area
    assert abs(area - CELL_M * CELL_M) / (CELL_M * CELL_M) < 1e-3


def test_accepts_geojson_mapping_and_list():
    from shapely.geometry import mapping

    a = {c["id"] for c in build_grid(DOWNTOWN)}
    assert {c["id"] for c in build_grid(mapping(DOWNTOWN))} == a
    assert {c["id"] for c in build_grid([DOWNTOWN])} == a


def test_cells_to_wkt():
    rows = cells_to_wkt(build_grid(DOWNTOWN)[:3])
    assert len(rows) == 3
    cid, wkt, lon, lat = rows[0]
    assert cid.startswith("g250_") and wkt.startswith("POLYGON") and isinstance(lon, float)
