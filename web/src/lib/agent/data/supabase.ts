import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SourceRef } from "../types";
import {
  DataUnavailableError,
  type AgentData,
  type ActionOutcomeRow,
  type IncidentQuery,
  type IncidentRow,
  type PlaceQuery,
  type PlaceRow,
  type SiteQuery,
  type SiteRow,
} from "./types";

// Live adapter: reads public tables with the anon key, so RLS keeps it read-only.
// Spatial filters use the lat/lon columns (box prefilter); tools refine distances.

const INCIDENT_COLS =
  "id,source_id,category,subtype,status,opened_at,closed_at,address_block,zip,neighborhood,action_tag,city,lat,lon";
const PLACE_COLS = "id,source_id,kind,name,address_block,starts_at,ends_at,lat,lon";
const SITE_COLS =
  "id,address_block,zip,neighborhood,score,rank,report_count,recurrence_count,first_at,last_at,summary,recommended,city,lat,lon,computed_at";

type Env = Record<string, string | undefined>;

export function supabaseConfigured(env: Env = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Keep PostgREST `or=(...)` filters well-formed: letters, digits, space, dot, dash only. */
export function safeText(s: string): string {
  return s.replace(/[^\p{L}\p{N} .\-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function createSupabaseData(env: Env = process.env): AgentData {
  if (!supabaseConfigured(env)) throw new DataUnavailableError("Supabase is not configured");
  const db: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

  const fail = (what: string, e: { message: string } | null) => {
    if (e) throw new DataUnavailableError(`${what}: ${e.message}`);
  };

  return {
    async incidents(q: IncidentQuery) {
      let r = db.from("incidents").select(INCIDENT_COLS, { count: "estimated" });
      if (q.categories?.length) r = r.in("category", q.categories);
      if (q.since) r = r.gte("opened_at", q.since);
      if (q.until) r = r.lte("opened_at", `${q.until}T23:59:59Z`);
      if (q.status && q.status !== "all") r = r.eq("status", q.status);
      if (q.addressBlock) r = r.eq("address_block", q.addressBlock);
      if (q.bbox) {
        const [minLon, minLat, maxLon, maxLat] = q.bbox;
        r = r.gte("lon", minLon).lte("lon", maxLon).gte("lat", minLat).lte("lat", maxLat);
      }
      const t = q.text ? safeText(q.text) : "";
      if (t) r = r.or(`address_block.ilike.*${t}*,neighborhood.ilike.*${t}*,zip.eq.${t}`);
      const { data, error, count } = await r.order("opened_at", { ascending: false }).limit(q.limit);
      fail("incidents", error);
      return { rows: (data ?? []) as IncidentRow[], total: count ?? null };
    },

    async places(q: PlaceQuery) {
      const [minLon, minLat, maxLon, maxLat] = q.bbox;
      let r = db.from("places").select(PLACE_COLS)
        .gte("lon", minLon).lte("lon", maxLon).gte("lat", minLat).lte("lat", maxLat);
      if (q.kinds?.length) r = r.in("kind", q.kinds);
      const { data, error } = await r.limit(q.limit);
      fail("places", error);
      return (data ?? []) as PlaceRow[];
    },

    async sites(q: SiteQuery) {
      let r = db.from("sites").select(SITE_COLS);
      if (q.neighborhood) r = r.ilike("neighborhood", `%${safeText(q.neighborhood)}%`);
      if (q.city) r = r.eq("city", q.city);
      if (q.bbox) {
        const [minLon, minLat, maxLon, maxLat] = q.bbox;
        r = r.gte("lon", minLon).lte("lon", maxLon).gte("lat", minLat).lte("lat", maxLat);
      }
      const { data, error } = await r.order("score", { ascending: false }).limit(q.limit);
      fail("sites", error);
      return (data ?? []) as SiteRow[];
    },

    async site(id: string) {
      const { data, error } = await db.from("sites").select(SITE_COLS).eq("id", id).maybeSingle();
      fail("site", error);
      return (data as SiteRow | null) ?? null;
    },

    async sitesByText(text: string, limit: number) {
      const t = safeText(text);
      if (!t) return [];
      const { data, error } = await db.from("sites").select(SITE_COLS)
        .or(`address_block.ilike.*${t}*,neighborhood.ilike.*${t}*,zip.eq.${t}`)
        .order("score", { ascending: false }).limit(limit);
      fail("sites", error);
      return (data ?? []) as SiteRow[];
    },

    async actionOutcomes() {
      const { data, error } = await db.from("action_outcomes").select("action_tag,n,recur_60d_pct,median_days_to_next,computed_at");
      fail("action_outcomes", error);
      return (data ?? []) as ActionOutcomeRow[];
    },

    async sources(ids: string[]) {
      const uniq = [...new Set(ids)].filter(Boolean);
      if (!uniq.length) return [];
      const { data, error } = await db.from("sources").select("id,name,url").in("id", uniq);
      fail("sources", error);
      const found = new Map((data ?? []).map((s) => [s.id as string, s as SourceRef]));
      // An unresolved id is still cited (without a link) so the gap is visible, not hidden.
      return uniq.map((id) => found.get(id) ?? { id, name: null, url: null });
    },
  };
}
