import { test } from "node:test";
import assert from "node:assert/strict";
import { isEmpty, parseChart, parseStat, toFinding, toForecast, toImpact, toInsightsData } from "../parse";
import { loadInsights } from "../load";
import { badChartRow, baselineRun, costRow, fullPayload, modelRun, nullRow, priceRow, scatterRow } from "./fixtures";

test("parseStat formats rho/p/n", () => {
  const r = parseStat({ rho: 0.41, p: 0.0004, n: 1234 });
  assert.equal(r.n, 1234);
  assert.match(r.statText!, /ρ = 0\.41/);
  assert.match(r.statText!, /p < 0\.001/);
});

test("parseStat formats lift + CI and before/after with control", () => {
  assert.match(parseStat({ lift: 0.7, ci: [0.55, 0.9] }).statText!, /lift = 0\.7 · 95% CI 0\.55 to 0\.9/);
  const ba = parseStat({ before: 1.2, after: 1.19, control_before: 1.1, control_after: 1.12 }).statText!;
  assert.match(ba, /near: 1\.2 → 1\.19/);
  assert.match(ba, /control: 1\.1 → 1\.12/);
});

test("parseStat keeps unknown numeric keys and handles garbage", () => {
  const odd = parseStat({ odds_ratio: 1.5, note: "x", flags: [1, 2], nested: { a: 1 } });
  assert.equal(odd.statText, null);
  assert.deepEqual(odd.more, [["Odds ratio", "1.5"], ["Note", "x"], ["Flags", "1, 2"]]);
  assert.deepEqual(parseStat(null), { statText: null, n: null, more: [] });
  assert.deepEqual(parseStat({}), { statText: null, n: null, more: [] });
});

test("parseChart accepts the four contract types", () => {
  for (const type of ["scatter", "bar", "line", "event_study"]) {
    const r = parseChart({ type, series: [{ name: "a", points: [[1, 2]] }] });
    assert.equal(r.chart?.type, type);
    assert.equal(r.problem, null);
  }
});

test("parseChart rejects unsupported type, empty series and bad points", () => {
  assert.match(parseChart({ type: "pie", series: [] }).problem!, /not supported/);
  assert.match(parseChart({ type: "bar", series: [] }).problem!, /no data points/);
  assert.match(parseChart({ type: "bar", series: [{ name: "a", points: [[1, null], ["x"], [null, 2]] }] }).problem!, /no data points/);
  assert.match(parseChart(undefined).problem!, /No chart payload/);
  const kept = parseChart({ type: "line", series: [{ points: [[1, 2], [2, "3"], [3, 4]] }] }).chart!;
  assert.equal(kept.series[0].name, "Series 1");
  assert.equal(kept.series[0].points.length, 2);
});

test("toFinding keeps null results and flags unknown strength", () => {
  const f = toFinding(nullRow);
  assert.equal(f.strength, "none");
  assert.equal(f.sampleText, "n = 88");
  assert.deepEqual(f.sources, []);
  assert.equal(toFinding(scatterRow).sampleText, "n = 1,234 (250 m cells)");
  const bad = toFinding(badChartRow);
  assert.equal(bad.strength, null);
  assert.equal(bad.chart, null);
  assert.equal(bad.statText, null);
});

test("findings are ordered by sort", () => {
  const d = toInsightsData(fullPayload);
  assert.deepEqual(d.findings.map((f) => f.id), ["fx-scatter", "fx-null", "fx-bar", "fx-line"]);
});

test("toForecast: model vs baseline scores, weeks sorted, features ranked", () => {
  const f = toForecast(fullPayload.forecast)!;
  assert.equal(f.isBaseline, false);
  assert.deepEqual(f.mae, { model: 0.41, baseline: 0.47 });
  assert.deepEqual(f.top10, { model: 0.38, baseline: 0.42 });
  assert.deepEqual(f.weeks.map((w) => w.week_start), ["2026-10-26", "2026-11-02"]);
  assert.equal(f.features[0].label, "Last 12 weeks average");
  assert.deepEqual(f.topCells[0].drivers, ["Trash storage reports (+0.8)"]);
  assert.equal(toForecast({ run: baselineRun, weeks: [], top_cells: [] })!.isBaseline, true);
  assert.equal(toForecast(null), null);
  assert.equal(toForecast({ run: null, weeks: null, top_cells: null }), null);
  const noMetrics = toForecast({ run: { ...modelRun, metrics: null }, weeks: null, top_cells: null })!;
  assert.deepEqual(noMetrics.mae, { model: null, baseline: null });
});

