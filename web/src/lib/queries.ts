import { supabase } from "@/lib/supabase";
import type { SiteRow } from "@/lib/map-store";
import { sourcesFor, type SiteEvidence, type SourceEvidence } from "@/lib/evidence";
import type { FeatureCollection, FeatureCollection as AnyFC, Point } from "geojson";

// Draft typed wrappers over the read-only RPCs (supabase/migrations/*_api_*.sql).

export type IncidentProps = {
  id?: string;
  category: string;
  status?: "open" | "closed";
  opened?: string;
  city?: string;
  approx?: boolean;
  // present on aggregated features (zoomed out)
  n?: number;
  n_open?: number;
  newest?: string;
  /** Client-side: several reports folded into one marker at the same spot. */
  spot?: boolean;
  /** Client-side: family (rats, food, shelter, displace) for cluster colors. */
  group?: string;
};

export type BBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

export async function fetchIncidents(
  bbox: BBox,
  categories: string[],
  since: string,
  until: string,
): Promise<FeatureCollection<Point, IncidentProps>> {
  const [min_lon, min_lat, max_lon, max_lat] = bbox;
  const { data, error } = await supabase.rpc("map_incidents", {
    min_lon, min_lat, max_lon, max_lat, categories, since, until, max_rows: 20000,
  });
  if (error) throw error;
  return data as FeatureCollection<Point, IncidentProps>;
}

export type IncidentDetail = {
  incident: {
    id: string; category: string; subtype: string | null; status: string; opened_at: string; closed_at: string | null;
    address_block: string | null; zip: string | null; neighborhood: string | null; closure_note: string | null;
    action_tag: string | null; city: string; geo_precision: string;
  };
  source: SourceEvidence;
  same_address: { id: string; category: string; status: string; opened: string; closed: string | null; note: string | null }[];
};

export async function fetchIncidentDetail(id: string): Promise<IncidentDetail | null> {
  const { data, error } = await supabase.rpc("incident_detail", { incident_id: id });
  if (error) throw error;
  const detail = data as IncidentDetail | null;
  if (detail) detail.source = (await fetchSources([detail.source.id]))[0] ?? detail.source;
  return detail;
}

export type LiveStatus = { updatedAt: string | null };

export async function fetchLiveStatus(): Promise<LiveStatus> {
  const res = await fetch("/api/refresh", { cache: "no-store" });
  if (!res.ok) return { updatedAt: null };
  return res.json();
}

// ---- Act mode (draft site RPCs; switch to the analytics `sites` table when it lands) ----

export async function fetchSiteQueue(limit = 50, neighborhood: string | null = null): Promise<SiteRow[]> {
  const { data, error } = await supabase.rpc("site_queue", { lim: limit, hood: neighborhood });
  if (error) throw error;
  return (data ?? []) as SiteRow[];
}

export type SiteDetail = {
  site: SiteRow;
  reports: { id: string; opened: string; closed: string | null; status: string; note: string | null; action: string | null }[];
  drivers_100m_12mo: Record<string, number>;
  adjacent_vacant_parcels: number;
  source_ids: string[];
  evidence?: SiteEvidence;
  report_sources?: SourceEvidence[];
  /** Older deployments can still display records without claiming unsupported provenance. */
  evidence_unavailable?: boolean;
};

export async function fetchSiteDetail(id: string): Promise<SiteDetail | null> {
  const [{ data, error }, evidenceResult] = await Promise.all([
    supabase.rpc("site_detail", { site_id: id }),
    supabase.rpc("site_evidence", { site_id: id }),
  ]);
  if (error) throw error;
  if (!data) return null;
  const detail = data as SiteDetail;
  if (!evidenceResult.error && evidenceResult.data) {
    detail.evidence = evidenceResult.data as SiteEvidence;
    detail.report_sources = sourcesFor(detail.evidence.report_source_ids, detail.evidence.sources);
    // Counts and citations come from the same spatial query and snapshot.
    detail.drivers_100m_12mo = Object.fromEntries(detail.evidence.nearby.map((r) => [r.category, r.count]));
    detail.adjacent_vacant_parcels = detail.evidence.vacant.count;
  } else {
    detail.evidence_unavailable = true;
    // Never use site_detail's legacy, hard-coded Boston source_ids. Resolve actual records.
    const ids = detail.reports.map((r) => r.id);
    const sourceIds = new Set<string>();
    for (let start = 0; start < ids.length; start += 100) {
      const result = await supabase.from("incidents").select("source_id").in("id", ids.slice(start, start + 100));
      if (result.error) { sourceIds.clear(); break; }
      for (const row of result.data ?? []) sourceIds.add(row.source_id);
    }
    detail.report_sources = await fetchSources([...sourceIds]);
  }
  return detail;
}

/** A source's metadata retrieval and its last successful ingest are separate facts. */
export async function fetchSources(ids: string[]): Promise<SourceEvidence[]> {
  const unique = [...new Set(ids)];
  if (!unique.length) return [];
  const [metadata, runs] = await Promise.all([
    supabase.from("sources").select("id,name,url,retrieved_at,update_mode,update_note").in("id", unique),
    Promise.all(unique.map(async (id) => {
      const { data } = await supabase.from("ingest_runs")
        .select("finished_at,newest_record_at").eq("source_id", id).eq("ok", true)
        .not("finished_at", "is", null).order("finished_at", { ascending: false }).limit(1).maybeSingle();
      return { id, data };
    })),
  ]);
  return sourcesFor(unique, (metadata.data ?? []) as SourceEvidence[]).map((s) => {
    const run = runs.find((r) => r.id === s.id)?.data;
    return { ...s, last_success_at: run?.finished_at ?? null, newest_record_at: run?.newest_record_at ?? null };
  });
}

// ---- Coverage + context layers ----

export type CoverageRow = { kind: string; layer: string; city: string; rows: number; first_date: string | null; last_date: string | null; update_mode: string };

export async function fetchCoverage(): Promise<CoverageRow[]> {
  const { data, error } = await supabase.rpc("coverage_matrix");
  if (error) throw error;
  return (data ?? []) as CoverageRow[];
}

export async function fetchCityBoundaries(): Promise<AnyFC> {
  const { data, error } = await supabase.rpc("city_boundaries");
  if (error) throw error;
  return data as AnyFC;
}

export async function fetchTracts(): Promise<AnyFC> {
  const { data, error } = await supabase.rpc("map_tracts");
  if (error) throw error;
  return data as AnyFC;
}

export async function fetchParcels(bbox: BBox): Promise<AnyFC> {
  const [min_lon, min_lat, max_lon, max_lat] = bbox;
  const { data, error } = await supabase.rpc("map_parcels", { min_lon, min_lat, max_lon, max_lat, max_rows: 6000 });
  if (error) throw error;
  return data as AnyFC;
}

/** Zoomed-out data: one feature per (category, cell) with n / n_open — never truncated. */
export async function fetchIncidentBins(
  bbox: BBox, categories: string[], since: string, until: string, cell: number,
): Promise<FeatureCollection<Point, IncidentProps>> {
  const [min_lon, min_lat, max_lon, max_lat] = bbox;
  const { data, error } = await supabase.rpc("map_incident_bins", {
    min_lon, min_lat, max_lon, max_lat, categories, since, until, cell,
  });
  if (error) throw error;
  return data as FeatureCollection<Point, IncidentProps>;
}
