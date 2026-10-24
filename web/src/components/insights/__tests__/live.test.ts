// LIVE, READ-ONLY: public-key GET/HEAD requests, no fixtures and no database writes.
// Run from web/: npx tsx --env-file=.env.local --test src/components/insights/__tests__/live.test.ts
// Missing RPC/data is an explicit SKIP for value comparisons, never a successful real-data validation.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ForecastSummary from "../ForecastSummary";
import { loadInsights } from "../load";
import { toFinding, toForecast, toImpact } from "../parse";
import { fmtNumber, fmtPct } from "../format";
import type { CorrelationRow, InsightsPayload, InsightsState, ModelRunRow, PriceImpactRow } from "../types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const skip = !url || !key ? "Supabase env not loaded" : false;
const options = { skip, timeout: 30_000 };
let db: SupabaseClient;
let state: InsightsState;
let payload: InsightsPayload;
let rpcMissing = false;
let correlations: CorrelationRow[];
let impacts: PriceImpactRow[];
let runs: ModelRunRow[];

before(async () => {
  if (skip) return;
  db = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => {
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "GET" && method !== "HEAD") throw new Error("Live Insights tests only allow GET/HEAD");
      return fetch(input, { ...init, signal: AbortSignal.timeout(15_000) });
    } },
  });
  const [rpc, corr, costs, models] = await Promise.all([
    db.rpc("insights_summary", undefined, { get: true }),
    db.from("correlations").select("*").order("sort").order("id"),
    db.from("price_impact").select("*").order("id"),
    db.from("model_runs").select("id,model,trained_through,params,metrics,feature_importance,created_at")
      .in("model", ["cell_week_poisson_gbm", "cell_week_baseline_mean4"])
      .order("created_at", { ascending: false }).order("id", { ascending: false }),
  ]);
  for (const [name, r] of [["correlations", corr], ["price_impact", costs], ["model_runs", models]] as const) {
    assert.ok(!r.error, `${name}: HTTP ${r.status}, ${r.error?.code ?? "no error"}`);
  }
  rpcMissing = rpc.error?.code === "PGRST202";
  assert.ok(!rpc.error || rpcMissing, `insights_summary: HTTP ${rpc.status}, ${rpc.error?.code}`);
  // Adapt this exact real response; do not issue a second RPC that may observe a newer run.
  state = await loadInsights(async () => ({ data: rpc.data, error: rpc.error }));
  payload = rpc.data;
  correlations = corr.data as CorrelationRow[];
  impacts = costs.data as PriceImpactRow[];
  runs = models.data as ModelRunRow[];
}, { timeout: 30_000 });

test("live: endpoint availability is handled correctly (not a success-path validation)", options, (t) => {
  t.diagnostic(`Public rows: correlations=${correlations.length}, price_impact=${impacts.length}, cell-week model_runs=${runs.length}`);
  if (rpcMissing) {
    assert.equal(state.status, "unavailable");
    if (state.status === "unavailable") assert.match(state.reason, /insights_summary/);
    t.diagnostic("HTTP 404/PGRST202: integration comparisons below are blocked by the missing RPC.");
  } else if (!correlations.length && !impacts.length && !runs.length) {
    assert.equal(state.status, "unavailable");
  } else {
    assert.equal(state.status, "ready");
  }
});

for (const model of ["cell_week_poisson_gbm", "cell_week_baseline_mean4"]) {
  test(`live: stored ${model} scores survive adaptation and SSR (not browser/RPC integration)`, options, (t) => {
    const run = runs.find((r) => r.model === model);
    if (!run) { t.skip(`No stored ${model} run`); return; }
    const m = run.metrics as Record<string, unknown>;
    assert.equal(typeof m.mae, "number");
    assert.equal(typeof m.top10pct_capture, "number");
    const f = toForecast({ run, weeks: [], top_cells: [] })!;
    const baseline = model === "cell_week_baseline_mean4";
    assert.equal(f.isBaseline, baseline);
    assert.equal(f.mae[baseline ? "baseline" : "model"], m.mae);
    assert.equal(f.top10[baseline ? "baseline" : "model"], m.top10pct_capture);
    if (!baseline) {
      assert.equal(f.mae.baseline, m.baseline_mae ?? null);
      assert.equal(f.top10.baseline, m.baseline_top10pct_capture ?? null);
    }
    const html = renderToStaticMarkup(createElement(ForecastSummary, { forecast: f }));
    assert.ok(html.includes(`>${fmtNumber(m.mae as number, 3)}<`));
    assert.ok(html.includes(`>${fmtPct(m.top10pct_capture as number)}<`));
    if (baseline) assert.match(html, /Baseline only/);
    else if (typeof m.baseline_mae === "number" && (m.mae as number) > m.baseline_mae) {
      assert.match(html, /Worse than baseline/);
    }
    t.diagnostic(`${run.id}: MAE=${m.mae}, top10pct_capture=${m.top10pct_capture}; raw stored rows, no fixtures.`);
  });
}

