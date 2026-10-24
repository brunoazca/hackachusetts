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

test("search_incidents labels limited breakdowns instead of implying population counts", async () => {
  const r = await call("search_incidents", { query: "Fixture St", since: "2026-01-01", limit: 1 });
  assert.equal(r.data.total, 3);
  assert.equal(r.data.returned, 1);
  assert.equal(r.data.breakdowns_count, 1);
  assert.equal(r.data.breakdowns_scope, "fetched_reports");
  assert.equal(Object.values(r.data.by_status).reduce((n: number, value) => n + Number(value), 0), 1);
  assert.ok(r.caveats.some((c: string) => c.includes("not all 3 matches")));
  const open = await call("search_incidents", { query: "Fixture St", since: "2026-01-01", status: "open", limit: 1 });
  const closed = await call("search_incidents", { query: "Fixture St", since: "2026-01-01", status: "closed", limit: 1 });
  assert.equal(open.data.total + closed.data.total, r.data.total);
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

test("Analytics tables empty → analytics_not_computed, not an empty success", async () => {
  const t = createServerTools({ data: createMemoryData({ ...tables, sites: [], action_outcomes: [] }), now: () => NOW });
  for (const [name, input] of [["top_sites", {}], ["due_sites", {}], ["get_site", { site_id: "x" }], ["draft_work_order", { site_id: "x", action: "inspection" }], ["what_worked", {}], ["nearby_drivers", { site_id: "x" }]] as const) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await (t[name].execute as any)(input, opts);
    assert.equal(r.ok, false, name);
    assert.equal(r.reason, "analytics_not_computed", name);
  }
  // Tools on ingested data still work.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = await (t.search_incidents.execute as any)({ query: "Fixture St", since: "2026-01-01" }, opts);
  assert.equal(s.ok, true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const n = await (t.nearby_drivers.execute as any)({ lat: 42.3051, lon: -71.0712 }, opts);
  assert.equal(n.ok, true);
});

test("sites empty but draft queue present → provisional sites, no score, caveat", async () => {
  const draft = (tables.sites ?? []).map((s) => ({ ...s, score: null, rank: null, provisional: true, recommended: [], reports: [{ id: "fixture-inc-1", opened_at: "", closed_at: null, status: "closed", action_tag: "baiting" }] }));
  const t = createServerTools({ data: createMemoryData({ ...tables, sites: [], draft_sites: draft }), now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top = await (t.top_sites.execute as any)({}, opts);
  assert.equal(top.ok, true);
  assert.equal(top.data.sites[0].provisional, true);
  assert.equal(top.data.sites[0].score, null);
  assert.ok(top.caveats.some((c: string) => c.startsWith("Provisional sites")));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = await (t.get_site.execute as any)({ site_id: "fixture-site-1" }, opts);
  assert.deepEqual(s.data.timeline.map((x: { id: string }) => x.id), ["fixture-inc-1"], "exact reports, not street-block grouping");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ww = await (t.what_worked.execute as any)({}, opts);
  assert.equal(ww.ok, true, "action_outcomes fixture still present");
});


test("what_worked does not depend on access to the sites table", async () => {
  const data: AgentData = {
    ...createMemoryData(tables),
    analyticsCounts: async () => { throw new DataUnavailableError("sites permission denied", "permission"); },
  };
  const t = createServerTools({ data, now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (t.what_worked.execute as any)({}, opts);
  assert.equal(r.ok, true);
  assert.equal(r.data.outcomes.length, tables.action_outcomes!.length);
});

test("nearby_drivers labels partial counts when the database cap is below the tool limit", async () => {
  const memory = createMemoryData(tables);
  const data: AgentData = {
    ...memory,
    incidents: async (q) => ({ ...(await memory.incidents(q)), total: 2500 }),
  };
  const t = createServerTools({ data, now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (t.nearby_drivers.execute as any)({ site_id: "fixture-site-1" }, opts);
  assert.equal(r.ok, true);
  assert.equal(r.data.driver_reports_truncated, true);
  assert.ok(r.caveats.some((c: string) => /partial.*2500/.test(c)));
});


test("due_sites filters Due before limiting and exposes counts, not scores", async () => {
  const due = tables.sites!.map((s, i) => ({ ...s, summary: { ...s.summary, due: true, base_rate: 0.3 }, recurrence_count: i + 2 }));
  const notDue = { ...due[0], id: "fixture-not-due", summary: { due: false }, recurrence_count: 99 };
  const t = createServerTools({ data: createMemoryData({ ...tables, sites: [notDue, ...due] }), now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (t.due_sites.execute as any)({ limit: 1 }, opts);
  assert.equal(r.ok, true);
  assert.equal(r.data.provisional, false);
  assert.equal(r.data.sites[0].id, due[1].id);
  assert.equal(r.data.sites[0].due, true);
  assert.equal(r.data.sites[0].base_rate, 0.3);
  assert.ok(!("score" in r.data.sites[0]));
  assert.ok(r.sources.length > 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = await (t.due_sites.execute as any)({ neighborhood: "dor", limit: 1 }, opts);
  assert.equal(filtered.data.sites[0].id, due[0].id);
});

test("due_sites marks draft Due as provisional without inventing a base rate", async () => {
  const draft = tables.sites!.map((s) => ({ ...s, provisional: true, score: null, summary: { due: true, closures: 2 } }));
  const t = createServerTools({ data: createMemoryData({ ...tables, sites: [], draft_sites: draft }), now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (t.due_sites.execute as any)({}, opts);
  assert.equal(r.ok, true);
  assert.equal(r.data.provisional, true);
  assert.ok(r.data.sites.every((s: { base_rate: unknown }) => s.base_rate === null));
  assert.match(r.caveats[0], /not the Spec v2 base-rate threshold/);
});

test("historical baiting remains visible but is never emitted as a recommendation or draft", async () => {
  const site = { ...tables.sites![0], recommended: [
    ...tables.sites![0].recommended,
    { action: "baiting", because: "historical action" },
    { action: "cleanup", because: "apply poison" },
  ] };
  const t = createServerTools({ data: createMemoryData({ ...tables, sites: [site] }), now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detail = await (t.get_site.execute as any)({ site_id: site.id }, opts);
  assert.equal(detail.data.actions_taken.baiting, 1);
  assert.deepEqual(detail.data.recommended, tables.sites![0].recommended);
  for (const input of [{ site_id: site.id, action: "baiting" }, { site_id: site.id, action: "cleanup", note: "apply rodenticide" }]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await (t.draft_work_order.execute as any)(input, opts);
    assert.equal(r.data.drafted, false);
    assert.ok(!("status" in r.data));
  }
});


test("Analytics action_tag identifies recommendations while action keeps its display text", async () => {
  const allowed = { id: "fixture:containers", action_tag: "barrels", action: "Sealed, rat-resistant containers for the block", because: ["Three nearby trash reports"], source_ids: ["fixture-311"] };
  const site = { ...tables.sites![0], recommended: [
    allowed,
    { action_tag: "abatement_order", action: "Joint block visit: clear and bait the adjacent vacant parcel" },
    { action_tag: "baiting", action: "Bait the surrounding blocks before demolition" },
    { action_tag: "unknown", action: "cleanup" },
  ] };
  const t = createServerTools({ data: createMemoryData({ ...tables, sites: [site] }), now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detail = await (t.get_site.execute as any)({ site_id: site.id }, opts);
  assert.deepEqual(detail.data.recommended, [allowed]);
  assert.ok(detail.caveats.some((c: string) => /recommendations are omitted/.test(c)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const draft = await (t.draft_work_order.execute as any)({ site_id: site.id, action: "barrels" }, opts);
  assert.equal(draft.data.recommended_by_analysis, true);
  assert.deepEqual(draft.data.because, allowed.because);
  assert.equal(draft.data.saved, false);
});

test("Analytics summary.timeline uses exact IDs and labels capped history", async () => {
  const site = { ...tables.sites![0], report_count: 61, summary: { ...tables.sites![0].summary, timeline: [{ id: "fixture-inc-2" }] } };
  const t = createServerTools({ data: createMemoryData({ ...tables, sites: [site] }), now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detail = await (t.get_site.execute as any)({ site_id: site.id }, opts);
  assert.deepEqual(detail.data.timeline.map((r: { id: string }) => r.id), ["fixture-inc-2"]);
  assert.deepEqual(detail.data.actions_taken, { citation: 1 });
  assert.ok(detail.caveats.some((c: string) => /Partial timeline: 1 of 61/.test(c)));
  assert.ok(!detail.caveats.some((c: string) => /neighbouring addresses/.test(c)));
});

test("missing or empty listed report IDs never expand to other addresses on the street", async () => {
  for (const timeline of [[], [{ id: "not-readable" }]]) {
    const site = { ...tables.sites![0], summary: { timeline } };
    const t = createServerTools({ data: createMemoryData({ ...tables, sites: [site] }), now: () => NOW });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = await (t.get_site.execute as any)({ site_id: site.id }, opts);
    assert.deepEqual(detail.data.timeline, []);
    assert.ok(detail.caveats.some((c: string) => /Partial timeline: 0 of 3/.test(c)));
  }
});

test("what_worked preserves Analytics intervals/censoring and cites the contributing years", async () => {
  const outcome = { ...tables.action_outcomes![0], n_recurred: 124, n_censored: 8, window_days: 60, observed_through: "2026-10-23", ci_low: 26.67, ci_high: 35.64, by_year: { "2023": { n: 400, recurred: 124 } }, source_ids: ["fixture-311-2023"] };
  const data: AgentData = {
    ...createMemoryData({ ...tables, action_outcomes: [outcome], sources: [{ id: "fixture-311-2023", name: "Fixture 2023", url: "https://example.org/2023" }] }),
    incidents: async () => { throw new Error("Must cite outcome sources, not an unrelated recent sample"); },
  };
  const t = createServerTools({ data, now: () => NOW });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (t.what_worked.execute as any)({}, opts);
  assert.equal(result.ok, true);
  for (const key of ["ci_low", "ci_high", "n_censored", "observed_through", "by_year"] as const) assert.deepEqual(result.data.outcomes[0][key], outcome[key]);
  assert.deepEqual(result.sources.map((s: { id: string }) => s.id), outcome.source_ids);
});


test("v2 exposes queue counts and fractional base rates, while retired sites stay historical", async () => {
  const active = { ...tables.sites![0], score: 0, summary: { definition: "dbscan_50m_min3_v2", due: true,
    returns_12mo: 3, closures: 5, last_closed_at: "2026-10-01T12:00:00Z", days_since_close: 23,
    base_rate: { n: 100, rate: 0.6 }, due_threshold: 0.5, source_ids: ["fixture-311"] } };
  const retired = { ...active, id: "fixture-retired", rank: null, summary: { ...active.summary, retired: true, due: false } };
  const t = createServerTools({ data: createMemoryData({ ...tables, sites: [active,retired] }), now: () => NOW });
  const top = await t.top_sites.execute!({}, opts);
  assert.ok("ok" in top && top.ok);
  assert.deepEqual(top.data.sites.map((s: { id: string }) => s.id), [active.id]);
  assert.equal(top.data.sites[0].score, null);
  assert.match(top.caveats[0], /No composite score/);
  const due = await t.due_sites.execute!({}, opts);
  assert.ok("ok" in due && due.ok);
  assert.equal(due.data.sites[0].last_closed, active.summary.last_closed_at);
  assert.equal(due.data.sites[0].base_rate_unit, "fraction");
  assert.equal(due.data.sites[0].due_threshold, 0.5);
  const draft = await t.draft_work_order.execute!({ site_id: retired.id, action: "inspection" }, opts);
  assert.ok("ok" in draft && draft.ok);
  assert.equal(draft.data.drafted, false);
  assert.match(draft.caveats[0], /retired/);
  const detail = await t.get_site.execute!({ site_id: retired.id }, opts);
  assert.ok("ok" in detail && detail.ok);
  assert.equal(detail.data.found, true);
  assert.ok(detail.data.site);
  assert.equal(detail.data.site.retired, true);
});
