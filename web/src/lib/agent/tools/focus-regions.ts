import { z } from "zod";
import type { FocusRegion } from "../../region-focus";
import { clientTools, type ClientToolOutput } from "./client";
import { supabase } from "../../supabase";
import type { FeatureCollection, Polygon } from "geojson";
import { buildRegionFocus, gridPolygon } from "../../region-focus";
import { useMap } from "../../map-store";
let request = 0;
export async function focusRegions(input: unknown): Promise<ClientToolOutput> {
  const parsed = (clientTools.map_focus_regions.inputSchema as z.ZodType<{ regions: FocusRegion[] }>).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid region focus request." };
  const current = ++request;
  const revision = useMap.getState().regionFocusRevision;
  if (!parsed.data.regions.length) {
    useMap.getState().setRegionFocus(null);
    return { ok: true, done: "Region focus cleared; map filters preserved." };
  }
  try {
    const ids = [...new Set(parsed.data.regions.flatMap(r => r.cell_ids))];
    const cells: FeatureCollection<Polygon> = { type: "FeatureCollection", features: [] };
    for (let start = 0; start < ids.length; start += 100) {
      const response = await supabase.from("grid_cells").select("id,geom").in("id", ids.slice(start, start + 100));
      if (response.error) throw new Error("Could not load region boundaries.");
      for (const row of response.data ?? []) cells.features.push({ type: "Feature", properties: { id: row.id }, geometry: gridPolygon(row.geom) });
    }
    const focus = buildRegionFocus(parsed.data.regions, cells);
    if (current !== request || revision !== useMap.getState().regionFocusRevision) return { ok: false, error: "Superseded by a newer region focus request." };
    useMap.getState().setMode("assess");
    useMap.getState().setRegionFocus(focus);
    return { ok: true, done: `Prepared ${focus.labels.length} numbered region boundaries and outside shading. Map will fit these regions; filters preserved.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Region boundaries could not be loaded. Previous focus preserved." };
  }
}
