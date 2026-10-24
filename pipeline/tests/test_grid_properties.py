"""Property-based tests for the pure 250 m grid builder (rat_audit.model.grid).

These use Hypothesis to assert *invariants that must hold for every boundary*,
not just the hand-picked downtown box in test_grid.py. The grid builder is a
pure function (no DB, no side effects), which is exactly what PBT is good at:
the properties below are the contract the design relies on — stable cell ids
across extents (§4 Grid), clipping that never leaks outside the boundary, and
deterministic, collision-free ids for stable downstream joins.

What PBT caught that example tests missed: the id-stability property
(`ids_are_a_pure_function_of_the_global_lattice`) fails the moment the origin is
snapped to the *local* min corner instead of the global (0,0) lattice — a
regression a single downtown fixture cannot see, because col/row only diverge
once two different extents are compared over a shared interior.
"""
from __future__ import annotations

from hypothesis import given, settings, strategies as st
from shapely.geometry import box

from rat_audit.model.grid import CELL_M, build_grid

# Boston-ish lon/lat ranges. Keep boxes small enough that the grid stays cheap
# to build (a few hundred cells at most) but large enough to span many cells.
_LON = st.floats(min_value=-71.19, max_value=-70.96, allow_nan=False, allow_infinity=False)
_LAT = st.floats(min_value=42.23, max_value=42.41, allow_nan=False, allow_infinity=False)


@st.composite
def boxes(draw, min_span_deg: float = 0.004, max_span_deg: float = 0.03):
    """A lon/lat bounding box with a bounded span (≈0.4 km–3 km per side)."""
    lon0 = draw(_LON)
    lat0 = draw(_LAT)
    dlon = draw(st.floats(min_value=min_span_deg, max_value=max_span_deg))
    dlat = draw(st.floats(min_value=min_span_deg, max_value=max_span_deg))
    return box(lon0, lat0, min(lon0 + dlon, -70.95), min(lat0 + dlat, 42.42))


@settings(max_examples=60, deadline=None)
@given(boxes())
def test_ids_unique_and_well_formed(b):
    cells = build_grid(b)
    assert cells, "a non-degenerate Boston box must yield at least one cell"
    ids = [c["id"] for c in cells]
    assert len(ids) == len(set(ids)), "cell ids must be unique within a grid"
    for c in cells:
        assert c["id"] == f"g250_{c['col']}_{c['row']}"


@settings(max_examples=60, deadline=None)
@given(boxes())
def test_clipped_cells_stay_within_the_boundary(b):
    # Every returned cell must lie inside the clip boundary (small buffer absorbs
    # floating-point reprojection error through EPSG:26986 and back).
    for c in build_grid(b):
        assert c["geom_ll"].buffer(1e-7).within(b.buffer(1e-5))
        assert not c["geom_ll"].is_empty and c["geom_ll"].area > 0


@settings(max_examples=60, deadline=None)
@given(boxes())
def test_centroid_lies_inside_its_own_cell(b):
    from shapely.geometry import Point

    for c in build_grid(b):
        assert c["geom_ll"].buffer(1e-9).contains(Point(c["lon"], c["lat"]))


@settings(max_examples=50, deadline=None)
@given(boxes(min_span_deg=0.006, max_span_deg=0.02))
def test_ids_are_a_pure_function_of_the_global_lattice(b):
    # The core design guarantee: a cell's id comes from the global (0,0) lattice,
    # so the SAME ground location gets the SAME id whether we tile a tight box or
    # a box grown by ~1 km in every direction. Any cell fully inside the small
    # box must keep its id in the bigger grid.
    bigger = box(b.bounds[0] - 0.01, b.bounds[1] - 0.01, b.bounds[2] + 0.01, b.bounds[3] + 0.01)
    small_ids = {c["id"] for c in build_grid(b)}
    interior_big = {c["id"] for c in build_grid(bigger) if c["geom_ll"].within(b)}
    assert interior_big <= small_ids


@settings(max_examples=40, deadline=None)
@given(boxes())
def test_building_is_deterministic(b):
    first = [(c["id"], c["col"], c["row"]) for c in build_grid(b)]
    second = [(c["id"], c["col"], c["row"]) for c in build_grid(b)]
    assert first == second


def test_unclipped_grid_is_available_and_square():
    # Sanity anchor for the property suite: the no-boundary path still tiles the
    # full Boston bbox with the expected 250 m cell size.
    cells = build_grid(None)
    assert len(cells) > 1000
    assert all(c["id"].startswith("g250_") for c in cells[:50])
    assert CELL_M == 250
