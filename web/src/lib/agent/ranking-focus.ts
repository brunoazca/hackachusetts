import type { FocusRegion } from "../region-focus";

type Part = { type: string; output?: unknown };

/** A ranking in this response needs one shared view, even after individual fly-to calls. */
export function rankingFocusFallback(parts: readonly Part[]): FocusRegion[] | null {
  const index = parts.findLastIndex(p =>
    p.type === "tool-rank_regions" && (p.output as { ok?: boolean } | undefined)?.ok);
  if (index < 0) return null;
  // A deliberate selection or explicit focus/clear after the ranking takes precedence.
  // Fly-to alone cannot display ranked boundaries and must not suppress this fallback.
  const handled = parts.slice(index + 1).some(p =>
    ["tool-map_focus_regions", "tool-map_select"].includes(p.type)
    && (p.output as { ok?: boolean } | undefined)?.ok);
  if (handled) return null;
  const output = parts[index].output as { data?: { regions?: FocusRegion[] } };
  if (!Array.isArray(output.data?.regions)) return null;
  return output.data.regions.map(({ region_id, rank, cell_ids }) => ({ region_id, rank, cell_ids }));
}
