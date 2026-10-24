// One Insight panel for every map selection (insights spec rev. 3). Pure routing + loaders, no UI:
//   nothing          -> ranking (insight_ranking: ranked regions, then the worst lone cells)
//   cell / area      -> area insight (the region's AI card, or the cell's own card; on-demand AI for cells)
//   rodent report    -> record insight (will it come back, what to do, evidence)
//   other report / place -> evidence insight (what it is + rodent reports within 150 m it may relate to)
//   site / parcel / event / listing / tract -> the existing detail views (unchanged)
import { supabase } from "@/lib/supabase";
import type { Selection } from "@/lib/map-store";

export type InsightTarget =
  | { kind: "ranking" }
  | { kind: "area"; cellIds: string[] }
  | { kind: "polygon"; geojson: unknown }
  | { kind: "record"; id: string }
  | { kind: "evidence"; source: "incident" | "place"; id: string }
  | { kind: "legacy"; selection: NonNullable<Selection> };

/** Which insight a map selection opens. Rodent vs other 311 reports are told apart by the server
 *  (record_insight answers evidence for non-rodent ids), so every report routes to "record". */
export function routeSelection(selection: Selection): InsightTarget {
  if (!selection) return { kind: "ranking" };
  switch (selection.kind) {
    case "cell": return { kind: "area", cellIds: [selection.id] };
    case "area": return { kind: "polygon", geojson: selection.geojson };
    case "incident": return { kind: "record", id: selection.id };
    case "place": return selection.id.startsWith("parcel:") ? { kind: "legacy", selection } : { kind: "evidence", source: "place", id: selection.id };
    default: return { kind: "legacy", selection };
  }
}

type Json = Record<string, unknown>;
export type AreaInsight = Json & { kind: "area"; cell_ids: string[]; region_id: string | null; solution: Json | null; can_generate_ai: boolean };
export type RecordInsight = Json & { kind: "record"; incident: Json & { id: string; lat: number; lon: number }; cell_id: string; region_id: string | null };
export type EvidenceInsight = Json & { kind: "evidence"; item: Json & { id: string; lat: number; lon: number }; related_rodent_reports: { id: string }[] };
export type RankingInsight = { kind: "ranking"; regions: Json[] };
export type Insight = AreaInsight | RecordInsight | EvidenceInsight | RankingInsight;

async function rpc<T>(fn: string, args: Json, signal?: AbortSignal): Promise<T | null> {
  let q = supabase.rpc(fn, args);
  if (signal) q = q.abortSignal(signal);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? null) as T | null;
}

/** Load the insight for a target. Returns null for "legacy" targets (rendered by the old detail views)
 *  and when the selected record no longer exists. */
export async function loadInsight(t: InsightTarget, signal?: AbortSignal, limit = 20): Promise<Insight | null> {
  switch (t.kind) {
    case "ranking": {
      const regions = await rpc<Json[]>("insight_ranking", { lim: limit, off: 0 }, signal);
      return { kind: "ranking", regions: regions ?? [] };
    }
    case "area": return rpc<AreaInsight>("area_insight", { cell_ids: t.cellIds }, signal);
    case "polygon": return rpc<AreaInsight>("area_insight_polygon", { geojson: t.geojson }, signal);
    case "record": return rpc<RecordInsight | EvidenceInsight>("record_insight", { incident_id: t.id }, signal);
    case "evidence": return rpc<EvidenceInsight>("evidence_insight", { kind: t.source, id: t.id }, signal);
    case "legacy": return null;
  }
}

export type RankingEntry = {
  position: number; total: number; entry: "region" | "cell"; id: string; rank: number; cell_ids: string[];
  action: string; lane: string; because: string; source: "ai" | "rules"; locations: { id: string; label: string; lat: number; lon: number }[];
  region: { neighborhood?: string | null; severity?: { observed_12w?: number; expected_4w?: number; expected_returns_60d?: number; score?: number } } | null;
};

/** One page of the ranking (infinite scroll): ranked regions first, then the worst lone cells. */
export async function loadRanking(offset: number, limit = 20, signal?: AbortSignal): Promise<{ rows: RankingEntry[]; total: number }> {
  const rows = (await rpc<RankingEntry[]>("insight_ranking", { lim: limit, off: offset }, signal)) ?? [];
  return { rows, total: rows[0]?.total ?? offset };
}

/** Map ids to emphasise for an insight: the area's reports, the related rodent reports of an
 *  evidence item, or the report itself plus the other reports at its address. */
export function highlightIds(i: Insight | null): string[] {
  if (!i) return [];
  if (i.kind === "evidence") return [i.item.id, ...i.related_rodent_reports.map(r => r.id)];
  if (i.kind === "record") {
    const history = ((i.evidence as Json | undefined)?.address_history ?? []) as { id: string }[];
    return [...new Set([i.incident.id, ...history.map(h => h.id)])];
  }
  if (i.kind === "area") {
    const records = ((i.solution?.records ?? []) as { incident_id: string }[]).map(r => r.incident_id);
    return [...new Set(records)];
  }
  return [];
}

/** Where to fly when an insight opens (null = keep the view). */
export function focusOf(i: Insight | null): { lat: number; lon: number; zoom: number } | null {
  if (!i) return null;
  if (i.kind === "record") return { lat: i.incident.lat, lon: i.incident.lon, zoom: 17 };
  if (i.kind === "evidence") return { lat: i.item.lat, lon: i.item.lon, zoom: 17 };
  if (i.kind === "area") {
    const locs = (i.solution?.locations ?? []) as { lat: number; lon: number }[];
    if (!locs.length) return null;
    const lat = locs.reduce((s, l) => s + l.lat, 0) / locs.length, lon = locs.reduce((s, l) => s + l.lon, 0) / locs.length;
    return { lat, lon, zoom: i.cell_ids.length === 1 ? 16 : 15 };
  }
  return null;
}

/** On-demand AI for a cell outside the ranked regions. Goes through the app's server route so the
 *  worker token stays server-side; the result is cached in cell_solutions, so reload the area after. */
export async function generateAreaAi(cellId: string, signal?: AbortSignal): Promise<{ source: string; errors?: string[] }> {
  const res = await fetch("/api/insight-ai", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cell_id: cellId }), signal,
  });
  if (!res.ok) throw new Error(`AI analysis failed (${res.status})`);
  return res.json();
}
