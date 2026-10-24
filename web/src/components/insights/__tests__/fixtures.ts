// TEST FIXTURES ONLY. Synthetic rows shaped like the analysis schema; the numbers are made up
// and must never be imported by app code (checked in panel.test.tsx).

import type { CorrelationRow, InsightsPayload, ModelRunRow, PriceImpactRow } from "../types";

const at = "2026-10-24T19:00:00Z";

export const scatterRow: CorrelationRow = {
  id: "fx-scatter", title: "Fixture scatter finding", question: "Fixture question A?",
  method: "Spearman over 250 m cells, 2025", unit: "250 m cells",
  stat: { rho: 0.41, p: 0.0004, n: 1234 }, strength: "moderate",
  chart: { type: "scatter", x_label: "Improper storage per 100 reports", y_label: "Rodent per 100 reports",
    series: [{ name: "cells", points: [[1, 2], [2, 3.5], [3, 3], [4, 5]] }] },
  caveat: "Fixture caveat A.", group_name: "food", source_ids: ["src-a"], sort: 10, computed_at: at,
};

export const nullRow: CorrelationRow = {
  id: "fx-null", title: "Fixture null finding", question: "Fixture question B?",
  method: "Event study, −90…+90 days vs control points", unit: null,
  stat: { before: 1.2, after: 1.19, control_before: 1.1, control_after: 1.12, n: 88 }, strength: "none",
  chart: { type: "event_study", x_label: "Days from event", y_label: "Reports / week",
    series: [
      { name: "near", points: [[-90, 1.2], [-30, 1.1], [0, 1.2], [30, 1.15], [90, 1.19]] },
      { name: "control", points: [[-90, 1.1], [-30, 1.1], [0, 1.12], [30, 1.1], [90, 1.12]] },
    ] },
  caveat: "Fixture caveat B.", group_name: "displace", source_ids: [], sort: 20, computed_at: at,
};

export const barRow: CorrelationRow = {
  id: "fx-bar", title: "Fixture bar finding", question: "Fixture question C?",
  method: "60-day recurrence by action tag", unit: "closed cases",
  stat: { lift: 0.7, ci: [0.55, 0.9], n: 400 }, strength: "weak",
  chart: { type: "bar", x_label: "Action", y_label: "Repeat rate",
    series: [{ name: "repeat", points: [["baited", 0.4], ["cleaned", 0.3], ["no action", 0.5]] }] },
  caveat: "Fixture caveat C.", group_name: "action", source_ids: ["src-c"], sort: 30, computed_at: at,
};

export const lineRow: CorrelationRow = {
  id: "fx-line", title: "Fixture line finding", question: "Fixture question D?",
  method: "Monthly series vs temperature", unit: "months",
  stat: { rho: 0.87, p: 0.01, n: 36 }, strength: "strong",
  chart: { type: "line", x_label: "Month", y_label: "Reports",
    series: [{ name: "reports", points: [["2025-01-01", 10], ["2025-02-01", 12], ["2025-03-01", 20]] }] },
  caveat: "Fixture caveat D.", group_name: "weather", source_ids: ["src-d"], sort: 40, computed_at: at,
};

export const badChartRow: CorrelationRow = {
  ...scatterRow, id: "fx-bad", title: "Fixture unsupported chart", chart: { type: "pie", series: [] },
  stat: {}, strength: "bogus", sort: 50,
};

export const modelRun: ModelRunRow = {
  id: "fx-run-1", model: "cell_week_poisson_gbm", trained_through: "2026-10-18",
  params: {}, created_at: at,
  metrics: { backtest_weeks: 26, mae: 0.41, baseline_mae: 0.47, top10pct_capture: 0.38, baseline_top10pct_capture: 0.42 },
  feature_importance: [
    { feature: "lag_same_week_ly", label: "Same week last year", importance: 0.3 },
    { feature: "mean_12", label: "Last 12 weeks average", importance: 0.5 },
  ],
};

