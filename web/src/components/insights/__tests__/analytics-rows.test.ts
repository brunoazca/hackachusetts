// Real persisted analytics rows exported with SELECT; no fixtures, RPC call or writes.
// INSIGHTS_ANALYTICS_ROWS points to the local JSON export documented in README.md.
// This validates adaptation/SSR only; it does not certify a deployed RPC or rerun A.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FindingCard from "../FindingCard";
import PriceImpact from "../PriceImpact";
import { toInsightsData } from "../parse";
import { insightsPayloadSchema } from "../payload";
import type { InsightsData, InsightsPayload } from "../types";

const path = process.env.INSIGHTS_ANALYTICS_ROWS;
const options = { skip: !path && "INSIGHTS_ANALYTICS_ROWS not supplied; no real export loaded" };
let payload: InsightsPayload;
let data: InsightsData;
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]!);
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

before(() => {
  if (!path) return;
  payload = insightsPayloadSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  assert.ok(payload.correlations?.length, "Export has no real findings");
  assert.ok(payload.price_impact?.length, "Export has no real costs");
  data = toInsightsData(payload);
});

test("real analytics export: every finding retains its title, method, caveat, sources, date and chart", options, () => {
  assert.equal(data.findings.length, payload.correlations!.length);
  for (const row of payload.correlations!) {
    const finding = data.findings.find((f) => f.id === row.id)!;
    assert.ok(finding, row.id);
    assert.equal(finding.title, row.title);
    assert.equal(finding.method, row.method);
    assert.equal(finding.caveat, row.caveat);
    assert.deepEqual(finding.sources, row.source_ids ?? []);
    assert.equal(finding.computedAt, row.computed_at);
    assert.ok(finding.chart, `${row.id}: chart lost`);
    const html = renderToStaticMarkup(createElement(FindingCard, { finding }));
    for (const text of [row.title, row.method, row.caveat, row.computed_at, ...(row.source_ids ?? [])]) {
      assert.ok(html.includes(escape(text)), `${row.id}: source text missing from SSR`);
    }
  }
});

