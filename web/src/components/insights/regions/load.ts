import { supabase } from "@/lib/supabase";
import { parseRegionSolutions } from "./parse";
import type { SourceRow } from "../types";

export async function loadRegionSolutions(limit: number, signal: AbortSignal) {
  const { data, error } = await supabase.from("region_solutions")
    .select("region_id,forecast_run_id,rank,cell_ids,action,lane,because,cites,records,unknowns,source,llm_model,input,caveat,computed_at")
    .order("rank").limit(limit).abortSignal(signal);
  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) return { regions: [], sources: [], sourcesUnavailable: false };
    throw error;
  }
  const regions = parseRegionSolutions(data);
  if (data?.length && !regions.length) throw new Error("Region solutions could not be read. Please retry after the next model run.");
  const ids = [...new Set(regions.flatMap(r => r.input.source_ids))];
  let sources: SourceRow[] = [];
  let sourcesUnavailable = false;
  if (ids.length) {
    const result = await supabase.from("sources").select("id,name,url,retrieved_at").in("id", ids).abortSignal(signal);
    if (result.error) sourcesUnavailable = true;
    else sources = result.data ?? [];
  }
  return { regions, sources, sourcesUnavailable };
}