export const baselineRun: ModelRunRow = {
  ...modelRun, id: "fx-run-baseline", model: "baseline_mean_last_4_weeks",
  metrics: { backtest_weeks: 26, baseline_mae: 0.47, baseline_top10pct_capture: 0.42 }, feature_importance: [],
};

export const costRow: PriceImpactRow = {
  id: "cost-pest-control", title: "Fixture pest-control payments", scope: "city", scope_id: null,
  metric: "payments FY2026", value: { kind: "cost", usd: 1000, vendors: 3 },
  caveat: "Fixture cost caveat.", source_ids: ["src-cost"], computed_at: at,
};

export const priceRow: PriceImpactRow = {
  id: "fx-assessed", title: "Fixture assessed value change", scope: "city", scope_id: null,
  metric: "median % change FY25→FY26", value: { diff_pct: -0.4, ci: [-1.2, 0.5], n: 900 },
  caveat: "Fixture price caveat.", source_ids: ["src-price"], computed_at: at,
};

export const fullPayload: InsightsPayload = {
  correlations: [lineRow, nullRow, scatterRow, barRow],
  price_impact: [costRow, priceRow],
  forecast: {
    run: modelRun,
    weeks: [
      { week_start: "2026-11-02", expected_total: 120.4, cells: 900, bands: { high: 40, very_high: 20 } },
      { week_start: "2026-10-26", expected_total: 118.2, cells: 900, bands: { high: 38, very_high: 18 } },
    ],
    top_cells: [{
      cell_id: "g250_1_1", week_start: "2026-10-26", expected: 3.2, p_any: 0.96, risk_band: "very_high",
      neighborhood: "Fixtureville", drivers: [{ feature: "f", label: "Trash storage reports", contribution: 0.8 }],
    }],
  },
};

// ---- Shapes copied from pipeline/rat_audit/analytics (correlations.py, costs.py, uncommitted
// on feat/rat-audit-analytics-core, read 2026-10-24). Numbers are synthetic. ----

export const pipelineTrashRow: CorrelationRow = {
  id: "trash-storage-vs-rodent", title: "Fixture: trash vs rodent (pipeline shape)",
  question: "Do blocks with improper trash storage get more rodent reports?",
  method: "Partial Spearman over 250 m cells", unit: "250 m grid cell",
  stat: { n: 812, rho_raw: 0.5, rho_partial: 0.31, p_perm: 0.002, rho_rates: 0.2, strength: "moderate", n_perm: 499,
    rodent_total: 4000, trash_total: 9000, ce_rho_partial: 0.12, ce_total: 300, year: 2025 },
  strength: "moderate",
  chart: { type: "scatter", x_label: "Improper-trash reports per 100 311 reports", y_label: "Rodent reports per 100 311 reports",
    series: [{ name: "Cells, 2025", points: [[1.5, 2.25], [3, 4.5], [0.5, 1]] }] },
  caveat: "Fixture caveat.", group_name: "food", source_ids: ["fx-311"], sort: 20, computed_at: at,
};

export const pipelineInsufficientRow: CorrelationRow = {
  ...pipelineTrashRow, id: "fx-insufficient", stat: { n: 4, rho_partial: null, strength: "none", insufficient: true, year: 2025 },
  strength: "none",
};

export const pipelineWhatWorkedRow: CorrelationRow = {
  id: "what-worked", title: "Fixture: what worked (pipeline shape)", question: "Which city actions are followed by fewer repeats?",
  method: "60-day recurrence by closure action tag", unit: "closed rodent case",
  stat: { by_tag: {
      baited: { n: 300, n_recurred: 60, n_censored: 5, recur_60d_pct: 20, ci_low: 15.5, ci_high: 25, median_days_to_next: 30 },
      cited: { n: 50, n_recurred: 15, n_censored: 1, recur_60d_pct: 30, ci_low: 18, ci_high: 44, median_days_to_next: 21 } },
    contrast: { a: "baited", b: "cited" }, observed_through: "2026-10-20" },
  strength: "weak",
  chart: { type: "bar", x_label: "Closure action", y_label: "% followed by a new report within 60 days",
    series: [
      { name: "60-day repeat rate", points: [["Baited", 20], ["Cited", 30]] },
      { name: "95% CI low", points: [["Baited", 15.5], ["Cited", 18]] },
      { name: "95% CI high", points: [["Baited", 25], ["Cited", 44]] },
    ] },
  caveat: "Fixture caveat.", group_name: "action", source_ids: ["fx-311"], sort: 30, computed_at: at,
};

