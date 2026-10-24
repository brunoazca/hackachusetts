import type { FocusRegion } from "../region-focus";

type Part = { type: string; output?: unknown };

/** A ranking in this response needs one shared view, even after individual fly-to calls. */
export function rankingFocusFallback(parts: readonly Part[]): FocusRegion[] | null {
  const index = parts.findLastIndex(p =>
    ["tool-rank_regions", "tool-get_ranking"].includes(p.type) && (p.output as { ok?: boolean } | undefined)?.ok);
  if (index < 0) return null;
  // A deliberate selection or explicit focus/clear after the ranking takes precedence.
  // Fly-to alone cannot display ranked boundaries and must not suppress this fallback.
  const handled = parts.slice(index + 1).some(p =>
    ["tool-map_focus_regions", "tool-map_select", "tool-open_insight"].includes(p.type)
    && (p.output as { ok?: boolean } | undefined)?.ok);
  if (handled) return null;
  const output = parts[index].output as { data?: {
    regions?: FocusRegion[];
    entries?: { cell_id: string; position: number; cell_ids: string[] }[];
  } };
  if (parts[index].type === "tool-get_ranking") {
    if (!Array.isArray(output.data?.entries)) return null;
    return output.data.entries.map(e => ({ region_id: e.cell_id, rank: e.position, cell_ids: e.cell_ids }));
  }
  if (!Array.isArray(output.data?.regions)) return null;
  return output.data.regions.map(({ region_id, rank, cell_ids }) => ({ region_id, rank, cell_ids }));
}
