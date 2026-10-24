import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { classifyError, createSupabaseData, supabaseConfigured } from "../data/supabase";
import { createServerTools } from "../tools/server";

// Read-only validation against the shared Supabase (anon key, RLS public read;
// nothing here writes). Skips when env is missing. Run from web/:
//   npx -y tsx@4.20.6 --env-file=.env.local --test src/lib/agent/__tests__/live.test.ts
//
// ok:false never counts as success: tools on ingested data must return ok:true
// with rows, and totals are cross-checked with an independent query.

const skip = supabaseConfigured() ? false : "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set";
const opts = { toolCallId: "live", messages: [] } as never;
const ANALYTICS = new Set(["sites", "action_outcomes", "grid_cells", "correlations", "predictions"]);

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools = () => createServerTools({ data: createSupabaseData() }) as any;
const call = (name: string, input: unknown) => tools()[name].execute(input, opts);

/** State of each table the agent reads: ok / empty / analytics_not_computed / permission / missing_table / connection / query. */
test("live: table states (connection, permission, empty, analytics)", { skip, timeout: 30_000 }, async () => {
  const states: Record<string, string> = {};
  for (const t of ["sources", "incidents", "places", "events", "sites", "action_outcomes", "grid_cells", "correlations", "predictions"]) {
    const { count, error } = await db().from(t).select("*", { count: "exact", head: true });
    states[t] = error ? classifyError(error) : count ? `ok (${count} rows)` : ANALYTICS.has(t) ? "analytics_not_computed (0 rows)" : "empty (0 rows)";
  }
  console.log("table states", states);
  for (const [table, state] of Object.entries(states)) assert.match(state, /^(ok|empty|analytics_not_computed)/, `${table} must be readable: ${state}`);
  for (const t of ["sources", "incidents", "places"]) assert.match(states[t], /^ok/, `${t} must be readable and non-empty`);
});

test("live: search_incidents returns real rows that match an independent count", { skip, timeout: 30_000 }, async () => {
  const r = await call("search_incidents", { categories: ["rodent"], query: "Normandy St", since: "2025-01-01" });
  assert.equal(r.ok, true, r.error);
  const direct = await db().from("incidents").select("id", { count: "exact", head: true })
    .eq("category", "rodent").gte("opened_at", "2025-01-01")
    .or("address_block.ilike.*Normandy St*,neighborhood.ilike.*Normandy St*,zip.eq.Normandy St");
  assert.equal(direct.error, null);
  assert.ok(r.data.total > 0, "Normandy St has rodent reports");
  assert.equal(r.data.total, direct.count, "tool total = direct count");
  assert.ok(r.data.items.every((i: { address_block: string | null }) => !/^\d/.test(i.address_block ?? "")), "no house numbers");
  assert.ok(r.sources.length > 0 && r.sources.every((s: { name: string | null; url: string | null }) => s.name && s.url), "every cited source resolves with a link");
  console.log("search_incidents", { total: r.data.total, by_status: r.data.by_status, by_action: r.data.by_action, sources: r.sources.map((s: { id: string }) => s.id) });
});

test("live: geocode → nearby_drivers on real coordinates", { skip, timeout: 30_000 }, async () => {
  const g = await call("geocode", { query: "Normandy St" });
  assert.equal(g.ok, true, g.error);
  assert.equal(g.data.found, true);
  const m = g.data.matches[0];
  assert.ok(m.lat > 42.2 && m.lat < 42.4 && m.lon > -71.2 && m.lon < -70.9, "match is in Boston");
  const n = await call("nearby_drivers", { lat: m.lat, lon: m.lon, radius_m: 150 });
  assert.equal(n.ok, true, n.error);
  const drivers = n.data.driver_reports.reduce((s: number, d: { n: number }) => s + d.n, 0);
  assert.ok(drivers + n.data.places.reduce((s: number, p: { n: number }) => s + p.n, 0) > 0, "found driver reports or places");
  console.log("geocode", { label: m.label, reports: m.reports }, "nearby_drivers", { drivers: n.data.driver_reports.slice(0, 5), places: n.data.places, sources: n.sources.length });
});