export const pipelineMoveOutRow: CorrelationRow = {
  id: "move-out-spike", title: "Fixture: move-out (pipeline shape)", question: "Is there a Sept 1 spike in student ZIPs?",
  method: "Weekly series", unit: "week x ZIP group",
  stat: { years: [2024, 2025], student_zips: ["02134", "02215"], per_year: { "2025": { trash_student: { ratio: 2.1 } } },
    trash_ratio_min: 1.8, trash_ratio_max: 2.4, trash_student_ratios: [1.8, 2.4], rodent_lag_ratios: [1.0, 0.9], rodent_follows: false },
  strength: "strong",
  chart: { type: "line", x_label: "Weeks from the week of Sept 1", y_label: "Reports / median of the 8 weeks before",
    series: [
      { name: "Rodent reports, student ZIPs", points: [[-2, 1], [0, 1.1], [2, 0.9]] },
      { name: "Trash reports, student ZIPs", points: [[-2, 1], [0, 2.1], [2, 1.2]] },
    ] },
  caveat: "Fixture caveat.", group_name: "reports", source_ids: ["fx-311"], sort: 40, computed_at: at,
};

export const pipelinePestCost: PriceImpactRow = {
  id: "cost-pest-control-payments", title: "Fixture: pest-control payments (pipeline shape)", scope: "city", scope_id: "boston",
  metric: "usd_paid",
  value: { by_fiscal_year: [
      { fiscal_year: 2025, amount: 1000.5, n_payments: 10, departments: [{ department: "X", amount: 1000.5 }] },
      { fiscal_year: 2026, amount: 2000, n_payments: 12, departments: [] } ],
    currency: "USD" },
  caveat: "Fixture cost caveat.", source_ids: ["fx-checkbook"], computed_at: at,
};

export const pipelineCitationsCost: PriceImpactRow = {
  id: "cost-restaurant-rodent-citations", title: "Fixture: citations (pipeline shape)", scope: "city", scope_id: "boston",
  metric: "violations",
  value: { year: 2025, businesses: 40, violations: 90, businesses_explicit: 30, violations_explicit: 70,
    since_2024: { businesses: 120, violations: 300, violations_explicit: 200 }, businesses_with_capped_history: 2, lower_bound: true },
  caveat: "Fixture cost caveat.", source_ids: ["fx-food"], computed_at: at,
};

// Synthetic v2 producer shape: matched headline plus descriptive per-action rates.
export const pipelineMatchedRow: CorrelationRow = {
  ...pipelineWhatWorkedRow, title: "Fixture matched comparison", strength: "none",
  stat: {
    by_tag: {
      citation: { n: 50, n_censored: 1, recur_60d_pct: 30, ci_low: 18, ci_high: 44 },
      monitoring: { n: 300, n_censored: 5, recur_60d_pct: 20, ci_low: 15.5, ci_high: 25 },
    },
    unadjusted_contrast: { a: "citation", b: "monitoring", diff_pp: 10, ci_pp: [-2, 20] },
    matched: { risk_ratio: 1.03, ci_95: [0.82, 1.25], n_pairs: 35, strength: "none" },
  },
  chart: { type: "bar", x_label: "Closure action", y_label: "60-day repeat rate (%)",
    series: [
      { name: "60-day repeat rate", points: [["Citation", 30], ["Monitoring", 20]] },
      { name: "95% CI low", points: [["Citation", 18], ["Monitoring", 15.5]] },
      { name: "95% CI high", points: [["Citation", 44], ["Monitoring", 25]] },
    ] },
};
