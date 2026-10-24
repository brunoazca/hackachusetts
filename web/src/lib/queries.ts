import { supabase } from "@/lib/supabase";
import type { SiteRow } from "@/lib/map-store";
import type { FeatureCollection, FeatureCollection as AnyFC, Point } from "geojson";

// Draft typed wrappers over the read-only RPCs (supabase/migrations/*_api_*.sql).

export type IncidentProps = {
  id: string;
  category: string;
  status: "open" | "closed";
  opened: string;
  city: string;
  approx: boolean;
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
  source: { id: string; name: string; url: string; retrieved_at: string; update_mode: "live" | "daily" | "static"; update_note: string | null };
  same_address: { id: string; category: string; status: string; opened: string; closed: string | null; note: string | null }[];
};

export async function fetchIncidentDetail(id: string): Promise<IncidentDetail | null> {
  const { data, error } = await supabase.rpc("incident_detail", { incident_id: id });
  if (error) throw error;
  return data as IncidentDetail | null;
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
};

export async function fetchSiteDetail(id: string): Promise<SiteDetail | null> {
  const { data, error } = await supabase.rpc("site_detail", { site_id: id });
  if (error) throw error;
  return data as SiteDetail | null;
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