test("live: site tools use Analytics sites, else the provisional draft queue", { skip, timeout: 30_000 }, async (t) => {
  const siteCount = await db().from("sites").select("id", { count: "exact", head: true });
  assert.equal(siteCount.error, null);
  const sites = (await createSupabaseData().siteSource()) === "analytics";
  const queue = await db().rpc("site_queue", { lim: 1 }, { get: true });
  if (!sites && queue.error && queue.error.code !== "PGRST202") assert.fail(`draft queue: ${classifyError(queue.error)}`);
  const top = await call("top_sites", { limit: 5 });
  const report: Record<string, unknown> = { sites_table: siteCount.count, analytics_active: sites, draft_queue: queue.error ? classifyError(queue.error) : "ok" };

  if (!sites && (queue.error || !queue.data?.length)) {
    assert.equal(top.ok, false);
    assert.equal(top.reason, "analytics_not_computed");
    t.skip("BLOCKED: Analytics sites and provisional queue are unavailable");
    return;
  } else {
    assert.equal(top.ok, true, top.error);
    assert.ok(top.data.sites.length > 0);
    if (!sites) assert.ok(top.data.sites.every((x: { provisional: boolean; score: unknown }) => x.provisional && x.score === null), "draft sites are flagged, never scored");
    // Normandy St (the demo site) through geocode → get_site → nearby_drivers → draft_work_order.
    const g = await call("geocode", { query: "Normandy St" });
    assert.equal(g.ok, true, g.error);
    const site = g.data.sites[0];
    assert.ok(site, "Normandy St must resolve to a site; another top site is not a substitute");
    assert.match(site.address_block, /Normandy St/i);
    const s = await call("get_site", { site_id: site.id });
    assert.equal(s.ok, true, s.error);
    assert.ok(s.data.timeline.length > 0, "site timeline has real reports");
    assert.ok(s.sources.length > 0 && s.sources.every((source: { name: string | null; url: string | null }) => source.name && source.url));
    if (!sites) {
      const detail = await db().rpc("site_detail", { site_id: site.id }, { get: true });
      assert.equal(detail.error, null);
      assert.deepEqual(s.data.timeline.map((r: { id: string }) => r.id).sort(), detail.data.reports.map((r: { id: string }) => r.id).sort(), "timeline matches exact RPC report ids");
    } else {
      const direct = await db().from("sites").select("summary").eq("id", site.id).single();
      assert.equal(direct.error, null);
      const listed = direct.data?.summary?.timeline;
      if (Array.isArray(listed)) assert.deepEqual(s.data.timeline.map((r: { id: string }) => r.id).sort(), listed.map((r: { id: string }) => r.id).sort(), "timeline matches Analytics' exact report ids");
    }
    const n = await call("nearby_drivers", { site_id: site.id });
    assert.equal(n.ok, true, n.error);
    const d = await call("draft_work_order", { site_id: site.id, action: "inspection" });
    assert.equal(d.ok, true, d.error);
    assert.equal(d.data.saved, false);
    assert.equal(d.data.status, "draft");
    Object.assign(report, {
      top_sites: top.data.sites.map((x: { id: string; address_block: string }) => `${x.id} ${x.address_block}`),
      demo_site: `${site.id} ${site.address_block}`, timeline: s.data.timeline.length, actions_taken: s.data.actions_taken,
      drivers: n.data.driver_reports.slice(0, 4), draft: `${d.data.action_label} · ${d.data.status} · saved=${d.data.saved}`,
    });
  }
  console.log("site tools", report);
});

test("live: what_worked returns computed outcomes", { skip, timeout: 30_000 }, async (t) => {
  const direct = await db().from("action_outcomes").select("action_tag,n,recur_60d_pct");
  assert.equal(direct.error, null);
  const ww = await call("what_worked", {});
  if (!direct.data?.length) {
    assert.equal(ww.ok, false);
    assert.equal(ww.reason, "analytics_not_computed");
    t.skip("BLOCKED: action_outcomes is empty; error handling verified, real outcomes not validated");
    return;
  }
  assert.equal(ww.ok, true, ww.error);
  assert.deepEqual(ww.data.outcomes.map((r: { action_tag: string; n: number; recur_60d_pct: number }) => ({ action_tag: r.action_tag, n: r.n, recur_60d_pct: r.recur_60d_pct })).sort((a: { action_tag: string }, b: { action_tag: string }) => a.action_tag.localeCompare(b.action_tag)), [...direct.data].sort((a, b) => a.action_tag.localeCompare(b.action_tag)));
});

