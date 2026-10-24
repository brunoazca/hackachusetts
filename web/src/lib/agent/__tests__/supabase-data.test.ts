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
    if (request.method === "HEAD") return new Response(null, { headers: { "content-range": "*/1121" } });
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
