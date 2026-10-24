import { supabase } from "@/lib/supabase";
import type { FeatureCollection, Point } from "geojson";

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
