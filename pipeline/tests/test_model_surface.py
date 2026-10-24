"""Tests for rat_audit.model.surface (pure)."""
from shapely.geometry import box

from rat_audit.model.grid import CELL_M
from rat_audit.model.surface import contours, raster


def test_surface_is_nested_smooth_and_clipped():
    # A 3x3 hot spot peaking at 4 expected reports, surrounded by zeros.
    values = {(c, r): 0.0 for c in range(0, 9) for r in range(0, 9)}
    for c in range(3, 6):
        for r in range(3, 6):
            values[(c, r)] = 2.0
    values[(4, 4)] = 4.0
    fine, col0, row0 = raster(values)
    assert fine.max() < 4.0 and fine.min() >= 0.0  # smoothed, never negative
    land = box(0, 0, 4.5 * CELL_M, 9 * CELL_M)  # cuts the hot spot in half
    polys = contours(fine, col0, row0, land, levels=[1.0, 1.5, 2.0])
    assert [lvl for lvl, _ in polys] == [1.0, 1.5, 2.0][: len(polys)] and len(polys) >= 2
    for (_, outer), (_, inner) in zip(polys, polys[1:]):
        assert inner.difference(outer).area < 1.0  # higher levels sit inside lower ones
    for _, p in polys:
        assert p.difference(land).area < 1.0  # clipped to land


def test_nothing_drawn_below_first_level():
    fine, col0, row0 = raster({(c, r): 0.5 for c in range(5) for r in range(5)})
    assert contours(fine, col0, row0, None, levels=[1.0]) == []
