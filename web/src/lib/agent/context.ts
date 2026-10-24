import { z } from "zod";
import type { BBox, MapContext } from "./types";
import { CELL_METRICS } from "../cell-metrics";

// The map context the ChatPanel sends with every message (R8.5), and its
// server-side validation. Bounds are the actual viewport, never the padded fetch box.

type StoreLike = {
  mode?: "assess" | "act" | "inspect";
  selection: { kind: string; id?: string } | null;
  view: { lat: number; lon: number; zoom: number };
  filters: { since: string; until: string; categories: string[]; status: string };
  layers: Record<string, boolean>;
  /** Actual viewport, updated on map load and moveend, including cached pans. */
  bounds?: BBox | null;
  viewMode?: "points" | "heat" | "both";
  causes?: boolean;
  forecastWeek?: string | null;
  siteNeighborhood?: string;
  cellMetric?: string | null;
};

export function buildMapContext(s: StoreLike): MapContext {
  const sel = s.selection;
  return {
    ...(s.mode ? { mode: s.mode } : {}),
    ...(s.viewMode ? { viewMode: s.viewMode } : {}),
    ...(s.causes != null ? { nearbyRecords: s.causes } : {}),
    forecastPeriod: s.forecastWeek ?? "4w",
    siteNeighborhood: s.siteNeighborhood ?? "",
    blockMetric: s.cellMetric ?? null,
    selection: sel == null ? null : sel.kind === "area" ? { kind: "area" } : { kind: sel.kind, id: sel.id ?? "" },
    view: { ...s.view },
    bbox: s.bounds ? [...s.bounds] : null,
    filters: { ...s.filters, categories: [...s.filters.categories] },
    layers: Object.entries(s.layers).filter(([, on]) => on).map(([id]) => id),
  };
}

const num = z.number().finite();
export const mapContextSchema = z.object({
  mode: z.enum(["assess", "act"]).optional(),
  viewMode: z.enum(["points", "heat", "both"]).optional(),
  nearbyRecords: z.boolean().optional(),
  forecastPeriod: z.string().max(10).optional(),
  siteNeighborhood: z.string().max(100).optional(),
  blockMetric: z.enum(CELL_METRICS.map(metric => metric.key)).nullable().optional(),
  selection: z.union([z.object({ kind: z.string().max(20), id: z.string().max(200) }), z.object({ kind: z.literal("area") }), z.null()]),
  view: z.object({ lat: num, lon: num, zoom: num }).nullable(),
  bbox: z.tuple([num, num, num, num]).nullable(),
  filters: z.object({ since: z.string().max(30), until: z.string().max(30), categories: z.array(z.string().max(40)).max(40), status: z.string().max(10) }).nullable(),
  layers: z.array(z.string().max(30)).max(30),
});

export function parseMapContext(raw: unknown): MapContext | null {
  const r = mapContextSchema.safeParse(raw);
  return r.success ? (r.data as MapContext) : null;
}