test("real analytics export: all action denominators, censoring, rates and intervals survive", options, () => {
  const row = payload.correlations!.find((r) => r.id === "what-worked")!;
  assert.ok(row, "what-worked missing from real export");
  const stat = row.stat as { by_tag: Record<string, { n: number; n_censored: number; recur_60d_pct: number; ci_low: number; ci_high: number }>; contrast?: { diff_pp: number; ci_pp: number[] }; unadjusted_contrast?: { diff_pp: number; ci_pp: number[] }; matched?: { risk_ratio: number | null; ci_95: number[] | null; n_pairs: number } };
  const finding = data.findings.find((f) => f.id === row.id)!;
  assert.equal(finding.actionSamples.length, Object.keys(stat.by_tag).length);
  for (const [tag, raw] of Object.entries(stat.by_tag)) {
    const sample = finding.actionSamples.find((s) => s.tag === tag)!;
    assert.ok(sample, `${tag}: action lost`);
    assert.equal(sample.n, raw.n);
    assert.equal(sample.censored, raw.n_censored);
    assert.equal(sample.ratePct, raw.recur_60d_pct);
    assert.deepEqual(sample.intervalPct, [raw.ci_low, raw.ci_high]);
  }
  assert.ok(finding.chart?.ci, "Confidence bounds must remain error bars");
  const contrast = stat.unadjusted_contrast ?? stat.contrast;
  if (contrast) {
    assert.match(finding.statText!, /Unadjusted:/);
    for (const value of [contrast.diff_pp, ...contrast.ci_pp]) {
      assert.ok(finding.statText!.includes(String(value)), "Raw contrast/interval missing");
    }
  }
  if (stat.matched) {
    assert.match(finding.statText!, /Matched:/);
    assert.ok(finding.sampleText?.includes(`${stat.matched.n_pairs.toLocaleString("en-US")} pairs`));
  }
  const html = renderToStaticMarkup(createElement(FindingCard, { finding }));
  assert.equal((html.match(/data-action="/g) ?? []).length, Object.keys(stat.by_tag).length);
  assert.match(html, /follow-up incomplete/);
});

test("real analytics export: all fiscal years and their department payments render", options, () => {
  const row = payload.price_impact!.find((r) => r.id === "cost-pest-control-payments")!;
  assert.ok(row, "Payments missing from real export");
  const years = (row.value as { by_fiscal_year: { fiscal_year: number; amount: number; departments: { department: string; amount: number }[] }[] }).by_fiscal_year;
  const item = data.costs.find((c) => c.id === row.id)!;
  const html = renderToStaticMarkup(createElement(PriceImpact, { costs: [item], exploratory: [] }));
  for (const year of years) {
    assert.ok(html.includes(usd.format(year.amount)), `FY${year.fiscal_year}: total missing`);
    const table = item.tables.find((t) => t.name === `Departments · FY${year.fiscal_year}`)!;
    assert.ok(table, `FY${year.fiscal_year}: department table missing`);
    assert.equal(table.rows.length, year.departments.length);
    for (const department of year.departments) {
      assert.ok(table.rows.some((r) => r[0] === department.department && r[1] === usd.format(department.amount)), `${department.department}: payment lost`);
      assert.ok(html.includes(escape(department.department)));
      assert.ok(html.includes(usd.format(department.amount)));
    }
  }
});

test("real analytics export: null finding, cost units and lower-bound caveats remain visible", options, () => {
  const nullRow = payload.correlations!.find((r) => r.strength === "none")!;
  assert.ok(nullRow, "Expected the persisted null finding");
  const nullFinding = data.findings.find((f) => f.id === nullRow.id)!;
  assert.match(renderToStaticMarkup(createElement(FindingCard, { finding: nullFinding })), /No association found/);
  assert.equal(data.costs.length + data.exploratory.length, payload.price_impact!.length);
  for (const row of payload.price_impact!) {
    const item = [...data.costs, ...data.exploratory].find((c) => c.id === row.id)!;
    assert.equal(item.title, row.title);
    assert.equal(item.caveat, row.caveat);
    const html = renderToStaticMarkup(createElement(PriceImpact, { costs: [item], exploratory: [] }));
    assert.ok(html.includes(escape(row.caveat)));
    const value = row.value as { units?: string; lower_bound?: boolean };
    if (value.units) assert.ok(html.includes(escape(value.units)));
    if (value.lower_bound === true) assert.ok(item.details.some(([label, v]) => label === "Lower bound" && v === "yes"));
  }
});


test("real analytics export: cited source names, links and retrieval times survive validation and SSR", options, (t) => {
  if (!payload.sources) { t.skip("Export predates source metadata; export again with sources"); return; }
  const ids = [...new Set([...payload.correlations!, ...payload.price_impact!].flatMap((r) => r.source_ids ?? []))];
  assert.ok(ids.length, "Real rows must cite their sources");
  for (const id of ids) assert.ok(payload.sources.some((s) => s.id === id), `${id}: unresolved source`);
  for (const card of [...data.findings, ...data.costs, ...data.exploratory]) {
    const html = "question" in card
      ? renderToStaticMarkup(createElement(FindingCard, { finding: card }))
      : renderToStaticMarkup(createElement(PriceImpact, { costs: [card], exploratory: [] }));
    for (const id of card.sources) {
      const source = payload.sources.find((s) => s.id === id)!;
      assert.ok(html.includes(escape(source.name)), `${id}: name missing`);
      assert.ok(html.includes(`href="${escape(new URL(source.url).href)}"`), `${id}: link missing`);
      assert.ok(html.includes(`dateTime="${escape(source.retrieved_at)}"`), `${id}: retrieval time missing`);
    }
    assert.doesNotMatch(html, /Source details unavailable|Source link unavailable/);
  }
});
