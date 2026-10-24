import { test } from "node:test";
import assert from "node:assert/strict";
import { createInsightsTools } from "../tools/insights";
import { createMemoryData } from "../data/memory";
import { fullPayload } from "../../../components/insights/__tests__/fixtures";
import { toInsightsData } from "../../../components/insights/parse";
import { HISTORICAL_RESEARCH } from "../../insights-history";
import { createSupabaseData } from "../data/supabase";

const opts = { toolCallId: "test-insights", messages: [], context: {} };
async function run(tool: ReturnType<typeof createInsightsTools>["get_insights"], topic: "all" | "findings" | "forecast" | "costs" | "prices" | "historical") {
  const result = await tool.execute!({ topic }, opts);
  assert.ok("ok" in result, "tool returns one completed result, not an async stream");
  return result;
}
test("assistant and panel interpret exactly the same insights, with citations and limits", async () => {
  const tool = createInsightsTools(createMemoryData({ insights: fullPayload })).get_insights;
  const result = await run(tool, "all");
  assert.ok(result.ok);
  if (!result.ok) return;
  const panel = toInsightsData(fullPayload);
  assert.deepEqual(result.data.findings, panel.findings);
  assert.deepEqual(result.data.forecast, panel.forecast);
  assert.deepEqual(result.data.costs, panel.costs);
  assert.deepEqual(result.data.prices, panel.exploratory);
  assert.deepEqual(result.data.historical, HISTORICAL_RESEARCH);
  assert.ok(result.sources.some(source => source.id === HISTORICAL_RESEARCH.source.id));
  for (const finding of panel.findings) assert.ok(result.caveats.includes(finding.caveat));
  assert.match(result.data.scope, /unaffected by map/);
});

test("unavailable live insights remain distinguishable from the historical snapshot", async () => {
  const tools = createInsightsTools(null);
  const all = await run(tools.get_insights, "all");
  assert.ok(all.ok);
  if (all.ok) {
    assert.equal(all.data.live_status, "unavailable");
    assert.equal(all.data.forecast, null);
    assert.equal(all.data.historical?.date, "2026-10-24");
    assert.ok(all.data.missing.includes("forecast"));
  }
  const forecast = await run(tools.get_insights, "forecast");
  assert.equal(forecast.ok, false);
});

test("RPC failure and invalid payload are explicit and never become invented forecasts", async () => {
  for (const data of [
    { ...createMemoryData({}), insightsSummary: async () => { throw new Error("Database unavailable"); } },
    createMemoryData({ insights: { unexpected: true } }),
  ]) {
    const result = await run(createInsightsTools(data).get_insights, "forecast");
    assert.equal(result.ok, false);
  }
});

test("historical research can be read without a live lookup", async () => {
  const data = { ...createMemoryData({}), insightsSummary: async () => { throw new Error("Must not be called"); } };
  const result = await run(createInsightsTools(data).get_insights, "historical");
  assert.ok(result.ok);
  if (result.ok) assert.equal(result.data.live_status, "not_requested");
});

test("Supabase insights adapter uses only GET on the same RPC as the panel", async (t) => {
  const calls: { url: string; method: string }[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    calls.push({ url: request.url, method: request.method });
    assert.equal(new URL(request.url).hostname, "agent.invalid");
    return Response.json(fullPayload);
  });
  const result = await createSupabaseData({ NEXT_PUBLIC_SUPABASE_URL: "https://agent.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-key" }).insightsSummary();
  assert.deepEqual(result, fullPayload);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.match(calls[0].url, /\/rpc\/insights_summary/);
});

test("forecast comparison cannot invert MAE when ranking and count accuracy disagree", async () => {
  const payload = structuredClone(fullPayload);
  payload.forecast!.run!.metrics = { mae: 0.073, baseline_mae: 0.071, top10pct_capture: 0.65, baseline_top10pct_capture: 0.54 };
  const result = await run(createInsightsTools(createMemoryData({ insights: payload })).get_insights, "forecast");
  assert.ok(result.ok);
  if (result.ok) {
    assert.equal(result.data.forecastComparison?.countAccuracy.modelVsBaseline, "worse");
    assert.equal(result.data.forecastComparison?.hotspotRanking.modelVsBaseline, "better");
  }
});
