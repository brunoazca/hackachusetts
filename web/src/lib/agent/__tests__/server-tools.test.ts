import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryData } from "../data/memory";
import { createServerTools } from "../tools/server";
import { DataUnavailableError, type AgentData } from "../data/types";
import { NOW, tables } from "./fixtures";

// Tools against the in-memory adapter (fixtures). Live read-only checks are in live.test.ts.

const tools = createServerTools({ data: createMemoryData(tables), now: () => NOW });
const opts = { toolCallId: "t", messages: [] } as never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = async (name: keyof typeof tools, input: unknown): Promise<any> => (tools[name].execute as any)(input, opts);

test("geocode returns matches from data, never invented places", async () => {
  const r = await call("geocode", { query: "Fixture St" });
  assert.equal(r.ok, true);
  assert.equal(r.data.found, true);
  assert.equal(r.data.matches[0].label, "Fixture St, 02121"); // house number stripped from "12 Fixture St"
  assert.ok(r.data.bbox);
  const none = await call("geocode", { query: "Atlantis Blvd" });
  assert.equal(none.data.found, false);
  assert.equal(none.data.bbox, null);
  assert.ok(none.caveats.some((c: string) => c.includes("Nothing in the data")));
});

test("search_incidents filters, counts and cites", async () => {
  const r = await call("search_incidents", { query: "Fixture St", since: "2026-01-01" });
  assert.equal(r.data.total, 3);
  assert.deepEqual(r.data.by_status, { closed: 2, open: 1 });
  assert.deepEqual(r.data.by_action, { baiting: 1, citation: 1 });
  assert.deepEqual(r.sources.map((s: { id: string }) => s.id), ["fixture-311"]);
  assert.equal(r.features[0].kind, "incident");
  assert.ok(r.data.items.every((i: { address_block: string }) => !/^\d/.test(i.address_block)));
  assert.ok(!("closure_note" in r.data.items[0]));
});

test("search_incidents radius cuts to the circle", async () => {
  const r = await call("search_incidents", { categories: ["trash_storage", "dumping"], since: "2026-01-01", near: { lat: 42.3051, lon: -71.0712, radius_m: 100 } });
  assert.deepEqual(r.data.items.map((i: { id: string }) => i.id), ["fixture-inc-4"]);
});

test("search_incidents defaults to the last 90 days", async () => {
  const r = await call("search_incidents", {});
  assert.equal(r.data.filters.since, "2026-07-26");
  assert.deepEqual(r.data.items.map((i: { id: string }) => i.id), ["fixture-inc-3"]);
});

test("top_sites ranks by score and cites site sources", async () => {
  const r = await call("top_sites", { limit: 5 });
  assert.deepEqual(r.data.sites.map((s: { id: string }) => s.id), ["fixture-site-1", "fixture-site-2"]);
  assert.deepEqual(new Set(r.sources.map((s: { id: string }) => s.id)), new Set(["fixture-parcels", "fixture-311"]));
});

test("get_site returns timeline, actions taken and drivers", async () => {
  const r = await call("get_site", { site_id: "fixture-site-1" });
  assert.equal(r.data.found, true);
  assert.deepEqual(r.data.timeline.map((t: { id: string }) => t.id), ["fixture-inc-1", "fixture-inc-2"]);
  assert.deepEqual(r.data.actions_taken, { baiting: 1, citation: 1 });
  assert.equal(r.data.recurrence_probability, 0.7);
  assert.equal(r.features[0].id, "fixture-site-1");
  const missing = await call("get_site", { site_id: "nope" });
  assert.equal(missing.data.found, false);
});

test("nearby_drivers uses the site location and window", async () => {
  const r = await call("nearby_drivers", { site_id: "fixture-site-1" });
  assert.deepEqual(r.data.driver_reports.map((d: { category: string; n: number }) => [d.category, d.n]), [["trash_storage", 1]]);
  assert.equal(r.data.places[0].kind, "vacant_parcel");
  assert.equal(r.data.since, "2026-03-01");
  assert.ok(r.caveats[0].includes("does not mean causing"));
});

test("what_worked sorts by recurrence and flags small n", async () => {
  const r = await call("what_worked", {});
  assert.deepEqual(r.data.outcomes.map((o: { action_tag: string }) => o.action_tag), ["abatement_order", "baiting"]);
  assert.ok(r.caveats.some((c: string) => c.includes("abatement_order")));
  assert.ok(r.sources.length > 0);
});

test("draft_work_order drafts only: status draft, saved false, points to Approve", async () => {
  const r = await call("draft_work_order", { site_id: "fixture-site-1", action: "abatement_order" });
  assert.equal(r.data.status, "draft");
  assert.equal(r.data.saved, false);
  assert.equal(r.data.recommended_by_analysis, true);
  assert.equal(r.data.follow_up_on, "2026-12-23");
  assert.match(r.data.next_step, /Action review/);
  const off = await call("draft_work_order", { site_id: "fixture-site-1", action: "barrels" });
  assert.equal(off.data.recommended_by_analysis, false);
  assert.equal(off.caveats.length, 1);
});

test("no data configured → every tool fails honestly", async () => {
  const t = createServerTools({ data: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (t.top_sites.execute as any)({}, opts);
  assert.deepEqual(r.ok, false);
  assert.match(r.error, /not configured/);
});

test("adapter errors become ok:false, not thrown", async () => {
  const broken: AgentData = { ...createMemoryData(tables), sites: async () => { throw new DataUnavailableError("sites: relation does not exist"); } };
  const t = createServerTools({ data: broken });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (t.top_sites.execute as any)({}, opts);
  assert.equal(r.ok, false);
  assert.match(r.error, /relation does not exist/);
});
