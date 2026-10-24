// Run: npx tsx --env-file=.env.local --test tests/insight.test.ts  (insight.ts imports the Supabase client)
import test from "node:test";
import assert from "node:assert/strict";
import { focusOf, highlightIds, routeSelection } from "../src/lib/insight.ts";
import { useMap } from "../src/lib/map-store.ts";

test("each map selection opens the right insight", () => {
  assert.deepEqual(routeSelection(null), { kind: "ranking" });
  assert.deepEqual(routeSelection({ kind: "cell", id: "g250_1_2" }), { kind: "area", cellIds: ["g250_1_2"] });
  assert.deepEqual(routeSelection({ kind: "incident", id: "311:1" }), { kind: "record", id: "311:1" });
  assert.deepEqual(routeSelection({ kind: "place", id: "food:9" }), { kind: "evidence", source: "place", id: "food:9" });
  assert.equal(routeSelection({ kind: "place", id: "parcel:0101" }).kind, "legacy");
  assert.equal(routeSelection({ kind: "site", id: "s1" }).kind, "legacy");
  const poly = { type: "Polygon" as const, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] };
  assert.deepEqual(routeSelection({ kind: "area", geojson: poly }), { kind: "polygon", geojson: poly });
});

test("highlights and focus follow the insight kind", () => {
  const evidence = { kind: "evidence" as const, item: { id: "e1", lat: 42.3, lon: -71 }, related_rodent_reports: [{ id: "r1" }, { id: "r2" }] };
  assert.deepEqual(highlightIds(evidence), ["e1", "r1", "r2"]);
  assert.deepEqual(focusOf(evidence), { lat: 42.3, lon: -71, zoom: 17 });
  const record = { kind: "record" as const, incident: { id: "r1", lat: 42.3, lon: -71 }, cell_id: "g", region_id: null,
    evidence: { address_history: [{ id: "r0" }, { id: "r1" }] } };
  assert.deepEqual(highlightIds(record), ["r1", "r0"]);
  const area = { kind: "area" as const, cell_ids: ["g", "h"], region_id: null, can_generate_ai: true,
    solution: { records: [{ incident_id: "a" }, { incident_id: "a" }], locations: [{ lat: 42, lon: -71 }, { lat: 42.2, lon: -71.2 }] } };
  assert.deepEqual(highlightIds(area), ["a"]);
  assert.equal(focusOf(area)?.zoom, 15);
  assert.deepEqual(highlightIds(null), []);
});

test("Back walks previous selections, then returns to the ranking; clearing resets", () => {
  const { select, back } = useMap.getState();
  select(null);
  select({ kind: "cell", id: "c1" });
  select({ kind: "incident", id: "i1" });
  select({ kind: "incident", id: "i1" });              // re-selecting does not duplicate
  select({ kind: "place", id: "p1" });
  assert.deepEqual(useMap.getState().history.map(s => s && "id" in s ? s.id : null), ["c1", "i1"]);
  back(); assert.deepEqual(useMap.getState().selection, { kind: "incident", id: "i1" });
  back(); assert.deepEqual(useMap.getState().selection, { kind: "cell", id: "c1" });
  back(); assert.equal(useMap.getState().selection, null);   // ranking
  select({ kind: "cell", id: "c2" }); select(null);
  assert.deepEqual(useMap.getState().history, []);
});
