import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRegionSolutions } from "../../../components/insights/regions/parse";

const missing = (code?: string) => ["PGRST202", "PGRST205", "42883", "42P01"].includes(code ?? "");

/** Read-only compatibility bridge to the currently shipped region cards. */
export async function readRegions(db: SupabaseClient): Promise<unknown> {
  const rpc = await db.rpc("insights_regions", { lim: 201, hood: null }, { get: true });
  if (!rpc.error) return rpc.data;
  if (!missing(rpc.error.code)) throw new Error("Region ranking could not be read.");
  const rows = await db.from("region_solutions").select("region_id,forecast_run_id,rank,cell_ids,action,lane,because,cites,records,unknowns,source,llm_model,input,caveat,computed_at").order("rank").range(0, 200);
  if (rows.error) throw new Error("Region solutions are unavailable.");
  const solutions = parseRegionSolutions(rows.data);
  if (rows.data?.length && solutions.length !== rows.data.length) throw new Error("Some region solutions could not be validated.");
  const ids = [...new Set(solutions.flatMap(r => r.cell_ids))];
  const populations = new Map<string, { pop: number; tract_ids: string[]; source_id: string }>();
  let populationUnavailable = false;
  for (let start = 0; start < ids.length; start += 500) {
    const result = await db.from("cell_population").select("cell_id,pop,tract_ids,source_id").in("cell_id", ids.slice(start, start + 500));
    if (result.error) { populationUnavailable = true; break; }
    for (const row of result.data ?? []) populations.set(row.cell_id, row);
  }
  return {
    origin: "region_solutions", truncated: solutions.length >= 201,
    regions: solutions.map(r => {
      const cells = [...new Set(r.cell_ids)].map(id => populations.get(id));
      const complete = !populationUnavailable && cells.length > 0 && cells.every(c => c && typeof c.pop === "number" && Number.isFinite(c.pop) && c.pop >= 0 && c.tract_ids?.length);
      const population = complete ? { pop: cells.reduce((sum, c) => sum + c!.pop, 0), source_ids: [...new Set(cells.map(c => c!.source_id))] } : null;
      return { region_id: r.region_id, rank: r.rank, cell_ids: r.cell_ids,
        neighborhood: r.input.region.neighborhood, severity: r.input.region.severity,
        recommendation: { action: r.action, because: r.because, unknowns: r.unknowns, lane: r.lane },
        evidence: r.input.possible_causes_within_150m, forecast: r.input.forecast,
        population, after_fix: null, computed_at: r.computed_at, run_id: r.forecast_run_id,
        source_ids: [...new Set([...r.input.source_ids, ...(population?.source_ids ?? [])])],
      };
    }),
  };
}
