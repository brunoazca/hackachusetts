import { tool } from "ai";
import { z } from "zod";
import categories from "../../categories.json";
import type { MapDisplay } from "../../map-store";
import type { LayerId, Mode, Selection } from "../../map-store";

// Client-side map tools (task 4.3). The route declares them without `execute`,
// so the model's calls stream to the browser; ChatPanel runs them on the map
// store through executeClientTool and sends the output back.

export const LAYER_IDS = [
  "rodent", "rats_other", "food", "shelter", "displace",
  "restaurants", "bigbelly", "events", "sites", "forecast",
  "heatmap", "tracts_svi", "tracts_asthma", "listings", "prices",
] as const satisfies readonly LayerId[];
// Compile-time check that LAYER_IDS lists every LayerId in map-store.ts.
type _AllLayers = Exclude<LayerId, (typeof LAYER_IDS)[number]> extends never ? true : never;
const _allLayers: _AllLayers = true;
void _allLayers;

const CATEGORY_IDS = Object.keys(categories.incident_categories) as [string, ...string[]];
const TOGGLE_IDS = [...CATEGORY_IDS, "ctx_housing", "ctx_buildings"] as [string, ...string[]];
const SELECT_KINDS = ["incident", "place", "event", "site", "cell", "listing", "tract"] as const;
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const clientTools = {
  app_set_mode: tool({
    description: "Switch the app between Assess and Act. Keeps the selected site. All layers are already available; there is no separate depth mode.",
    inputSchema: z.object({
      mode: z.enum(["assess", "act"]),
    }).strict(),
  }),
  map_fly_to: tool({
    description: "Move the map to a point. Only use coordinates returned by a data tool (geocode, get_site, search_incidents…), never guessed ones.",
    inputSchema: z.object({
      lat: z.number().min(41.9).max(42.7),
      lon: z.number().min(-71.5).max(-70.7),
      zoom: z.number().min(10).max(19).optional().describe("15 for a block, 13 for a neighborhood"),
    }),
  }),
  map_set_categories: tool({
    description: "Change the exact category toggles in the map dock. on/off preserve all other toggles; only replaces the incident selection ([] hides all incidents). Use category ids from the catalog in the system prompt. Context toggles ctx_housing and ctx_buildings support on/off. When enabling food/shelter/displacement, also set causes:true using map_set_display so they appear at city zoom.",
    inputSchema: z.object({ on: z.array(z.enum(TOGGLE_IDS)).optional(), off: z.array(z.enum(TOGGLE_IDS)).optional(), only: z.array(z.enum(CATEGORY_IDS)).optional() }).strict(),
  }),
  map_set_display: tool({
    description: "Change map presentation: heat (Hot spots), points (Each report), both, and whether possible causes appear at city zoom. Preserves unspecified options.",
    inputSchema: z.object({ viewMode: z.enum(["points", "heat", "both"]).optional(), causes: z.boolean().optional() }).strict(),
  }),
  map_set_layers: tool({
    description: "Turn map layers on or off.",
    inputSchema: z.object({
      on: z.array(z.enum(LAYER_IDS)).optional(),
      off: z.array(z.enum(LAYER_IDS)).optional(),
    }),
  }),
  map_set_filters: tool({
    description: "Set the map's date range, incident categories and status filter.",
    inputSchema: z.object({
      since: isoDate.optional(),
      until: isoDate.optional(),
      categories: z.array(z.enum(CATEGORY_IDS)).optional().describe("Exact incident category selection; [] hides all incidents. Omit to preserve. Prefer map_set_categories for individual toggles."),
      status: z.enum(["all", "open", "closed"]).optional(),
    }),
  }),
  map_highlight: tool({
    description: "Emphasize features on the map by id (ids from tool results). Empty list clears.",
    inputSchema: z.object({ ids: z.array(z.string()).max(200) }),
  }),
  map_select: tool({
    description: "Select one feature by id and open it in the Inspect panel.",
    inputSchema: z.object({ kind: z.enum(SELECT_KINDS), id: z.string().min(1) }),
  }),
  map_show_forecast: tool({
    description: "Show the forecast layer, optionally for a given week (ISO date of the week's Monday).",
    inputSchema: z.object({ week_start: isoDate.optional() }),
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
  setEnabled: (patch: Record<string, boolean>) => void;
  setDisplay: (patch: Partial<MapDisplay>) => void;
  setMode: (mode: Mode) => void;
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
    case "map_fly_to": {
      const { lat, lon, zoom } = v as { lat: number; lon: number; zoom?: number };
      map.flyTo(zoom == null ? { lat, lon } : { lat, lon, zoom });
      return { ok: true, done: `Moved the map to ${lat.toFixed(4)}, ${lon.toFixed(4)}` };
    }
    case "map_set_categories": {
      const { on = [], off = [], only } = v as { on?: string[]; off?: string[]; only?: string[] };
      const patch: Record<string, boolean> = only ? Object.fromEntries(CATEGORY_IDS.map(id => [id, only.includes(id)])) : {};
      for (const id of off) patch[id] = false;
      for (const id of on) patch[id] = true;
      map.setEnabled(patch);
      const catalog = categories.incident_categories as Record<string, { group: string }>;
      if (Object.entries(patch).some(([id, on]) => on && catalog[id] && catalog[id].group !== "rats")) map.setDisplay({ causes: true });
      return { ok: true, done: "Map category toggles updated" };
    }
    case "map_set_display": {
      map.setDisplay(v);
      return { ok: true, done: "Map presentation updated" };
    }
    case "map_set_layers": {
      const { on = [], off = [] } = v as { on?: LayerId[]; off?: LayerId[] };
      const patch: Partial<Record<LayerId, boolean>> = {};
      for (const l of off) patch[l] = false;
      for (const l of on) patch[l] = true;
      const unsupported = [...on, ...off].filter(id => !["rodent", "rats_other", "food", "shelter", "displace", "forecast", "heatmap"].includes(id));
      if (unsupported.length) return { ok: false, error: `Unsupported layers: ${unsupported.join(", ")}. Use map_set_categories for individual dock toggles.` };
      const enabled: Record<string, boolean> = {};
      for (const [layer, value] of Object.entries(patch)) {
        for (const [id, category] of Object.entries(categories.incident_categories)) {
          if ((layer === "rodent" && id === "rodent") || (layer === "rats_other" && category.group === "rats" && id !== "rodent") || category.group === layer) enabled[id] = value;
        }
        if (layer === "heatmap") map.setDisplay({ viewMode: value ? "heat" : "points" });
        if (value && ["food", "shelter", "displace"].includes(layer)) map.setDisplay({ causes: true });
      }
      map.setEnabled(enabled);
      map.setLayers(patch);
      return { ok: true, done: `Layers on: ${on.join(", ") || "—"}; off: ${off.join(", ") || "—"}` };
    }
    case "map_set_filters": {
      map.setFilters(v);
      return { ok: true, done: "Filters updated" };
    }
    case "map_highlight": {
      const { ids } = v as { ids: string[] };
      map.setHighlight(ids);
      return { ok: true, done: "Highlight request recorded", rendered: false, caveat: "Visual highlighting is not available in the current map. Use the feature chips to inspect the reports; do not say they were highlighted." };
    }
    case "map_select": {
      const { kind, id } = v as { kind: (typeof SELECT_KINDS)[number]; id: string };
      map.select({ kind, id });
      return { ok: true, done: `Selected ${kind} ${id}` };
    }
    case "map_show_forecast": {
      const { week_start } = v as { week_start?: string };
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
