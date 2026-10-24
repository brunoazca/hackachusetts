import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createSupabaseData } from "../data/supabase";
import { DataUnavailableError } from "../data/types";
import { createMemoryData } from "../data/memory";

// Mock HTTP only: exercises the real Supabase adapter without database access.
const draft = {
  id: "fixture-draft", address_block: "Fixture St, 02121", neighborhood: "Dorchester",
  city: "boston", lat: 42.3051, lon: -71.0712, reports: 4, closures: 3, returns: 2,
  first_at: "2026-01-01", last_at: "2026-10-01", due: true,
};
const json = (body: unknown, status = 200) => Response.json(body, { status });

function adapter(t: TestContext, rpc: (url: URL) => Response) {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    assert.equal(url.hostname, "agent.invalid");
    if (url.pathname === "/rest/v1/sites") {
      assert.equal(request.method, "HEAD");
      return new Response(null, { headers: { "content-range": "*/0" } });
    }
    assert.equal(request.method, "GET", "RPCs must be read-only GET requests");
    return rpc(url);
  });
  return createSupabaseData({ NEXT_PUBLIC_SUPABASE_URL: "https://agent.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-key" });
}

for (const [reason, error, status] of [
  ["permission", { code: "42501", message: "permission denied for function site_queue" }, 403],
  ["connection", { code: "", message: "TypeError: fetch failed" }, 400],
  ["query", { code: "57014", message: "statement timeout" }, 400],
] as const) {
  test(`draft queue ${reason} error is not reported as missing analytics`, async (t) => {
    const data = adapter(t, () => json(error, status));
    await assert.rejects(data.siteSource(), (e) => e instanceof DataUnavailableError && e.reason === reason);
  });
}

test("missing optional draft RPC means sites are not available yet", async (t) => {
  const data = adapter(t, () => json({ code: "PGRST202", message: "Could not find the function public.site_queue" }, 404));
  assert.equal(await data.siteSource(), "none");
});

test("an empty draft queue is not a populated site source", async (t) => {
  assert.equal(await adapter(t, () => json([])).siteSource(), "none");
});

test("draft site area filters reach the database before the limit", async (t) => {
  let filtered = false;
  const data = adapter(t, (url) => {
    if (url.pathname.endsWith("/site_queue")) return json([draft]);
    assert.ok(url.pathname.endsWith("/draft_sites"));
    const q = url.searchParams;
    assert.equal(q.get("neighborhood"), "ilike.%dor%");
    assert.equal(q.get("city"), "eq.boston");
    assert.deepEqual(q.getAll("lon"), ["gte.-71.08", "lte.-71.06"]);
    assert.deepEqual(q.getAll("lat"), ["gte.42.3", "lte.42.31"]);
    assert.equal(q.get("limit"), "1");
    assert.match(q.get("order")!, /^due.desc,returns.desc,reports.desc,last_at.desc/);
    assert.ok(!q.get("select")!.includes("last_note"), "raw notes are not requested");
    filtered = true;
    return json([draft]);
  });
  const rows = await data.sites({ limit: 1, neighborhood: "dor", city: "boston", bbox: [-71.08, 42.3, -71.06, 42.31] });
  assert.equal(filtered, true, "must not filter only the first citywide queue entries");
  assert.equal(rows[0].id, draft.id);
  assert.equal(rows[0].score, null);
  assert.equal(rows[0].provisional, true);
});

test("draft text search reaches the database before the limit", async (t) => {
  let filtered = false;
  const data = adapter(t, (url) => {
    if (url.pathname.endsWith("/site_queue")) return json([draft]);
    assert.ok(url.pathname.endsWith("/draft_sites"));
    assert.equal(url.searchParams.get("or"), "(address_block.ilike.*Fixture St*,neighborhood.ilike.*Fixture St*)");
    assert.equal(url.searchParams.get("limit"), "5");
    filtered = true;
    return json([draft]);
  });
  assert.equal((await data.sitesByText("Fixture St", 5))[0].id, draft.id);
  assert.equal(filtered, true, "must not search only a capped citywide queue");
});

test("fixture adapter distinguishes draft sites from analytics sites", async () => {
  const site = {
    ...draft, zip: "02121", score: null, rank: null, report_count: 4, recurrence_count: 2,
    summary: {}, recommended: [], computed_at: null, provisional: true, reports: undefined,
  };
  assert.equal(await createMemoryData({ draft_sites: [site] }).siteSource(), "draft");
});


test("due_sites predicate runs in the draft database query before its limit", async (t) => {
  let dueQuery = false;
  const data = adapter(t, (url) => {
    if (url.pathname.endsWith("/site_queue")) return json([draft]);
    assert.equal(url.searchParams.get("due"), "eq.true");
    assert.equal(url.searchParams.get("limit"), "1");
    dueQuery = true;
    return json([{ ...draft, last_closed: "2026-10-01", days_since_close: 23 }]);
  });
  const rows = await data.sites({ due: true, limit: 1 });
  assert.equal(dueQuery, true);
  assert.equal(rows[0].summary.due, true);
  assert.equal(rows[0].summary.days_since_close, 23);
});


