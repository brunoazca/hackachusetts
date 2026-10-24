import { supabase } from "@/lib/supabase";
import type { FeatureCollection, Polygon } from "geojson";

// Block profile per 250 m grid cell: demographics (area-weighted from census tracts) and building age
// (assessor parcels in the cell). RPCs in supabase/migrations/20261025100001_analytics_cell_context.sql.
// Static context, not a model output: shown so people can look for patterns, never as a cause.

export type CellContextAttrs = Partial<Record<CellMetricKey, number>>;

export type CellMetric = {
  key: string;
  label: string;
  group: "Buildings" | "People";
  unit: "pct" | "year" | "usd" | "count" | "density";
  source: string;
  /** Higher value = darker color, except when reversed (older year built = darker). */
  reverse?: boolean;
};

export const CELL_METRICS = [
  { key: "yr_built_median", label: "Median year built", group: "Buildings", unit: "year", source: "assessor parcels", reverse: true },
  { key: "pct_built_pre1900", label: "Buildings before 1900", group: "Buildings", unit: "pct", source: "assessor parcels" },
  { key: "pct_built_pre1940", label: "Buildings before 1940", group: "Buildings", unit: "pct", source: "assessor parcels" },
  { key: "pct_built_1980_plus", label: "Buildings from 1980 on", group: "Buildings", unit: "pct", source: "assessor parcels" },
  { key: "parcels", label: "Parcels", group: "Buildings", unit: "count", source: "assessor parcels" },
  { key: "units", label: "Housing units", group: "Buildings", unit: "count", source: "assessor parcels" },
  { key: "pct_owner_occupied", label: "Owner-occupied parcels", group: "Buildings", unit: "pct", source: "assessor parcels" },
  { key: "value_median_fy26", label: "Median assessed value", group: "Buildings", unit: "usd", source: "assessor FY26" },
  { key: "pct_housing_pre1940", label: "Homes before 1940", group: "Buildings", unit: "pct", source: "ACS tract" },
  { key: "pct_housing_pre1960", label: "Homes before 1960", group: "Buildings", unit: "pct", source: "ACS tract" },
  { key: "pop_per_km2", label: "People per km²", group: "People", unit: "density", source: "tract population" },
  { key: "median_income", label: "Median household income", group: "People", unit: "usd", source: "ACS tract" },
  { key: "pct_poverty", label: "Residents in poverty", group: "People", unit: "pct", source: "ACS tract" },
  { key: "pct_renters", label: "Households renting", group: "People", unit: "pct", source: "ACS tract" },
  { key: "pct_people_of_color", label: "People of color", group: "People", unit: "pct", source: "ACS tract" },
  { key: "pct_limited_english_hh", label: "Limited-English households", group: "People", unit: "pct", source: "ACS tract" },
  { key: "asthma_pct", label: "Adults with asthma", group: "People", unit: "pct", source: "CDC PLACES" },
  { key: "svi_low_income_pct", label: "Low income (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_children_pct", label: "Children (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_older_adults_pct", label: "Older adults (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_disability_pct", label: "People with a disability (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_medical_illness_pct", label: "Medical illness (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_limited_english_pct", label: "Limited English (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
  { key: "svi_people_of_color_pct", label: "People of color (SVI)", group: "People", unit: "pct", source: "Climate Ready Boston, BOS only" },
] as const satisfies readonly CellMetric[];

export type CellMetricKey = (typeof CELL_METRICS)[number]["key"];

// Sequential ramps (ColorBrewer). Buildings share the reds of the tract "old housing" layer; people get purples
// so the block choropleth never reads as the forecast or the rat heatmap.
export const CELL_RAMPS = {
  Buildings: ["#fff7ec", "#fdd49e", "#fc8d59", "#d7301f", "#7f0000"],
  People: ["#f7fcfd", "#bfd3e6", "#8c96c6", "#8856a7", "#810f7c"],
};

export function metricFor(key: string | null | undefined): CellMetric | undefined {
  return CELL_METRICS.find((m) => m.key === key);
}

export function fmtMetric(m: Pick<CellMetric, "unit">, v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "n/a";
  switch (m.unit) {
    case "pct": return `${v.toFixed(v < 10 ? 1 : 0)}%`;
    case "year": return String(Math.round(v));
    case "usd": return v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1000)}k`;
    case "density": return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
    default: return Math.round(v).toLocaleString("en-US");
  }
}

/** Five quantile breaks (p10..p90) of a metric over the cells that have it, for the choropleth and its key. */
export function quantileStops(fc: FeatureCollection, key: string): number[] {
  const vals = fc.features.map((f) => Number(f.properties?.[key])).filter(Number.isFinite).sort((a, b) => a - b);
  if (!vals.length) return [];
  const q = (p: number) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  const stops = [0.1, 0.3, 0.5, 0.7, 0.9].map(q);
  // interpolate needs strictly ascending inputs
  for (let i = 1; i < stops.length; i++) if (stops[i] <= stops[i - 1]) stops[i] = stops[i - 1] + 1e-6;
  return stops;
}

let cache: Promise<FeatureCollection<Polygon>> | null = null;
/** All cells with a profile (~2 MB), fetched once and only when a block layer is switched on. */
export function fetchCellContextMap(): Promise<FeatureCollection<Polygon>> {
  cache ??= Promise.resolve(supabase.rpc("map_cell_context")).then(({ data, error }) => {
    if (error) { cache = null; throw error; }
    return data as FeatureCollection<Polygon>;
  });
  return cache;
}

export type CellContext = {
  cell_id: string;
  attrs: CellContextAttrs;
  computed_at: string;
  sources: { id: string; name: string; url: string }[];
};

export async function fetchCellContext(cellId: string): Promise<CellContext | null> {
  const { data, error } = await supabase.rpc("cell_context", { cell_id: cellId });
  if (error) throw error;
  return data as CellContext | null;
}
