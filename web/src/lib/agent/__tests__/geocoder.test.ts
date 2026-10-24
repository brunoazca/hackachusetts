import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlaceLookup } from "../geocoder";
import { createServerTools } from "../tools/server";
import { createMemoryData } from "../data/memory";
import { NOW, tables } from "./fixtures";

const feature = { geometry: { type: "Point", coordinates: [-71.0966, 42.3583] },
  properties: { name: "Massachusetts Institute of Technology", city: "Cambridge", osm_type: "R", osm_id: 65066, housenumber: "private" } };

test("geocoder expands MIT, bounds requests and validates coordinates; cache deduplicates", async () => {
  let calls = 0;
  const lookup = createPlaceLookup(async (input) => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("q"), "Massachusetts Institute of Technology");
    assert.equal(url.searchParams.get("bbox"), "-71.5,41.9,-70.7,42.7");
    return Response.json({ features: [feature, { ...feature, geometry: { type: "Point", coordinates: [0, 0] } }] });
  });
  const [a, b] = await Promise.all([lookup("MIT"), lookup("mit")]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  assert.equal(a.length, 1);
  assert.match(a[0].source.url!, /openstreetmap.org\/relation\/65066/);
  assert.doesNotMatch(JSON.stringify(a), /private/);
});

test("failed geocoder requests are retryable, not cached as no matches", async () => {
  let calls = 0;
  const lookup = createPlaceLookup(async () => ++calls === 1 ? new Response(null, { status: 503 }) : Response.json({ features: [feature] }));
  await assert.rejects(lookup("MIT"));
  assert.equal((await lookup("MIT")).length, 1);
});

test("landmark coordinates work without a matching incident name or costly text scan", async () => {
  const data = { ...createMemoryData(tables), incidents: async () => { throw new Error("Do not scan incident names for landmarks"); } };
  const t = createServerTools({ data, now: () => NOW, lookupPlace: createPlaceLookup(async () => Response.json({ features: [feature] })) });
  const result = await t.geocode.execute!({ query: "MIT" }, { toolCallId: "t", messages: [] } as never);
  assert.ok("ok" in result);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const d = result.data as { found: boolean; matches: { lat: number; lon: number }[] };
  assert.equal(d.found, true);
  assert.equal(d.matches[0].lat, 42.3583);
  assert.equal(result.features.length, 0, "external OSM ids must not become selectable database records");
  assert.ok(result.caveats.some(c => c.includes("not evidence of rodent activity")));
  const nearby = createServerTools({ data: createMemoryData({ incidents: [{ ...tables.incidents![0], lat: 42.3583, lon: -71.0966, opened_at: "2026-10-01", address_block: "Massachusetts Avenue" }] }), now: () => NOW });
  const found = await nearby.search_incidents.execute!({ near: { ...d.matches[0], radius_m: 500 } }, { toolCallId: "n", messages: [] } as never);
  assert.ok("ok" in found);
  assert.equal(found.ok, true);
  if (found.ok) assert.equal((found.data as { total: number }).total, 1);
});

test("named local places resolve without external lookup and remain inspectable", async () => {
  const t = createServerTools({ data: createMemoryData({ places: [{ id: "p", name: "Fixture College", source_id: "s", kind: "college", lat: 42.35, lon: -71.09, address_block: null, starts_at: null, ends_at: null }] }),
    lookupPlace: async () => { throw new Error("Not needed"); } });
  const r = await t.geocode.execute!({ query: "Fixture College" }, { toolCallId: "t", messages: [] } as never);
  assert.ok("ok" in r);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.features[0].id, "p");
});
