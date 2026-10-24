import { supabase } from "@/lib/supabase";
import { parseRegions, summarySchema } from "./parse";

export async function loadInsights(limit: number, signal: AbortSignal) {
  const result = await supabase.rpc("insights_regions", { lim: limit, hood: null }, { get: true }).abortSignal(signal);
  if (!result.error) return parseRegions(result.data);
  if (result.error.code !== "PGRST202") throw result.error;
  const fallback = await supabase.rpc("insights_summary", {}, { get: true }).abortSignal(signal);
  if (fallback.error) throw fallback.error;
  const summary = summarySchema.parse(fallback.data);
  const cells = [...(summary.forecast?.top_cells ?? [])].sort((a, b) => (b.expected ?? 0) - (a.expected ?? 0));
  return { ...parseRegions({ run: summary.forecast?.run, sources: summary.sources, week: cells[0]?.week_start,
    regions: cells.slice(0, limit).map((cell, index) => ({ rank: index + 1, region_id: cell.cell_id, cell_id: cell.cell_id, cell_ids: [cell.cell_id],
      neighborhood: cell.neighborhood, severity: { expected: cell.expected, p_any: cell.p_any, band: cell.risk_band }, problems: cell.drivers })) }), fallback: true };
}
