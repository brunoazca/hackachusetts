import { tool } from "ai";
import { z } from "zod";
import type { LayerId, Mode, Selection } from "../../map-store";
import { CATEGORY_IDS, LAYER_IDS, LAYER_GROUPS, isNearbyCategory, type ViewMode } from "../../map-controls";
import { CELL_METRICS } from "../../cell-metrics";

// Client-side map tools (task 4.3). The route declares them without `execute`,
// so the model's calls stream to the browser; ChatPanel runs them on the map
// store through executeClientTool and sends the output back.

export { LAYER_IDS } from "../../map-controls";
const TOOL_LAYER_IDS = [...LAYER_IDS, ...Object.keys(LAYER_GROUPS), "heatmap"] as string[];

const SELECT_KINDS = ["incident", "place", "event", "site", "cell", "listing", "tract"] as const;
const isoDate = z.iso.date();

export const clientTools = {
  app_set_mode: tool({
    description: "Switch the app between Assess and Act. Keeps the selected site. All layers are already available; there is no separate depth mode.",
    inputSchema: z.object({
      mode: z.enum(["assess", "act"]),
    }).strict(),
  }),
  map_filter_sites: tool({
    description: "Filter Places to visit by neighborhood, matching the original queue filter. Use a neighborhood returned by a site lookup or the current map context. Empty string clears. Opens Act mode.",
    inputSchema: z.object({ neighborhood: z.string().max(100) }).strict(),
  }),
  map_fly_to: tool({
    description: "Move the map to a point. Only use coordinates returned by a data tool (geocode, get_site, search_incidents…), never guessed ones.",
    inputSchema: z.object({
      lat: z.number().min(41.9).max(42.7),
      lon: z.number().min(-71.5).max(-70.7),
      zoom: z.number().min(10).max(19).optional().describe("15 for a block, 13 for a neighborhood"),
    }),
  }),
  map_set_layers: tool({
    description: "Turn any original map category or context layer on/off. food/shelter/displace/rats/rats_other toggle groups; ctx_housing is old housing, ctx_buildings is buildings by age. heatmap toggles hot spots. Other settings are preserved.",
    inputSchema: z.object({
      on: z.array(z.enum(TOOL_LAYER_IDS)).optional(),
      off: z.array(z.enum(TOOL_LAYER_IDS)).optional(),
    }),
  }),
  map_set_filters: tool({
    description: "Set the map's date range, incident categories and status filter.",
    inputSchema: z.object({
      since: isoDate.optional(),
      until: isoDate.optional(),
      categories: z.array(z.enum(CATEGORY_IDS)).optional().describe("Exact categories to show, replacing enabled incident layers; [] = all. Use map_set_layers to toggle individual layers or turn every category off."),
      status: z.enum(["all", "open", "closed"]).optional(),
    }),
  }),
  map_set_view: tool({
    description: "Change the original map display: points (each report), heat (hot spots), both; show/hide nearby records; choose a per-250m-block profile metric (building age or population context). block_metric null turns the profile off. These metrics are context, not evidence of causes.",
    inputSchema: z.object({
      mode: z.enum(["points", "heat", "both"]).optional(),
      nearby_records: z.boolean().optional(),
      block_metric: z.enum(CELL_METRICS.map(metric => metric.key)).nullable().optional(),
    }).strict(),
  }),
  map_highlight: tool({
    description: "Draw rings around loaded incidents and Act sites by id. Fly to a street-level zoom first for report ids. Features outside the current layers, period, status or viewport cannot be highlighted. Empty list clears.",
    inputSchema: z.object({ ids: z.array(z.string()).max(200) }),
  }),
  map_select: tool({
    description: "Select one feature by id and open it in the Inspect panel.",
    inputSchema: z.object({ kind: z.enum(SELECT_KINDS), id: z.string().min(1) }),
  }),
  map_show_forecast: tool({
    description: "Show the forecast layer, optionally for a given week (ISO date of the week's Monday).",
    inputSchema: z.object({ week_start: z.union([isoDate, z.literal("4w")]).optional() }),
  }),
  open_panel: tool({
    description: "Switch the side panel tab.",
    inputSchema: z.object({ panel: z.enum(["inspector", "insights", "chat"]) }),
  }),
};

export type ClientToolName = keyof typeof clientTools;
export const CLIENT_TOOL_NAMES = Object.keys(clientTools) as ClientToolName[];

