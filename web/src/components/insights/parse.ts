// Adapters: raw rows (SQL contract, jsonb as unknown) -> view models. Defensive by design:
// a malformed jsonb payload degrades one card, never the panel.

import { fmtNumber, fmtP, fmtPct, fmtUsd, humanize } from "./format";
import type {
  ChartSeries, ChartSpec, ChartType, CorrelationRow, Finding, ForecastView, ImpactItem,
  InsightsData, InsightsPayload, ModelRunRow, PriceImpactRow, RiskBand, SourceRow, Strength,
} from "./types";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);

const STRENGTHS: Strength[] = ["strong", "moderate", "weak", "none"];
const CHART_TYPES: ChartType[] = ["scatter", "bar", "line", "event_study"];
const BANDS: RiskBand[] = ["low", "elevated", "high", "very_high"];

// ---- correlations ----

// Keys already shown elsewhere on the card, or internal to the computation.
const STAT_SKIP = new Set(["strength", "n_perm", "points"]);

// n, or the sum of per-group n (what-worked writes {by_tag: {tag: {n, ...}}}).
function sampleSize(stat: Obj): number | null {
  const n = num(stat.n);
  if (n !== null) return n;
  for (const v of Object.values(stat)) {
    if (!isObj(v)) continue;
    const ns = Object.values(v).map((g) => (isObj(g) ? num(g.n) : null));
    if (ns.length && ns.every((x) => x !== null)) return (ns as number[]).reduce((a, b) => a + b, 0);
  }
  return null;
}

export function parseStat(stat: unknown): { statText: string | null; n: number | null; more: [string, string][] } {
  if (!isObj(stat)) return { statText: null, n: null, more: [] };
  const n = sampleSize(stat);
  const parts: string[] = [];
  const used = new Set(["n", ...STAT_SKIP]);
  if (stat.insufficient === true) { parts.push("Not enough data to test"); used.add("insufficient"); }
  const rho = num(stat.rho);
  if (rho !== null) { parts.push(`ρ = ${rho.toFixed(2)}`); used.add("rho"); }
  const rhoPartial = num(stat.rho_partial);
  if (rhoPartial !== null) { parts.push(`partial ρ = ${rhoPartial.toFixed(2)}`); used.add("rho_partial"); }
  const lift = num(stat.lift);
  if (lift !== null) { parts.push(`lift = ${fmtNumber(lift)}`); used.add("lift"); }
  if (Array.isArray(stat.ci) && stat.ci.length === 2) {
    const [lo, hi] = stat.ci.map(num);
    if (lo !== null && hi !== null) parts.push(`95% CI ${fmtNumber(lo)} to ${fmtNumber(hi)}`);
    used.add("ci");
  }
  const before = num(stat.before), after = num(stat.after);
  if (before !== null && after !== null) {
    parts.push(`near: ${fmtNumber(before)} → ${fmtNumber(after)}`);
    used.add("before"); used.add("after");
    const cb = num(stat.control_before), ca = num(stat.control_after);
    if (cb !== null && ca !== null) {
      parts.push(`control: ${fmtNumber(cb)} → ${fmtNumber(ca)}`);
      used.add("control_before"); used.add("control_after");
    }
  }
  for (const [key, label] of [["p", "p"], ["p_perm", "permutation p"]] as const) {
    const p = num(stat[key]);
    if (p !== null) { parts.push(`${label} ${p < 0.001 ? "" : "= "}${fmtP(p)}`); used.add(key); }
  }
  // Analytics' contrast is an unadjusted difference, in percentage points, not a
  // matched estimate or a causal treatment effect. Preserve its supplied interval.
  const contrast = isObj(stat.contrast) ? stat.contrast : null;
  if (contrast && str(contrast.a) && str(contrast.b) && num(contrast.diff_pp) !== null) {
    parts.push(`Unadjusted: ${humanize(contrast.a as string)} − ${humanize(contrast.b as string)} = ${fmtNumber(contrast.diff_pp as number)} percentage points`);
    if (Array.isArray(contrast.ci_pp) && contrast.ci_pp.length === 2) {
      const [lo, hi] = contrast.ci_pp.map(num);
      if (lo !== null && hi !== null && lo <= hi) parts.push(`95% CI ${fmtNumber(lo)} to ${fmtNumber(hi)} percentage points`);
    }
  }
  // Anything else the analytics track adds is listed rather than dropped. Nested values
  // (per-year, per-tag breakdowns) are left to the chart.
  const more: [string, string][] = [];
  const fmtStat = (k: string, x: number) => (/year/i.test(k) && Number.isInteger(x) ? String(x) : fmtNumber(x));
  for (const [k, v] of Object.entries(stat)) {
    if (used.has(k)) continue;
    const x = num(v);
    if (x !== null) more.push([humanize(k), fmtStat(k, x)]);
    else if (typeof v === "string" || typeof v === "boolean") more.push([humanize(k), String(v === true ? "yes" : v === false ? "no" : v)]);
    else if (Array.isArray(v) && v.length && v.every((y) => typeof y === "string" || num(y) !== null)) {
      more.push([humanize(k), v.map((y) => (typeof y === "number" ? fmtStat(k, y) : y)).join(", ")]);
    }
  }
  return { statText: parts.length ? parts.join(" · ") : null, n, more };
}

