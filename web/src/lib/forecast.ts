import { supabase } from "@/lib/supabase";
import type { FeatureCollection, Polygon } from "geojson";
import type { BBox } from "@/lib/queries";

// Typed wrappers over the forecast RPCs (supabase/migrations/20261024500002_model_forecast_api.sql).
// Owner: model track.

export type ForecastRun = {
  run_id: string;
  trained_through: string;
  weeks: string[];
  metrics: { top10pct_capture: number; baseline_top10pct_capture: number; mae: number; baseline_mae: number; backtest_from: string; backtest_to: string };
  caveat: string;
};

export type ForecastCellProps = {
  id: string;
  expected: number;
  p_any: number;
  band: "low" | "elevated" | "high" | "very_high";
  emerging: "emerging_hotspot" | "early_warning" | null;
};

export type Driver = { feature: string; label: string; contribution: number; value: number | null };

export type CellDetail = {
  cell: { id: string; lat: number; lon: number; neighborhood: string | null } | null;
  run_id: string;
  week: string;
  forecast: { week: string; expected: number; p_any: number; band: ForecastCellProps["band"] }[];
  drivers: Driver[];
  history: { week: string; actual: number; expected: number }[];
  emerging: { cell_id: string; kind: string; signals: { feature: string; label: string; last_12_weeks: number }[] } | null;
  caveat: string;
};

export async function fetchForecastRun(): Promise<ForecastRun | null> {
  const { data, error } = await supabase.rpc("forecast_run");
  if (error) throw error;
  return data as ForecastRun | null;
}

export async function fetchForecast(bbox: BBox, week: string | null): Promise<FeatureCollection<Polygon, ForecastCellProps>> {
  const [min_lon, min_lat, max_lon, max_lat] = bbox;
  const { data, error } = await supabase.rpc("map_forecast", { min_lon, min_lat, max_lon, max_lat, week });
  if (error) throw error;
  return data as FeatureCollection<Polygon, ForecastCellProps>;
}

export async function fetchCellDetail(cellId: string): Promise<CellDetail> {
  const { data, error } = await supabase.rpc("cell_detail", { cell_id: cellId });
  if (error) throw error;
  return data as CellDetail;
}

// Log color scale shared by the layer and the legend: each step is ×10 reports per block per week.
export const FORECAST_STOPS: [number, string][] = [
  [0.01, "#fde7a6"],
  [0.1, "#f2a541"],
  [1, "#d9481c"],
  [10, "#7f1010"],
];

export const fmtWeek = (w: string) => new Date(w + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