/** The map-store actions the client tools need (a subset of useMap's state). */
export type MapActions = {
  setMode: (mode: Mode) => void;
  setSiteNeighborhood: (neighborhood: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCauses: (on: boolean) => void;
  setCellMetric: (metric: string | null) => void;
  filters?: { since: string; until: string };
  flyTo: (v: { lat: number; lon: number; zoom?: number }) => void;
  setLayers: (patch: Partial<Record<LayerId, boolean>>) => void;
  setFilters: (patch: Partial<{ since: string; until: string; categories: string[]; status: "all" | "open" | "closed" }>) => void;
  setHighlight: (ids: string[]) => void;
  select: (s: Selection) => void;
  setPanel: (p: "inspector" | "insights" | "chat") => void;
  setForecastWeek: (w: string | null) => void;
};

export type ClientToolOutput = { ok: true; done: string; rendered?: false; caveat?: string } | { ok: false; error: string };

export function isClientTool(name: string): name is ClientToolName {
  return (CLIENT_TOOL_NAMES as string[]).includes(name);
}

/** Validates the model's input and applies it to the map store. */
export function executeClientTool(name: string, input: unknown, map: MapActions): ClientToolOutput {
  if (!isClientTool(name)) return { ok: false, error: `Unknown client tool ${name}` };
  const parsed = (clientTools[name].inputSchema as z.ZodType).safeParse(input);
  if (!parsed.success) return { ok: false, error: `Invalid input: ${parsed.error.issues[0]?.message ?? "bad input"}` };
  const v = parsed.data as never;
  switch (name) {
    case "app_set_mode": {
      const { mode } = v as { mode: Mode };
      map.setMode(mode);
      return { ok: true, done: `App view updated: ${mode}` };
    }
    case "map_filter_sites": {
      const { neighborhood } = v as { neighborhood: string };
      map.setSiteNeighborhood(neighborhood);
      map.setLayers({ sites: true });
      map.setMode("act");
      return { ok: true, done: neighborhood ? `Places filtered to ${neighborhood}` : "Showing all neighborhoods" };
    }
    case "map_fly_to": {
      const { lat, lon, zoom } = v as { lat: number; lon: number; zoom?: number };
      map.flyTo(zoom == null ? { lat, lon } : { lat, lon, zoom });
      return { ok: true, done: `Moved the map to ${lat.toFixed(4)}, ${lon.toFixed(4)}` };
    }
    case "map_set_layers": {
      const { on = [], off = [] } = v as { on?: string[]; off?: string[] };
      const patch: Partial<Record<LayerId, boolean>> = {};
      for (const [ids, value] of [[off, false], [on, true]] as const) {
        for (const id of ids) {
          if (id === "heatmap") { map.setViewMode(value ? "heat" : "points"); continue; }
          const group = LAYER_GROUPS[id as keyof typeof LAYER_GROUPS];
          for (const layer of group ?? [id as LayerId]) patch[layer] = value;
        }
      }
      map.setLayers(patch);
      map.setMode(patch.sites === true ? "act" : "assess");
      if (Object.entries(patch).some(([id, on]) => on && isNearbyCategory(id))) map.setCauses(true);
      return { ok: true, done: `Layers on: ${on.join(", ") || "—"}; off: ${off.join(", ") || "—"}` };
    }
    case "map_set_filters": {
      const filters = v as { since?: string; until?: string };
      const since = filters.since ?? map.filters?.since;
      const until = filters.until ?? map.filters?.until;
      if (since && until && since > until) return { ok: false, error: "Start date must be on or before end date." };
      map.setFilters(v);
      map.setMode("assess");
      return { ok: true, done: "Filters updated" };
    }
    case "map_set_view": {
      const { mode, nearby_records, block_metric } = v as { mode?: ViewMode; nearby_records?: boolean; block_metric?: string | null };
      map.setMode("assess");
      if (mode) map.setViewMode(mode);
      if (nearby_records != null) map.setCauses(nearby_records);
      if (block_metric !== undefined) map.setCellMetric(block_metric);
      return { ok: true, done: "Map display updated" };
    }
    case "map_highlight": {
      const { ids } = v as { ids: string[] };
      map.setHighlight(ids);
      return { ok: true, done: ids.length ? "Highlighting matching loaded reports and sites" : "Highlights cleared", caveat: "Only loaded reports and visible Act sites matching the current map filters are highlighted. Zoom to street level for individual report ids." };
    }
    case "map_select": {
      const { kind, id } = v as { kind: (typeof SELECT_KINDS)[number]; id: string };
      map.select({ kind, id });
      return { ok: true, done: `Selected ${kind} ${id}` };
    }
    case "map_show_forecast": {
      const { week_start } = v as { week_start?: string };
      map.setMode("assess");
      map.setLayers({ forecast: true });
      map.setForecastWeek(week_start ?? null);
      return { ok: true, done: `Forecast layer on${week_start ? ` for week of ${week_start}` : ""}` };
    }
    case "open_panel": {
      const { panel } = v as { panel: "inspector" | "insights" | "chat" };
      map.setPanel(panel);
      return { ok: true, done: `Opened ${panel}` };
    }
  }
}
