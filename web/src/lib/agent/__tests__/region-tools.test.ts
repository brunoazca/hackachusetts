import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryData } from "../data/memory";
import { createRegionTools } from "../tools/regions";
import { createTools } from "../chat";

const region = (rank: number, neighborhood: string, pop: number | null, delta: number | null) => ({
  region_id: `cell-${rank}`, rank, cell_ids: [`cell-${rank}`], neighborhood,
  severity: { observed_12w: 30, expected_4w: 10, expected_returns_60d: 5, score: 45 },
  recommendation: { action: "Improve trash storage", because: "Repeated trash reports nearby", unknowns: [] },
  population: pop === null ? null : { pop, source_ids: ["acs"] },
  after_fix: delta === null ? null : { expected_after: 10 - delta, delta_4w: delta, recur_p: 0.2 },
  source_ids: ["311"], computed_at: "2026-10-24", run_id: "run1", evidence: [],
});
const data = createMemoryData({ regions: { regions: [region(1, "Dorchester", 1000, null), region(2, "Roxbury", 3000, 2), region(3, "Dorchester", null, null), region(4, "Back Bay", 2000, 4)] }, regionLocations: { "cell-2": { lat: 42.32, lon: -71.08 } } });
const tools = createRegionTools(data);
// Test-only shape for the guarded tool union; assertions validate each consumed field.
type TestResult = {
  ok: boolean; error: string;
  data: {
    regions: { rank: number; people: { estimated_residents: number | null }; future: { after_fix: unknown; expected_returns_60d: number | null }; [key: string]: unknown }[];
    population_unknown: number; neighborhood_scope: string; ranking_scope: string; priority_by_published_rank: string;
  };
  features: { kind: string; lat?: number }[];
};
type TestExecutor = (input: unknown, options?: unknown) => Promise<TestResult>;
// Tool schemas are separately checked below; calls exercise execution with fixture data only.
async function call(name: keyof typeof tools, input: unknown) {
  const t = tools[name];
  const schema = t.inputSchema as import("zod").ZodType;
  const parsed = schema.parse(input);
  return await (t.execute as unknown as TestExecutor)(parsed, { toolCallId: "test", messages: [] });
}

test("rank filters before limit, uses strict population threshold and preserves published rank", async () => {
  const r = await call("rank_regions", { people_above: 2000, limit: 1 });
  assert.equal(r.ok, true);
  assert.equal(r.data.regions[0].rank, 2);
  assert.equal(r.data.population_unknown, 1);
  assert.equal(r.data.regions[0].people.estimated_residents, 3000);
  assert.equal(r.features[0].kind, "cell");
  assert.equal(r.features[0].lat, 42.32);
});
test("people and benefit are distinct orderings; missing estimates are not zero", async () => {
  const people = await call("rank_regions", { sort_by: "people" });
  assert.deepEqual(people.data.regions.map((r: { rank: number }) => r.rank), [2, 4, 1]);
  const benefit = await call("rank_regions", { sort_by: "benefit" });
  assert.deepEqual(benefit.data.regions.map((r: { rank: number }) => r.rank), [4, 2]);
  const absent = await call("rank_regions", { neighborhood: "Dorchester", sort_by: "benefit" });
  assert.equal(absent.ok, false);
});
test("explain returns five fields without inventing benefit or coordinates", async () => {
  const r = await call("explain_region", { rank: 1 });
  const card = r.data.regions[0];
  for (const k of ["problem", "solution", "evidence", "future", "people"]) assert.ok(k in card);
  assert.equal(card.future.after_fix, null);
  assert.equal(card.future.expected_returns_60d, 5);
  assert.equal(r.features[0].lat, undefined);
  assert.equal((await call("explain_region", { rank: 999 })).ok, false);
});
test("compare chooses top region per neighborhood, not neighborhood totals", async () => {
  const r = await call("compare_regions", { left: { neighborhood: "Dorchester" }, right: { neighborhood: "Roxbury" } });
  assert.deepEqual(r.data.regions.map((r: { rank: number }) => r.rank), [1, 2]);
  assert.equal(r.data.priority_by_published_rank, "cell-1");
  assert.match(r.data.neighborhood_scope, /not whole-neighborhood/);
  assert.equal((await call("compare_regions", { left: { rank: 1 }, right: { rank: 1 } })).ok, false);
});
test("invalid and unavailable data fail honestly", async () => {
  const bad = createRegionTools(createMemoryData({ regions: { regions: [{ rank: 1 }] } }));
  const r = await (bad.rank_regions.execute as unknown as TestExecutor)({ limit: 5, sort_by: "severity" });
  assert.equal(r.ok, false);
  const missing = createRegionTools(null);
  assert.equal((await (missing.rank_regions.execute as unknown as TestExecutor)({ limit: 5, sort_by: "severity" })).ok, false);
  assert.throws(() => (tools.explain_region.inputSchema as import("zod").ZodType).parse({ rank: 1, region_id: "cell-2" }));
});

test("chat exposes all region tools", () => {
  const registered = createTools(data);
  for (const name of ["rank_regions", "explain_region", "compare_regions"]) assert.ok(name in registered);
});

test("best reverses published severity without depending on population and keeps stable ranks", async () => {
  const r = await call("rank_regions", { sort_by: "severity", order: "lowest", limit: 2 });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.regions.map((r: { rank: number }) => r.rank), [4, 3]);
  assert.equal(r.data.regions[1].people.estimated_residents, null);
  assert.match(r.data.ranking_scope, /not all areas/);
  const worst = await call("rank_regions", { order: "highest", limit: 2 });
  assert.deepEqual(worst.data.regions.map((r: { rank: number }) => r.rank), [1, 2]);
});

test("lowest severity cannot claim the missing tail of a truncated ranking", async () => {
  const t = createRegionTools(createMemoryData({ regions: { truncated: true, regions: [region(1, "Back Bay", null, null)] } })).rank_regions;
  const args = (t.inputSchema as import("zod").ZodType).parse({ order: "lowest" });
  const r = await (t.execute as unknown as TestExecutor)(args);
  assert.equal(r.ok, false);
  assert.match(r.error, /truncated/);
});
