import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import FindingCard from "../FindingCard";
import FindingChart from "../FindingChart";
import ForecastSummary from "../ForecastSummary";
import InsightsView from "../InsightsView";
import { parseChart, toFinding, toForecast, toInsightsData } from "../parse";
import type { InsightsState } from "../types";
import { badChartRow, barRow, baselineRun, fullPayload, lineRow, modelRun, nullRow, scatterRow } from "./fixtures";

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;
const chartOf = (row: { chart: unknown }) => parseChart(row.chart).chart!;

// Every aria-labelledby id must resolve to an element in the same markup, and ids must be unique.
function assertA11yRefs(html: string) {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids}`);
  for (const m of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
    for (const ref of m[1].split(" ")) assert.ok(ids.includes(ref), `missing id ${ref}`);
  }
}

test("scatter renders one circle per point inside an accessible svg", () => {
  const html = renderToStaticMarkup(<FindingChart spec={chartOf(scatterRow)} id="t" />);
  assert.match(html, /data-chart-type="scatter"/);
  assert.match(html, /role="img"/);
  assert.match(html, /<desc id="t-chart-desc">Scatter plot with 1 series \(cells\), 4 points; x: Improper storage/);
  assert.equal(count(html, /<circle/g), 4);
  assert.doesNotMatch(html, /aria-label="Legend"/); // single series: title names it, no legend
  assertA11yRefs(html);
});

test("bar renders one rect per category with a data table", () => {
  const html = renderToStaticMarkup(<FindingChart spec={chartOf(barRow)} id="b" />);
  assert.equal(count(html, /<rect/g), 3);
  assert.match(html, />no action</);
  assert.match(html, /<th scope="col"[^>]*>Repeat rate<\/th>/);
  assert.equal(count(html, /<tr>/g), 1 + 3);
});

test("line renders a polyline and date ticks", () => {
  const html = renderToStaticMarkup(<FindingChart spec={chartOf(lineRow)} id="l" />);
  assert.equal(count(html, /<polyline/g), 1);
  assert.match(html, />2025-01</);
  assert.doesNotMatch(html, /NaN/);
});

test("event_study renders both series, a legend and the day-0 marker", () => {
  const html = renderToStaticMarkup(<FindingChart spec={chartOf(nullRow)} id="e" />);
  assert.equal(count(html, /<polyline/g), 2);
  assert.match(html, /data-mark="event-zero"/);
  assert.match(html, /aria-label="Legend"/);
  assert.match(html, />near<\/li>/);
  assert.match(html, />control<\/li>/);
});

test("charts never emit NaN coordinates, even for flat or single-point data", () => {
  const flat = parseChart({ type: "line", series: [{ name: "a", points: [[1, 5], [2, 5]] }] }).chart!;
  const one = parseChart({ type: "scatter", series: [{ name: "a", points: [[3, 3]] }] }).chart!;
  const neg = parseChart({ type: "bar", series: [{ name: "a", points: [["x", -2], ["y", 3]] }] }).chart!;
  for (const spec of [flat, one, neg]) {
    const html = renderToStaticMarkup(<FindingChart spec={spec} id="z" />);
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
});

test("finding card shows question, result, method, sample, caveat, source and date", () => {
  const html = renderToStaticMarkup(<FindingCard finding={toFinding(scatterRow)} />);
  for (const s of ["Fixture question A?", "ρ = 0.41", "Spearman over 250 m cells, 2025", "n = 1,234 (250 m cells)",
    "Fixture caveat A.", "src-a", "Moderate association", 'dateTime="2026-10-24T19:00:00Z"', "Oct 24, 2026"]) {
    assert.ok(html.includes(s), `missing: ${s}`);
  }
  assertA11yRefs(html);
});

test("null result card is as complete as a positive one", () => {
  const pos = renderToStaticMarkup(<FindingCard finding={toFinding(scatterRow)} />);
  const nul = renderToStaticMarkup(<FindingCard finding={toFinding(nullRow)} />);
  assert.match(nul, /No association found/);
  assert.match(nul, /Fixture caveat B\./);
  assert.match(nul, /Source not recorded/);
  assert.match(nul, /near: 1\.2 → 1\.19/);
  for (const html of [pos, nul]) {
    assert.equal(count(html, /<dt/g), 4);
    assert.equal(count(html, /role="img"/g), 1);
  }
});

test("unsupported chart and missing stat degrade the card, not the panel", () => {
  const html = renderToStaticMarkup(<FindingCard finding={toFinding(badChartRow)} />);
  assert.match(html, /Chart unavailable: Chart type &quot;pie&quot; is not supported\./);
  assert.match(html, /Statistic not reported/);
  assert.match(html, /Strength not labelled/);
  assert.doesNotMatch(html, /<svg/);
});

test("forecast summary compares model to baseline explicitly", () => {
  const html = renderToStaticMarkup(<ForecastSummary forecast={toForecast(fullPayload.forecast)!} />);
  assert.match(html, /Backtested model \(cell_week_poisson_gbm\)/);
  assert.match(html, /over the last 26 weeks/);
  // MAE 0.41 < 0.47: better. Top-10% 38% < 42%: worse, and said so.
  assert.match(html, /data-score="MAE"[\s\S]*?data-verdict="better">Better than baseline/);
  assert.match(html, /data-score="Top-10% capture"[\s\S]*?data-verdict="worse">Worse than baseline/);
  assert.match(html, />38%</);
  assert.match(html, />42%</);
  assert.match(html, /Expected 311 rodent <em>reports<\/em> citywide/);
  assert.match(html, /Per 250 m cell, not a count of rats/);
  assert.match(html, />3\.2<\/span>/);
  assert.match(html, /Fixtureville/);
  assert.match(html, /Drivers: Trash storage reports \(\+0\.8\)/);
  assert.match(html, /Week of Oct 26, 2026[\s\S]*Week of Nov 2, 2026/);
  assert.match(html, /aria-pressed="true"[^>]*aria-label="Week of Oct 26, 2026"/);
  assert.match(html, />56 of 900</);
  assert.match(html, /−4 pts/);
  // "rats" only appears in the disclaimer.
  assert.equal(count(html, /\brats?\b/gi), 1);
});

test("forecast summary for a baseline-only run and a run missing baseline scores", () => {
  const base = renderToStaticMarkup(<ForecastSummary forecast={toForecast({ run: baselineRun, weeks: [], top_cells: [] })!} />);
  assert.match(base, /data-model-kind="baseline"/);
  assert.match(base, /Baseline: mean of the last 4 weeks/);
  assert.match(base, /Baseline only/);
  assert.match(base, /trained model is not available yet/);
  assert.match(base, /No future weeks have been scored/);

  const run = { ...modelRun, metrics: { mae: 0.4 } };
  const noBase = renderToStaticMarkup(<ForecastSummary forecast={toForecast({ run, weeks: [], top_cells: [] })!} />);
  assert.match(noBase, /No comparison available/);
  assert.match(noBase, /baseline was not scored for this run/);
  assert.match(noBase, /window not reported/);
});

const render = (state: InsightsState, onRetry?: () => void) => renderToStaticMarkup(<InsightsView state={state} onRetry={onRetry} />);

test("loading state is announced", () => {
  const html = render({ status: "loading" });
  assert.match(html, /role="status"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /Loading findings/);
});

test("error state is an alert with a retry button", () => {
  const html = render({ status: "error", message: "statement timeout" }, () => {});
  assert.match(html, /role="alert"/);
  assert.match(html, /statement timeout/);
  assert.match(html, /<button type="button"[^>]*>Retry<\/button>/);
  assert.doesNotMatch(render({ status: "error", message: "x" }), /<button/);
});

test("unavailable state explains why", () => {
  const html = render({ status: "unavailable", reason: "The insights read endpoint (insights_summary) is not deployed yet." }, () => {});
  assert.match(html, /Results not available yet/);
  assert.match(html, /insights_summary/);
  assert.match(html, />Check again</);
});

test("ready state renders all sections, a caveat next to every price figure, valid aria refs", () => {
  const data = toInsightsData(fullPayload);
  const html = render({ status: "ready", data });
  assert.match(html, /data-state="ready"/);
  assert.equal(count(html, /data-finding=/g), 4);
  assert.equal(count(html, /role="img"/g), 4);
  assert.match(html, /data-impact="cost-pest-control" data-kind="cost"/);
  assert.match(html, /data-impact="fx-assessed" data-kind="exploratory"/);
  assert.match(html, /\$1,000/);
  assert.match(html, /do not show that rodents lower property values/);
  // each impact card carries its own caveat
  for (const id of ["cost-pest-control", "fx-assessed"]) {
    const card = html.split(`data-impact="${id}"`)[1].split("</article>")[0];
    assert.match(card, /Caveat: <\/span>Fixture (cost|price) caveat\./);
  }
  assertA11yRefs(html);
});

test("ready state with partial data shows per-section empty states", () => {
  const html = render({ status: "ready", data: toInsightsData({ correlations: [nullRow], price_impact: [], forecast: null }) });
  assert.match(html, /No forecast run has been written yet/);
  assert.match(html, /No counted costs have been computed yet/);
  assert.match(html, /No price comparisons have been computed yet/);
  assert.equal(count(html, /data-finding=/g), 1);
  const noFindings = render({ status: "ready", data: toInsightsData({ ...fullPayload, correlations: [] }) });
  assert.match(noFindings, /No findings have been computed yet/);
});

test("fixtures are imported by tests only", () => {
  const dir = join(__dirname, "..");
  for (const f of readdirSync(dir)) {
    if (!/\.tsx?$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(join(dir, f), "utf8"), /fixtures/, `${f} imports fixtures`);
  }
});

import { pipelinePestCost, pipelineWhatWorkedRow } from "./fixtures";
import { toImpact } from "../parse";
import PriceImpact from "../PriceImpact";

test("CI bounds render as error bars, not as extra bars, and appear in the table", () => {
  const html = renderToStaticMarkup(<FindingCard finding={toFinding(pipelineWhatWorkedRow)} />);
  assert.equal(count(html, /<rect/g), 2);
  assert.match(html, /data-mark="ci"/);
  assert.match(html, /with 95% confidence intervals/);
  assert.match(html, /<td>15\.5 to 25<\/td>/);
  assert.doesNotMatch(html, /aria-label="Legend"/);
  assert.match(html, /More statistics/);
});

test("pest payments render as a table with the caveat beside it", () => {
  const html = renderToStaticMarkup(<PriceImpact costs={[toImpact(pipelinePestCost)]} exploratory={[]} />);
  assert.match(html, /<caption[^>]*>By fiscal year<\/caption>/);
  assert.match(html, /\$2,000/);
  assert.doesNotMatch(html, /Value not reported/);
  assert.match(html, /Fixture cost caveat\./);
});

test("long axis titles are shortened in the plot but kept whole in the description", () => {
  const spec = parseChart({ type: "line", y_label: "Reports / median of the 8 weeks before the event", series: [{ name: "a", points: [[0, 1], [1, 2]] }] }).chart!;
  const html = renderToStaticMarkup(<FindingChart spec={spec} id="y" />);
  assert.match(html, /Reports \/ median of the 8 weeks…<\/text>/);
  assert.match(html, /y: Reports \/ median of the 8 weeks before the event/);
});


test("real baseline metric field names render both scores, never n/a", () => {
  const run = { ...baselineRun, model: "cell_week_baseline_mean4",
    metrics: { backtest_weeks: 26, mae: 0.07132, top10pct_capture: 0.5433 } };
  const html = renderToStaticMarkup(<ForecastSummary forecast={toForecast({ run, weeks: [], top_cells: [] })!} />);
  assert.match(html, />0\.071</);
  assert.match(html, />54\.3%</);
  assert.doesNotMatch(html, /n\/a|Better than baseline|Worse than baseline/);
});


import { pipelineInsufficientRow } from "./fixtures";

test("insufficient data never receives a no-association badge", () => {
  const html = renderToStaticMarkup(<FindingCard finding={toFinding(pipelineInsufficientRow)} />);
  assert.match(html, /data-strength="insufficient"/);
  assert.match(html, />Insufficient data</);
  assert.doesNotMatch(html, /No association found/);
});

test("action sample sizes, censoring, rates and intervals are available together", () => {
  const html = renderToStaticMarkup(<FindingCard finding={toFinding(pipelineWhatWorkedRow)} />);
  assert.match(html, /Action samples and uncertainty/);
  assert.match(html, /Excluded: follow-up incomplete/);
  assert.match(html, /data-action="baited"[\s\S]*?>300<[\s\S]*?>5<[\s\S]*?>20%<[\s\S]*?>15\.5% to 25%</);
  assert.match(html, /data-action="cited"[\s\S]*?>50<[\s\S]*?>1<[\s\S]*?>30%</);
  const precise = renderToStaticMarkup(<FindingCard finding={toFinding({ ...pipelineWhatWorkedRow,
    stat: { by_tag: { citation: { n: 50, n_censored: 1, recur_60d_pct: 11.19, ci_low: 9.02, ci_high: 13.81 } } },
  })} />);
  assert.match(precise, />11\.19%</);
  assert.match(precise, />9\.02% to 13\.81%</);
  assertA11yRefs(html);
});

test("department spending is shown under its fiscal year with the cost caveat", () => {
  const html = renderToStaticMarkup(<PriceImpact costs={[toImpact(pipelinePestCost)]} exploratory={[]} />);
  assert.match(html, /Departments · FY2025/);
  assert.match(html, />X</);
  assert.match(html, /Fixture cost caveat/);
});

import { loadInsights } from "../load";
import { costRow } from "./fixtures";

test("source metadata survives the RPC schema and renders linked names and retrieval dates on every cited card", async () => {
  const payload = { ...fullPayload,
    correlations: [{ ...scatterRow, source_ids: ["fixture-source", "missing-source"] }],
    price_impact: [{ ...costRow, source_ids: ["fixture-source"] }],
    sources: [{ id: "fixture-source", name: "Fixture source name", url: "https://example.org/dataset", retrieved_at: "2026-10-23T18:30:00Z" }],
  };
  const state = await loadInsights(async () => ({ data: payload, error: null }));
  assert.equal(state.status, "ready");
  const html = render(state);
  assert.equal(count(html, /href="https:\/\/example.org\/dataset"/g), 2);
  assert.equal(count(html, />Fixture source name<\/a>/g), 2);
  assert.equal(count(html, /dateTime="2026-10-23T18:30:00Z"/g), 2);
  assert.match(html, /missing-source/);
  assert.match(html, /Source details unavailable/);
  assertA11yRefs(html);
});

test("missing source metadata is explicit; unsafe source URLs never become links", async () => {
  for (const url of ["javascript:alert(1)", "data:text/html,unsafe", "//example.org", "file:///tmp/source"]) {
    const state = await loadInsights(async () => ({ data: { ...fullPayload,
      correlations: [{ ...scatterRow, source_ids: ["src-a"] }], price_impact: [],
      sources: [{ id: "src-a", name: "Unsafe-link source", url, retrieved_at: "2026-10-23T18:30:00Z" }],
    }, error: null }));
    assert.equal(state.status, "ready");
    const html = render(state);
    assert.match(html, /Unsafe-link source/);
    assert.doesNotMatch(html, /href=/);
    assert.match(html, /Source link unavailable/);
  }
  const legacy = render({ status: "ready", data: toInsightsData(fullPayload) });
  assert.match(legacy, /Source details unavailable/);
});

test("invalid date-like chart labels fall back to categories without NaN coordinates", () => {
  const chart = parseChart({ type: "line", series: [{ points: [["2026-99-99", 2], ["2026-98-98", 3]] }] }).chart!;
  const html = renderToStaticMarkup(<FindingChart spec={chart} id="bad-date" />);
  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.match(html, /2026-99-99/);
});
