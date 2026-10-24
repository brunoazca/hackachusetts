import { z } from "zod";
import type { BBox, MapContext } from "./types";

// The map context the ChatPanel sends with every message (R8.5), and its
// server-side validation. bbox stays null until the map store publishes the
// visible bounds; we never derive it from center + zoom (that would guess).

type StoreLike = {
  mode?: "assess" | "act" | "inspect";
  selection: { kind: string; id?: string } | null;
  view: { lat: number; lon: number; zoom: number };
  filters: { since: string; until: string; categories: string[]; status: string };
  layers: Record<string, boolean>;
  /** Proposed map-store field (not in the store yet): [minLon, minLat, maxLon, maxLat] set by MapView on moveend. */
  bounds?: BBox | null;
};

export function buildMapContext(s: StoreLike): MapContext {
  const sel = s.selection;
  return {
    ...(s.mode ? { mode: s.mode } : {}),
    selection: sel == null ? null : sel.kind === "area" ? { kind: "area" } : { kind: sel.kind, id: sel.id ?? "" },
    view: s.view,
    bbox: s.bounds ?? null,
    filters: s.filters,
    layers: Object.entries(s.layers).filter(([, on]) => on).map(([id]) => id),
  };
}

const num = z.number().finite();
export const mapContextSchema = z.object({
  mode: z.enum(["assess", "act"]).optional(),
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