test("live: top_sites area filter and draft search agree with database results", { skip, timeout: 30_000 }, async () => {
  const data = createSupabaseData();
  const source = await data.siteSource();
  assert.notEqual(source, "none", "requires Analytics sites or provisional queue");
  const matches = await data.sitesByText("Normandy St", 5);
  assert.ok(matches.length > 0);
  assert.ok(matches.every((s) => /Normandy St/i.test(s.address_block)));
  const { lat, lon } = matches[0];
  assert.ok(lat != null && lon != null, "use coordinates from the real site");
  const bbox: [number, number, number, number] = [lon - 0.001, lat - 0.001, lon + 0.001, lat + 0.001];
  const result = await call("top_sites", { limit: 5, bbox });
  assert.equal(result.ok, true, result.error);
  const v2 = matches[0].summary.definition === "dbscan_50m_min3_v2";
  const query = source === "draft"
    ? db().rpc("draft_sites", {}, { get: true }).select("id,due,returns,reports,last_at,lat,lon").order("due", { ascending: false }).order("returns", { ascending: false }).order("reports", { ascending: false }).order("last_at", { ascending: false }).order("id")
    : v2
      ? db().from("sites").select("id", { count: "exact" }).eq("summary->>definition", "dbscan_50m_min3_v2").not("rank", "is", null).order("id")
      : db().from("sites").select("id").not("rank", "is", null).order("score", { ascending: false }).order("id");
  const direct = await query.gte("lon", bbox[0]).lte("lon", bbox[2]).gte("lat", bbox[1]).lte("lat", bbox[3]).limit(5);
  assert.equal(direct.error, null);
  assert.ok(Array.isArray(direct.data) && direct.data.length, "Normandy area has sites");
  if (v2) {
    assert.equal(result.data.sites.length, Math.min(direct.count ?? 0, 5));
    assert.ok(result.data.sites.every((s: { lat: number; lon: number }) => s.lon >= bbox[0] && s.lon <= bbox[2] && s.lat >= bbox[1] && s.lat <= bbox[3]));
    if ((direct.count ?? 0) <= 5) assert.deepEqual(result.data.sites.map((s: { id: string }) => s.id).sort(), direct.data.map((s) => s.id).sort());
  } else assert.deepEqual(result.data.sites.map((s: { id: string }) => s.id), direct.data.map((s) => s.id));
  console.log("area-filtered sites", { source, matched: direct.data.length, normandy_sites: matches.length });
});


test("live: due_sites agrees with read-only Due flags", { skip, timeout: 30_000 }, async (t) => {
  const data = createSupabaseData();
  const source = await data.siteSource();
  const result = await call("due_sites", { limit: 10 });
  let v2 = false;
  if (source === "analytics") {
    const probe = await db().from("sites").select("id").eq("summary->>definition", "dbscan_50m_min3_v2").not("rank", "is", null).limit(1);
    assert.equal(probe.error, null);
    v2 = Boolean(probe.data?.length);
    const ready = await db().from("sites").select("id").not("summary->due", "is", null).limit(1);
    assert.equal(ready.error, null);
    if (!ready.data?.length) {
      assert.equal(result.ok, false);
      assert.equal(result.reason, "analytics_not_computed");
      t.skip("BLOCKED: Analytics sites exist but v2 Due flags have not been computed (task 2.19)");
      return;
    }
  }
  assert.equal(result.ok, true, result.error);
  if (v2) {
    // Independent database function recomputes Due in Boston time and orders it first.
    const queue = await db().rpc("site_queue", { lim: 10 }, { get: true });
    assert.equal(queue.error, null);
    assert.deepEqual(result.data.sites.map((s: { id: string }) => s.id), queue.data.filter((s: { due: boolean }) => s.due).map((s: { id: string }) => s.id));
    assert.equal(result.data.provisional, false);
    assert.ok(result.data.sites.every((s: { base_rate_unit: string }) => s.base_rate_unit === "fraction"));
    console.log("due_sites", { source: "v2", returned: result.data.sites.length, independent_rpc_ids_match: true });
    return;
  }
  const direct = source === "draft"
    ? await db().rpc("draft_sites", {}, { get: true }).select("id,due,returns,reports,last_at").eq("due", true)
      .order("due", { ascending: false }).order("returns", { ascending: false }).order("reports", { ascending: false })
      .order("last_at", { ascending: false }).order("id").limit(10)
    : await db().from("sites").select("id,recurrence_count").eq("summary->>due", "true")
      .order("recurrence_count", { ascending: false }).order("id").limit(10);
  assert.equal(direct.error, null);
  assert.ok(Array.isArray(direct.data));
  assert.deepEqual(result.data.sites.map((s: { id: string }) => s.id), direct.data.map((s) => s.id));
  assert.ok(result.data.sites.length > 0, "live Due sites are required for this validation");
  assert.ok(result.sources.length > 0);
  assert.equal(result.data.provisional, source === "draft");
  if (source === "draft") {
    assert.ok(result.data.sites.every((s: { base_rate: unknown }) => s.base_rate === null));
    assert.match(result.caveats[0], /not the Spec v2 base-rate threshold/);
  }
  console.log("due_sites", { source, returned: result.data.sites.length, provisional: result.data.provisional, independent_ids_match: true });
});