test("Analytics outcomes read optional columns without requiring the additive migration", async (t) => {
  const base = { action_tag: "inspection", n: 100, recur_60d_pct: 20, median_days_to_next: 25, computed_at: null };
  const extended = { ...base, ci_low: 13.3, ci_high: 28.9, n_censored: 3, window_days: 60, source_ids: ["fixture-2023"], extra_column: "not exposed to the model" };
  let payload = base;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    assert.equal(request.method, "GET");
    assert.equal(new URL(request.url).pathname, "/rest/v1/action_outcomes");
    return json([payload]);
  });
  const data = createSupabaseData({ NEXT_PUBLIC_SUPABASE_URL: "https://agent.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-key" });
  const legacy = (await data.actionOutcomes())[0];
  assert.equal(legacy.n, 100);
  assert.equal(legacy.ci_low, undefined);
  payload = extended;
  const analytics = (await data.actionOutcomes())[0];
  assert.equal(analytics.ci_low, 13.3);
  assert.equal(analytics.ci_high, 28.9);
  assert.deepEqual(analytics.source_ids, ["fixture-2023"]);
  assert.ok(!("extra_column" in analytics));
});

test("populated Analytics sites without v2 Due flags report analytics_not_computed", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    assert.equal(url.pathname, "/rest/v1/sites");
    if (request.method === "HEAD") return new Response(null, { headers: { "content-range": url.searchParams.has("summary->>definition") ? "*/0" : "*/1121" } });
    assert.equal(request.method, "GET");
    assert.equal(url.searchParams.get("summary->due"), "not.is.null");
    return json([]);
  });
  const data = createSupabaseData({ NEXT_PUBLIC_SUPABASE_URL: "https://agent.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-key" });
  assert.equal(await data.siteSource(), "analytics");
  await assert.rejects(data.sites({ limit: 10, due: true }), (e) => e instanceof DataUnavailableError && e.reason === "analytics_not_computed");
});


test("source citations preserve database update cadence and retrieval time", async (t) => {
  const source = { id: "fixture-source", name: "Fixture", url: "https://example.org", retrieved_at: "2026-10-24T12:00:00Z", update_mode: "daily", update_note: "Refreshed overnight" };
  const data = adapter(t, (url) => {
    assert.equal(url.pathname, "/rest/v1/sources");
    assert.equal(url.searchParams.get("select"), "id,name,url,retrieved_at,update_mode,update_note");
    return json([source]);
  });
  assert.deepEqual(await data.sources([source.id]), [source]);
});


test("v2 queue pages all matches before current Due sorting/limit, excluding retired sites", async (t) => {
  const closed = "2026-08-25T23:30:00-04:00"; // 60 Boston calendar days before Oct 24.
  const common = { id: "fixture-v2", address_block: "Fixture St, 02121", neighborhood: "Dorchester", rank: 1,
    report_count: 5, recurrence_count: 4, returns_12mo: 1, last_at: "2026-10-01", last_closed_at: closed,
    definition: "dbscan_50m_min3_v2", source_ids: ["fixture-source"], closures: 4,
    base_rate: { n: 100, rate: 0.6 }, due_threshold: 0.5, retired: false };
  const rows = [
    { ...common, id: "a-expired", last_closed_at: "2026-08-24T23:59:00-04:00", returns_12mo: 99 },
    { ...common, id: "b-low-rate", base_rate: { n: 100, rate: 0.49 } },
    { ...common, id: "c-boundary", returns_12mo: 5 },
    { ...common, id: "d-priority", returns_12mo: 8 },
    { ...common, id: "e-retired", retired: true, returns_12mo: 100 },
  ];
  const offsets: number[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init); const url = new URL(request.url); const q = url.searchParams;
    assert.equal(url.pathname, "/rest/v1/sites");
    assert.equal(q.get("rank"), "not.is.null");
    if (request.method === "HEAD") return new Response(null, { headers: { "content-range": "*/5" } });
    assert.equal(q.get("summary->>definition"), "eq.dbscan_50m_min3_v2");
    assert.equal(q.get("neighborhood"), "ilike.%dor%");
    assert.deepEqual(q.getAll("lon"), ["gte.-71.08", "lte.-71.06"]);
    assert.ok(!q.get("select")!.split(",").includes("summary"), "queue excludes histories and notes");
    const offset = Number(q.get("offset")); offsets.push(offset);
    // Simulate a PostgREST cap smaller than the requested page size.
    return new Response(JSON.stringify(rows.slice(offset, offset + 2)), { headers: { "content-type": "application/json", "content-range": `${offset}-${Math.min(offset + 1,4)}/5` } });
  });
  let at = new Date("2026-10-25T03:30:00Z"); // Still Oct 24 in Boston.
  const data = createSupabaseData({ NEXT_PUBLIC_SUPABASE_URL: "https://agent.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-key" }, () => at);
  const query = { due: true, limit: 1, neighborhood: "dor", bbox: [-71.08, 42.3, -71.06, 42.31] as [number, number, number, number] };
  const result = await data.sites(query);
  assert.deepEqual(offsets, [0,2,4]);
  assert.equal(result[0].id, "d-priority");
  assert.equal(result[0].score, null);
  assert.equal(result[0].summary.days_since_close, 60);
  assert.equal(result[0].summary.last_closed, closed);
  at = new Date("2026-10-25T04:01:00Z"); // Day 61; a cached refresh flag must not stay Due.
  assert.deepEqual(await data.sites(query), []);
});