export function parseChart(chart: unknown): { chart: ChartSpec | null; problem: string | null } {
  if (!isObj(chart)) return { chart: null, problem: "No chart payload." };
  const type = chart.type;
  if (typeof type !== "string" || !CHART_TYPES.includes(type as ChartType)) {
    return { chart: null, problem: `Chart type "${String(type)}" is not supported.` };
  }
  const series: ChartSeries[] = [];
  if (Array.isArray(chart.series)) {
    chart.series.forEach((s, i) => {
      if (!isObj(s) || !Array.isArray(s.points)) return;
      const points: [number | string, number][] = [];
      for (const p of s.points) {
        if (!Array.isArray(p) || p.length < 2) continue;
        const [x, y] = p;
        const yy = num(y);
        if (yy === null) continue;
        if (num(x) !== null || str(x) !== null) points.push([x as number | string, yy]);
      }
      if (points.length) series.push({ name: str(s.name) ?? `Series ${i + 1}`, points });
    });
  }
  if (!series.length) return { chart: null, problem: "The chart has no data points." };
  // Confidence bounds are not data series of their own: drawing them as bars would read as
  // two more categories. Pull them out and draw them as error bars instead.
  const lo = series.find((s) => /\bci\s*low\b/i.test(s.name));
  const hi = series.find((s) => /\bci\s*high\b/i.test(s.name));
  const main = lo && hi ? series.filter((s) => s !== lo && s !== hi) : series;
  return {
    chart: {
      type: type as ChartType,
      xLabel: str(chart.x_label) ?? "",
      yLabel: str(chart.y_label) ?? "",
      series: main.length ? main : series,
      ...(lo && hi && main.length ? { ci: { lo, hi } } : {}),
    },
    problem: null,
  };
}

function actionSamples(stat: unknown): Finding["actionSamples"] {
  if (!isObj(stat) || !isObj(stat.by_tag)) return [];
  const count = (v: unknown) => { const n = num(v); return n !== null && Number.isInteger(n) && n >= 0 ? n : null; };
  const percent = (v: unknown) => { const n = num(v); return n !== null && n >= 0 && n <= 100 ? n : null; };
  const samples: Finding["actionSamples"] = [];
  for (const [tag, row] of Object.entries(stat.by_tag)) {
    if (!isObj(row)) continue;
    const n = count(row.n);
    if (n === null) continue;
    const lo = percent(row.ci_low), hi = percent(row.ci_high);
    samples.push({ tag, label: humanize(tag), n, censored: count(row.n_censored),
      ratePct: percent(row.recur_60d_pct), intervalPct: lo !== null && hi !== null && lo <= hi ? [lo, hi] : null });
  }
  return samples.sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
}

