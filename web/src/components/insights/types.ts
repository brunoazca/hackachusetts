// Row shapes from supabase/migrations/20261024000002_analysis_schema.sql (the contract),
// plus the view models the Insights panel renders. jsonb columns arrive as `unknown` and
// are narrowed in parse.ts, never trusted as-is.

export type Strength = "strong" | "moderate" | "weak" | "none";
export type ChartType = "scatter" | "bar" | "line" | "event_study";
export type RiskBand = "low" | "elevated" | "high" | "very_high";

// Public citation metadata returned by the read RPC.
export type SourceRow = { id: string; name: string; url: string; retrieved_at: string };

// correlations row (stat and chart are jsonb).
export type CorrelationRow = {
  id: string;
  title: string;
  question: string;
  method: string;
  unit: string | null;
  stat: unknown;
  strength: string;
  chart: unknown;
  caveat: string;
  group_name: string;
  source_ids: string[] | null;
  sort: number | null;
  computed_at: string;
};

// model_runs row.
export type ModelRunRow = {
  id: string;
  model: string;
  trained_through: string | null;
  params: unknown;
  metrics: unknown;
  feature_importance: unknown;
  created_at: string;
};

// price_impact row (value is jsonb).
export type PriceImpactRow = {
  id: string;
  title: string;
  scope: string;
  scope_id: string | null;
  metric: string;
  value: unknown;
  caveat: string;
  source_ids: string[] | null;
  computed_at: string;
};

// Aggregates over `predictions` for the latest model run (see RPC_PROPOSAL.md).
export type ForecastWeekRow = {
  week_start: string;
  expected_total: number;
  cells: number;
  bands: Partial<Record<RiskBand, number>>;
};

export type ForecastCellRow = {
  cell_id: string;
  week_start: string;
  expected: number;
  p_any: number;
  risk_band: string;
  neighborhood: string | null;
  drivers: unknown;
};

// Payload of the proposed `insights_summary()` RPC.
export type InsightsPayload = {
  sources?: SourceRow[] | null;
  correlations: CorrelationRow[] | null;
  price_impact: PriceImpactRow[] | null;
  forecast: {
    run: ModelRunRow | null;
    weeks: ForecastWeekRow[] | null;
    top_cells: ForecastCellRow[] | null;
  } | null;
};

// ---- view models ----

export type ChartSeries = { name: string; points: [number | string, number][] };
export type ChartSpec = {
  type: ChartType;
  xLabel: string;
  yLabel: string;
  series: ChartSeries[];
  // Interval bounds sent as series named "… CI low" / "… CI high"; drawn as error bars on series[0].
  ci?: { lo: ChartSeries; hi: ChartSeries };
};

export type Finding = {
  id: string;
  title: string;
  question: string;
  method: string;
  unit: string | null;
  statText: string | null;   // e.g. "ρ = 0.42 · p = 0.001"
  moreStats: [string, string][]; // secondary scalar stats, labelled
  insufficient: boolean;
  actionSamples: {
    tag: string; label: string; n: number; censored: number | null;
    ratePct: number | null; intervalPct: [number, number] | null;
  }[];
  sampleText: string | null; // e.g. "n = 1,234 cells"
  strength: Strength | null; // null = unknown label in the row
  chart: ChartSpec | null;
  chartProblem: string | null; // why chart is null, shown to the reader
  caveat: string;
  group: string;
  sources: string[];
  sourceDetails: SourceRow[];
  computedAt: string;
};

export type ScorePair = { model: number | null; baseline: number | null };

export type ForecastView = {
  runId: string;
  model: string;
  isBaseline: boolean;
  trainedThrough: string | null;
  createdAt: string;
  backtestWeeks: number | null;
  mae: ScorePair;
  top10: ScorePair;
  features: { label: string; importance: number }[];
  weeks: ForecastWeekRow[];
  topCells: {
    cellId: string;
    weekStart: string;
    expected: number;
    pAny: number;
    band: RiskBand | null;
    neighborhood: string | null;
    drivers: string[];
    // Same top drivers, unformatted, for the visual driver bar. value = signed contribution.
    driverParts: { label: string; value: number | null }[];
  }[];
};

export type ImpactItem = {
  id: string;
  title: string;
  kind: "cost" | "exploratory";
  scope: string;
  scopeId: string | null;
  metric: string;
  headline: string | null;   // formatted main value, only for known headline keys
  headlineLabel: string | null;
  details: [string, string][]; // other key/value pairs, formatted and labelled
  tables: { name: string; columns: string[]; rows: string[][] }[]; // lists of records in value
  caveat: string;
  sources: string[];
  sourceDetails: SourceRow[];
  computedAt: string;
};

export type InsightsData = {
  findings: Finding[];
  forecast: ForecastView | null;
  costs: ImpactItem[];
  exploratory: ImpactItem[];
};

export type InsightsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "unavailable"; reason: string }
  | { status: "ready"; data: InsightsData };