test("v2 site detail masks the placeholder score and expires stored Due", async (t) => {
  const { tables } = await import("./fixtures");
  const row = { ...tables.sites![0], score: 0, summary: { definition: "dbscan_50m_min3_v2", due: true,
    last_closed_at: "2026-08-01T12:00:00Z", base_rate: { n: 10, rate: 0.8 }, due_threshold: 0.5 } };
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    if (request.method === "HEAD") return new Response(null, { headers: { "content-range": "*/1" } });
    return json(row);
  });
  const data = createSupabaseData({ NEXT_PUBLIC_SUPABASE_URL: "https://agent.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-key" }, () => new Date("2026-10-24T12:00:00Z"));
  const result = await data.site(row.id);
  assert.equal(result!.score, null);
  assert.equal(result!.summary.due, false);
  assert.equal(result!.summary.days_since_close, 84);
});

test("exact site histories retain more than 300 IDs without broadening the query", async (t) => {
  const ids = Array.from({ length: 351 }, (_, i) => `fixture-incident-${i}`);
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init); const url = new URL(request.url);
    assert.equal(request.method, "GET");
    assert.equal(url.pathname, "/rest/v1/incidents");
    const requested = url.searchParams.get("id")!.slice(4,-1).split(",");
    assert.ok(requested.every(id => ids.includes(id)));
    return json(requested.map(id => ({ id })));
  });
  const data = createSupabaseData({ NEXT_PUBLIC_SUPABASE_URL: "https://agent.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-key" });
  assert.deepEqual((await data.incidentsByIds([...ids, ids[0]])).map(r => r.id).sort(), [...ids].sort());
});


test("selected draft IDs still resolve after active Analytics sites arrive", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init); const url = new URL(request.url);
    assert.equal(request.method, "GET");
    if (url.pathname === "/rest/v1/sites") return json(null);
    assert.equal(url.pathname, "/rest/v1/rpc/site_detail");
    assert.equal(url.searchParams.get("site_id"), draft.id);
    return json({ site: draft, reports: [], source_ids: ["fixture-source"], drivers_100m_12mo: {}, legacy: true });
  });
  const data = createSupabaseData({ NEXT_PUBLIC_SUPABASE_URL: "https://agent.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-key" });
  const result = await data.site(draft.id);
  assert.equal(result!.id, draft.id);
  assert.equal(result!.provisional, true);
  assert.equal(result!.score, null);
});

test("region reads use GET insights_regions and coordinates from cell_detail", async t => {
  const data = adapter(t, url => {
    if (url.pathname.endsWith("/insights_regions")) {
      assert.equal(url.searchParams.get("lim"), "201");
      return json({ regions: [] });
    }
    assert.ok(url.pathname.endsWith("/cell_detail"));
    assert.equal(url.searchParams.get("cell_id"), "g250_1_2");
    return json({ cell: { id: "g250_1_2", lat: 42.35, lon: -71.08 } });
  });
  assert.deepEqual(await data.regionInsights(), { regions: [] });
  assert.deepEqual(await data.regionLocation("g250_1_2"), { id: "g250_1_2", lat: 42.35, lon: -71.08 });
});

test("region fallback requires complete population coverage and never invents intervention benefit", async t => {
  const data = adapter(t, url => {
    if (url.pathname.endsWith("/insights_regions")) return json({ code: "PGRST202", message: "missing" }, 404);
    if (url.pathname.endsWith("/region_solutions")) return json([{
      region_id: "c1", forecast_run_id: "r1", rank: 1, cell_ids: ["c1", "c2"],
      action: "Inspect", because: "Nearby evidence", lane: "inspect", source: "rules", computed_at: "2026-10-24",
      input: { region: { region_id: "c1", neighborhood: "Back Bay", severity: { observed_12w: 10, expected_4w: 4, score: 14 } },
        forecast: { model_run_id: "r1" }, source_ids: ["311"] },
    }]);
    assert.ok(url.pathname.endsWith("/cell_population"));
    return json([{ cell_id: "c1", pop: 2500, tract_ids: ["t1"], source_id: "acs" }]);
  });
  const r = await data.regionInsights() as { origin: string; regions: { population: unknown; after_fix: unknown }[] };
  assert.equal(r.origin, "region_solutions");
  assert.equal(r.regions[0].population, null, "partial population is not the region total");
  assert.equal(r.regions[0].after_fix, null);
});

test("region permission failures do not silently switch data sources", async t => {
  const data = adapter(t, url => {
    assert.ok(url.pathname.endsWith("/insights_regions"));
    return json({ code: "42501", message: "permission denied" }, 403);
  });
  await assert.rejects(data.regionInsights(), /could not be read/);
});