export function toFinding(row: CorrelationRow, sources: SourceRow[] = []): Finding {
  const { statText, n, more } = parseStat(row.stat);
  const { chart, problem } = parseChart(row.chart);
  const strength = STRENGTHS.includes(row.strength as Strength) ? (row.strength as Strength) : null;
  return {
    id: row.id,
    title: row.title,
    question: row.question,
    method: row.method,
    unit: row.unit,
    statText,
    moreStats: more,
    insufficient: isObj(row.stat) && row.stat.insufficient === true,
    actionSamples: actionSamples(row.stat),
    sampleText: n !== null ? `n = ${fmtNumber(n)}${row.unit ? ` (${row.unit})` : ""}` : null,
    strength,
    chart,
    chartProblem: problem,
    caveat: row.caveat,
    group: row.group_name,
    sources: row.source_ids ?? [],
    sourceDetails: sources.filter((s) => row.source_ids?.includes(s.id)),
    computedAt: row.computed_at,
  };
}

// ---- forecast ----

export function isBaselineRun(run: ModelRunRow): boolean {
  const params = isObj(run.params) ? run.params : {};
  return /baseline/i.test(run.model) || params.baseline === true || params.kind === "baseline";
}

function driverText(d: unknown): string | null {
  if (!isObj(d)) return null;
  const label = str(d.label) ?? str(d.feature);
  if (!label) return null;
  const c = num(d.contribution);
  return c === null ? label : `${label} (${c >= 0 ? "+" : "−"}${fmtNumber(Math.abs(c))})`;
}

export function toForecast(f: InsightsPayload["forecast"]): ForecastView | null {
  if (!f || !f.run) return null;
  const run = f.run;
  const m = isObj(run.metrics) ? run.metrics : {};
  const isBaseline = isBaselineRun(run);
  const features = (Array.isArray(run.feature_importance) ? run.feature_importance : [])
    .filter(isObj)
    .map((x) => ({ label: str(x.label) ?? str(x.feature) ?? "?", importance: num(x.importance) ?? NaN }))
    .filter((x) => Number.isFinite(x.importance))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5);
  const weeks = (f.weeks ?? [])
    .filter((w) => str(w.week_start) && num(w.expected_total) !== null)
    .sort((a, b) => a.week_start.localeCompare(b.week_start));
  const topCells = (f.top_cells ?? []).map((c) => ({
    cellId: c.cell_id,
    weekStart: c.week_start,
    expected: c.expected,
    pAny: c.p_any,
    band: BANDS.includes(c.risk_band as RiskBand) ? (c.risk_band as RiskBand) : null,
    neighborhood: c.neighborhood,
    drivers: (Array.isArray(c.drivers) ? c.drivers : []).map(driverText).filter((s): s is string => !!s).slice(0, 3),
  }));
  return {
    runId: run.id,
    model: run.model,
    isBaseline,
    trainedThrough: run.trained_through,
    createdAt: run.created_at,
    backtestWeeks: num(m.backtest_weeks),
    // A baseline run stores its own scores in mae/top10pct_capture, just like a model.
    // Keep the explicit baseline_* convention for older RPC payloads.
    mae: { model: isBaseline ? null : num(m.mae), baseline: isBaseline ? num(m.mae) ?? num(m.baseline_mae) : num(m.baseline_mae) },
    top10: { model: isBaseline ? null : num(m.top10pct_capture), baseline: isBaseline ? num(m.top10pct_capture) ?? num(m.baseline_top10pct_capture) : num(m.baseline_top10pct_capture) },
    features,
    weeks,
    topCells,
  };
}

// ---- price & cost ----

// Only these keys become the big headline number; everything else is a labelled detail.
const HEADLINE_KEYS = ["usd", "amount_usd", "total_usd", "amount", "count", "diff", "difference", "diff_pct", "value", "rho"];
const SKIP_KEYS = new Set(["kind", "currency"]);

const DETAIL_LABEL: Record<string, string> = { ci: "95% CI", n: "Sample size", p: "p-value" };

function fmtValue(key: string, v: unknown, usd = false): string | null {
  const x = num(v);
  if (x !== null) {
    if (/(^|_)usd$/.test(key) || key === "usd" || (usd && /(^|_)amount$/.test(key))) return fmtUsd(x);
    if (/(_pct|percent)$/.test(key)) return `${fmtNumber(x)}%`;
    if (/(^|_)share$/.test(key)) return fmtPct(x);
    if (key === "p") return fmtP(x);
    if (/year/i.test(key) && Number.isInteger(x)) return String(x);
    return fmtNumber(x);
  }
  if (Array.isArray(v) && v.length === 2 && v.every((y) => num(y) !== null)) {
    return `${fmtValue(key, v[0], usd)} to ${fmtValue(key, v[1], usd)}`;
  }
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "yes" : "no";
  return null;
}