test("toImpact splits costs from exploratory and formats values", () => {
  const c = toImpact(costRow);
  assert.equal(c.kind, "cost");
  assert.equal(c.headline, "$1,000");
  assert.deepEqual(c.details, [["Vendors", "3"]]);
  const p = toImpact(priceRow);
  assert.equal(p.kind, "exploratory");
  assert.equal(p.headline, "-0.4%");
  assert.deepEqual(p.details.find(([k]) => k === "95% CI"), ["95% CI", "-1.2 to 0.5"]);
  assert.equal(toImpact({ ...priceRow, value: 12.5 }).headline, "12.5");
});

test("isEmpty", () => {
  assert.equal(isEmpty(toInsightsData({ correlations: [], price_impact: [], forecast: null })), true);
  assert.equal(isEmpty(toInsightsData({ correlations: null, price_impact: null, forecast: null })), true);
  assert.equal(isEmpty(toInsightsData(fullPayload)), false);
});

test("loadInsights: ready, empty, missing RPC, RPC error, throw, bad payload", async () => {
  assert.equal((await loadInsights(async () => ({ data: fullPayload, error: null }))).status, "ready");
  const empty = await loadInsights(async () => ({ data: { correlations: [], price_impact: [], forecast: null }, error: null }));
  assert.equal(empty.status, "unavailable");
  const missing = await loadInsights(async () => ({ data: null, error: { code: "PGRST202", message: "Could not find the function" } }));
  assert.equal(missing.status, "unavailable");
  assert.match((missing as { reason: string }).reason, /insights_summary/);
  const err = await loadInsights(async () => ({ data: null, error: { code: "57014", message: "statement timeout" } }));
  assert.deepEqual(err, { status: "error", message: "statement timeout" });
  const thrown = await loadInsights(async () => { throw new Error("Failed to fetch"); });
  assert.deepEqual(thrown, { status: "error", message: "Failed to fetch" });
  assert.equal((await loadInsights(async () => ({ data: [1], error: null }))).status, "error");
  assert.equal((await loadInsights(async () => ({ data: null, error: null }))).status, "error");
});

import { pipelineCitationsCost, pipelineInsufficientRow, pipelineMoveOutRow, pipelinePestCost, pipelineTrashRow, pipelineWhatWorkedRow } from "./fixtures";

test("pipeline shape: trash stat uses partial ρ + permutation p, rest in More statistics", () => {
  const f = toFinding(pipelineTrashRow);
  assert.equal(f.statText, "partial ρ = 0.31 · permutation p = 0.002");
  assert.equal(f.sampleText, "n = 812 (250 m grid cell)");
  const keys = f.moreStats.map(([k]) => k);
  assert.ok(keys.includes("Rho raw") && keys.includes("Ce rho partial") && keys.includes("Year"));
  assert.ok(!keys.includes("Strength") && !keys.includes("N perm"));
  assert.deepEqual(f.moreStats.find(([k]) => k === "Year"), ["Year", "2025"]);
});

test("pipeline shape: insufficient data is stated, not hidden", () => {
  assert.match(toFinding(pipelineInsufficientRow).statText!, /^Not enough data to test/);
});

test("pipeline shape: what-worked n sums by_tag, CI series become error bars", () => {
  const f = toFinding(pipelineWhatWorkedRow);
  assert.equal(f.sampleText, "n = 350 (closed rodent case)");
  assert.deepEqual(f.chart!.series.map((s) => s.name), ["60-day repeat rate"]);
  assert.equal(f.chart!.ci!.lo.name, "95% CI low");
  assert.deepEqual(f.moreStats, [["Observed through", "2026-10-20"]]);
});

test("pipeline shape: move-out keeps scalar/array stats, drops nested per_year", () => {
  const f = toFinding(pipelineMoveOutRow);
  assert.equal(f.statText, null);
  const m = Object.fromEntries(f.moreStats);
  assert.equal(m["Student zips"], "02134, 02215");
  assert.equal(m["Rodent follows"], "no");
  assert.equal(m["Years"], "2024, 2025");
});

test("pipeline shape: pest payments become a USD table, no unlabelled headline", () => {
  const c = toImpact(pipelinePestCost);
  assert.equal(c.kind, "cost");
  assert.equal(c.headline, null);
  assert.deepEqual(c.tables[0].columns, ["Fiscal year", "Amount", "N payments"]);
  assert.deepEqual(c.tables[0].rows, [["2025", "$1,001", "10"], ["2026", "$2,000", "12"]]);
});

test("pipeline shape: citations are labelled details incl. one nested level", () => {
  const c = toImpact(pipelineCitationsCost);
  assert.equal(c.headline, null);
  const d = Object.fromEntries(c.details);
  assert.equal(d["Violations explicit"], "70");
  assert.equal(d["Since 2024 · violations"], "300");
  assert.equal(d["Lower bound"], "yes");
});

