import { test } from "node:test";
import assert from "node:assert/strict";
import { booleanPointInPolygon, featureCollection, polygon, point } from "@turf/turf";
import { buildRegionFocus, gridPolygon } from "../../region-focus";

const cells = featureCollection([
  polygon([[[0,0],[1,0],[1,1],[0,1],[0,0]]], { id: "a" }),
  polygon([[[1,0],[2,0],[2,1],[1,1],[1,0]]], { id: "b" }),
  polygon([[[4,0],[5,0],[5,1],[4,1],[4,0]]], { id: "c" }),
]);
test("region focus joins member cells and dims only the outside", () => {
  const f = buildRegionFocus([{ region_id: "a", rank: 1, cell_ids: ["a", "b", "a"] }, { region_id: "c", rank: 5, cell_ids: ["c"] }], cells);
  assert.equal(f.regions.features.length, 2);
  assert.deepEqual(f.bounds, [0,0,5,1]);
  assert.deepEqual(f.labels.map(r => r.rank), [1,5]);
  assert.equal(booleanPointInPolygon(point([0.5,0.5]), f.mask!), false);
  assert.equal(booleanPointInPolygon(point([1.5,0.5]), f.mask!), false);
  assert.equal(booleanPointInPolygon(point([3,0.5]), f.mask!), true);
  assert.equal(booleanPointInPolygon(point([4.5,0.5]), f.mask!), false);
});
test("missing member geometry fails instead of drawing a misleading partial outline", () => {
  assert.throws(() => buildRegionFocus([{ region_id: "a", rank: 1, cell_ids: ["a", "missing"] }], cells), /Complete boundaries/);
});

test("PostGIS grid polygons decode from SRID 4326 EWKB", () => {
  const g = gridPolygon("0103000020E61000000100000005000000DA83E66DC9C551C0BAB597ECE72B4540E435CB30C9C551C0E0FDA4AC312C4540F8FF4E7B97C551C0C22AA551312C4540E42CDEB897C551C0CCB39891E72B4540DA83E66DC9C551C0BAB597ECE72B4540");
  assert.equal(g.coordinates[0].length, 5);
  assert.ok(g.coordinates[0][0][0] < -71 && g.coordinates[0][0][0] > -72);
  assert.throws(() => gridPolygon("not geometry"));
});