export function toImpact(row: PriceImpactRow, sources: SourceRow[] = []): ImpactItem {
  const v = row.value;
  const obj = isObj(v) ? v : null;
  const kind: ImpactItem["kind"] =
    obj?.kind === "cost" || /^cost/.test(row.id) || /^cost/.test(row.metric) ? "cost" : "exploratory";
  let headline: string | null = null;
  let headlineLabel: string | null = null;
  const details: [string, string][] = [];
  const tables: ImpactItem["tables"] = [];
  if (obj) {
    const usd = obj.currency === "USD";
    const label = (k: string) => DETAIL_LABEL[k] ?? humanize(k);
    const hk = HEADLINE_KEYS.find((k) => k in obj && fmtValue(k, obj[k], usd) !== null);
    if (hk) { headline = fmtValue(hk, obj[hk], usd); headlineLabel = label(hk); }
    for (const [k, x] of Object.entries(obj)) {
      if (k === hk || SKIP_KEYS.has(k)) continue;
      const s = fmtValue(k, x, usd);
      if (s !== null) { details.push([label(k), s]); continue; }
      if (isObj(x)) {
        // One level of nesting, e.g. since_2024: {businesses, violations}.
        for (const [k2, x2] of Object.entries(x)) {
          const s2 = fmtValue(k2, x2, usd);
          if (s2 !== null) details.push([`${label(k)} · ${label(k2).toLowerCase()}`, s2]);
        }
      } else if (Array.isArray(x) && x.length && x.every(isObj)) {
        // Lists of records, e.g. by_fiscal_year: [{fiscal_year, amount, n_payments}].
        const cols = Object.keys(x[0]).filter((c) => fmtValue(c, (x[0] as Obj)[c], usd) !== null);
        if (cols.length) {
          tables.push({
            name: label(k),
            columns: cols.map(label),
            rows: (x as Obj[]).map((r) => cols.map((c) => fmtValue(c, r[c], usd) ?? "—")),
          });
        }
        if (k === "by_fiscal_year") {
          for (const year of x) {
            if (!Number.isInteger(year.fiscal_year) || !Array.isArray(year.departments)) continue;
            const rows = year.departments.filter(isObj)
              .filter((d) => str(d.department) !== null && num(d.amount) !== null)
              .map((d) => [d.department as string, fmtValue("amount", d.amount, usd)!]);
            if (rows.length) tables.push({ name: `Departments · FY${year.fiscal_year}`, columns: ["Department", "Amount"], rows });
          }
        }
      }
    }
  } else {
    headline = fmtValue(row.metric, v);
    headlineLabel = humanize(row.metric);
  }
  return {
    id: row.id,
    title: row.title,
    kind,
    scope: row.scope,
    scopeId: row.scope_id,
    metric: row.metric,
    headline,
    headlineLabel,
    details,
    tables,
    caveat: row.caveat,
    sources: row.source_ids ?? [],
    sourceDetails: sources.filter((s) => row.source_ids?.includes(s.id)),
    computedAt: row.computed_at,
  };
}

// ---- whole payload ----

export function toInsightsData(p: InsightsPayload): InsightsData {
  const findings = (p.correlations ?? [])
    .slice()
    .sort((a, b) => (a.sort ?? 100) - (b.sort ?? 100) || a.id.localeCompare(b.id))
    .map((row) => toFinding(row, p.sources ?? []));
  const impacts = (p.price_impact ?? []).map((row) => toImpact(row, p.sources ?? []));
  return {
    findings,
    forecast: toForecast(p.forecast),
    costs: impacts.filter((i) => i.kind === "cost"),
    exploratory: impacts.filter((i) => i.kind === "exploratory"),
  };
}

export function isEmpty(d: InsightsData): boolean {
  return !d.findings.length && !d.forecast && !d.costs.length && !d.exploratory.length;
}
