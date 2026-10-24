import { CELL_METRICS, type CellMetric, type CellMetricKey } from "./cell-metrics";
import { supabase } from "@/lib/supabase";
import type { FeatureCollection, Polygon } from "geojson";

// Block profile per 250 m grid cell: demographics (area-weighted from census tracts) and building age
// (assessor parcels in the cell). RPCs in supabase/migrations/20261025100001_analytics_cell_context.sql.
// Static context, not a model output: shown so people can look for patterns, never as a cause.

export type CellContextAttrs = Partial<Record<CellMetricKey, number>>;

export { CELL_METRICS } from "./cell-metrics";
export type { CellMetric, CellMetricKey } from "./cell-metrics";

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

export type RegionPopulation = { pop: number; n_cells: number; sources: { id: string; name: string; url: string }[] };

/** Residents in a set of cells (an Insights region), area-weighted from census tracts. */
export async function fetchRegionPopulation(cellIds: string[]): Promise<RegionPopulation> {
  const { data, error } = await supabase.rpc("region_population", { cell_ids: cellIds });
  if (error) throw error;
  return data as RegionPopulation;
}