test("live integration: RPC findings match stored findings", options, (t) => {
  if (rpcMissing) { t.skip("insights_summary is missing (404/PGRST202)"); return; }
  if (!correlations.length) { t.skip("No real correlation rows to compare"); return; }
  assert.equal(state.status, "ready");
  if (state.status !== "ready") return;
  assert.deepEqual(payload.correlations, correlations);
  assert.deepEqual(state.data.findings, correlations.map((row) => toFinding(row, payload.sources ?? [])));
});

test("live integration: RPC costs and prices match stored rows", options, (t) => {
  if (rpcMissing) { t.skip("insights_summary is missing (404/PGRST202)"); return; }
  if (!impacts.length) { t.skip("No real price/cost rows to compare"); return; }
  assert.equal(state.status, "ready");
  if (state.status !== "ready") return;
  assert.deepEqual(payload.price_impact, impacts);
  const shown = [...state.data.costs, ...state.data.exploratory];
  assert.equal(shown.length, impacts.length);
  for (const row of impacts) assert.deepEqual(shown.find((s) => s.id === row.id), toImpact(row, payload.sources ?? []));
});

test("live integration: forecast run, week totals and top cells match stored predictions", { ...options, timeout: 60_000 }, async (t) => {
  if (rpcMissing) { t.skip("insights_summary is missing (404/PGRST202)"); return; }
  const run = runs.find((r) => r.model === "cell_week_poisson_gbm") ?? runs.find((r) => r.model === "cell_week_baseline_mean4");
  if (!run) { t.skip("No real cell-week model run to compare"); return; }
  assert.equal(state.status, "ready");
  assert.equal(payload.forecast?.run?.id, run.id);
  assert.deepEqual(payload.forecast?.run?.metrics, run.metrics);
  const monday = new Date();
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const predictions: { cell_id: string; week_start: string; expected: number; risk_band: string }[] = [];
  // Pagination is essential: the real forecast covers thousands of cells, beyond the REST row cap.
  for (let from = 0; ; from += 1000) {
    const r = await db.from("predictions").select("cell_id,week_start,expected,risk_band")
      .eq("model_run_id", run.id).is("actual", null).gte("week_start", monday.toISOString().slice(0, 10))
      .order("week_start").order("cell_id").range(from, from + 999);
    assert.ok(!r.error, `predictions: HTTP ${r.status}, ${r.error?.code}`);
    predictions.push(...r.data!);
    if (r.data!.length < 1000) break;
  }
  const weeks = payload.forecast!.weeks ?? [];
  assert.deepEqual(weeks.map((w) => w.week_start), [...new Set(predictions.map((p) => p.week_start))]);
  for (const week of weeks) {
    const rows = predictions.filter((p) => p.week_start === week.week_start);
    const sum = rows.reduce((total, p) => total + p.expected, 0);
    // expected is SQL real; sums can differ slightly in float32 vs JS float64.
    assert.ok(Math.abs(week.expected_total - sum) <= Math.max(1e-4, Math.abs(sum) * 1e-5));
    assert.equal(week.cells, rows.length);
    for (const band of ["low", "elevated", "high", "very_high"] as const) {
      assert.equal(week.bands[band] ?? 0, rows.filter((p) => p.risk_band === band).length);
    }
  }
  const first = predictions.filter((p) => p.week_start === weeks[0]?.week_start)
    .sort((a, b) => b.expected - a.expected || a.cell_id.localeCompare(b.cell_id)).slice(0, 5);
  assert.deepEqual((payload.forecast!.top_cells ?? []).map((c) => [c.cell_id, c.expected]), first.map((c) => [c.cell_id, c.expected]));
  t.diagnostic(`Compared ${predictions.length} real predictions across ${weeks.length} weeks.`);
});


test("live integration: every finding/cost source matches stored citation metadata", options, async (t) => {
  if (rpcMissing) { t.skip("insights_summary is missing (404/PGRST202)"); return; }
  const ids = [...new Set([...correlations, ...impacts].flatMap((r) => r.source_ids ?? []))].sort();
  if (!ids.length) { t.skip("No real finding/cost source references to compare"); return; }
  assert.ok(payload.sources?.length, "RPC must include name, URL and retrieval date for cited sources");
  const result = await db.from("sources").select("id,name,url,retrieved_at").in("id", ids).order("id");
  assert.ok(!result.error, `sources: HTTP ${result.status}, ${result.error?.code}`);
  assert.deepEqual(result.data!.map((s) => s.id), ids, "Every source reference must resolve");
  assert.deepEqual(payload.sources!.filter((s) => ids.includes(s.id)).sort((a, b) => a.id.localeCompare(b.id)), result.data);
});