test("year-like values are never thousands-separated", () => {
  const d = Object.fromEntries(toImpact(pipelineCitationsCost).details);
  assert.equal(d["Year"], "2025");
});


test("baseline metrics written by the model pipeline appear in the baseline column", () => {
  const run = { ...baselineRun, model: "cell_week_baseline_mean4",
    metrics: { backtest_weeks: 26, mae: 0.07132, top10pct_capture: 0.5433 } };
  const f = toForecast({ run, weeks: [], top_cells: [] })!;
  assert.deepEqual(f.mae, { model: null, baseline: 0.07132 });
  assert.deepEqual(f.top10, { model: null, baseline: 0.5433 });
  // Keep support for the earlier explicit baseline_* payload, including zero.
  const legacy = toForecast({ run: { ...baselineRun, metrics: { baseline_mae: 0, baseline_top10pct_capture: 0 } }, weeks: [], top_cells: [] })!;
  assert.deepEqual(legacy.mae, { model: null, baseline: 0 });
  assert.deepEqual(legacy.top10, { model: null, baseline: 0 });
});

test("malformed RPC envelopes resolve to a retryable error instead of rejecting or looking empty", async () => {
  const empty = { correlations: [], price_impact: [], forecast: null };
  for (const data of [
    {}, { ...empty, correlations: {} }, { ...empty, correlations: [null] },
    { ...empty, correlations: [{ ...scatterRow, title: { unexpected: true } }] },
    { ...empty, price_impact: [null] }, { ...empty, forecast: { run: {} } },
    { ...fullPayload, forecast: { ...fullPayload.forecast, weeks: {} } },
    { ...fullPayload, forecast: { ...fullPayload.forecast, weeks: [{ week_start: "2026-10-26", expected_total: 1, cells: 1, bands: null }] } },
    { ...fullPayload, forecast: { ...fullPayload.forecast, top_cells: [null] } },
  ]) {
    assert.deepEqual(await loadInsights(async () => ({ data, error: null })), {
      status: "error", message: "Unexpected response from insights_summary.",
    });
  }
});


test("analytics handoff: action denominators and unadjusted contrast are retained", () => {
  const row = { ...pipelineWhatWorkedRow, stat: {
    by_tag: { citation: { n: 50, n_censored: 2, recur_60d_pct: 30, ci_low: 18, ci_high: 44 },
      monitoring: { n: 300, n_censored: 5, recur_60d_pct: 20, ci_low: 15.5, ci_high: 25 } },
    contrast: { a: "citation", b: "monitoring", diff_pp: 10, ci_pp: [-2, 22] },
  } };
  const finding = toFinding(row);
  assert.deepEqual(finding.actionSamples.map((s) => [s.tag, s.n, s.censored, s.ratePct, s.intervalPct]), [
    ["monitoring", 300, 5, 20, [15.5, 25]], ["citation", 50, 2, 30, [18, 44]],
  ]);
  assert.match(finding.statText!, /Unadjusted: Citation − Monitoring = 10 percentage points/);
  assert.match(finding.statText!, /95% CI -2 to 22 percentage points/);
});

test("analytics handoff: fiscal-year department payments are not dropped", () => {
  const impact = toImpact(pipelinePestCost);
  assert.deepEqual(impact.tables.find((t) => t.name === "Departments · FY2025"), {
    name: "Departments · FY2025", columns: ["Department", "Amount"], rows: [["X", "$1,001"]],
  });
  assert.equal(impact.tables.filter((t) => t.name.startsWith("Departments")).length, 1);
});

test("analytics handoff: malformed action and department breakdowns degrade safely", () => {
  const finding = toFinding({ ...pipelineWhatWorkedRow, stat: { by_tag: {
    bad: null, missing_n: {}, negative_n: { n: -1 }, valid: { n: 10 },
  } } });
  assert.equal(finding.actionSamples.length, 1);
  assert.deepEqual(finding.actionSamples[0], { tag: "valid", label: "Valid", n: 10, censored: null, ratePct: null, intervalPct: null });
  const impact = toImpact({ ...pipelinePestCost, value: { currency: "USD", by_fiscal_year: [
    { fiscal_year: 2025, amount: 1, departments: [null, {}, { department: "Good", amount: 0 }] },
    { fiscal_year: 2026, amount: 2, departments: "bad" },
  ] } });
  assert.deepEqual(impact.tables.find((t) => t.name === "Departments · FY2025")?.rows, [["Good", "$0"]]);
});
