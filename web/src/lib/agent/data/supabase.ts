import { readRegions } from "./regions";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SourceRef } from "../types";
import {
  DataUnavailableError,
  type AgentData,
  type FailureReason,
  type ActionOutcomeRow,
  type IncidentQuery,
  type IncidentRow,
  type PlaceQuery,
  type PlaceRow,
  type SiteQuery,
  type SiteRow,
} from "./types";

// Live adapter: SELECT and GET RPCs only, using the anon key and public RLS.
// Spatial filters use the lat/lon columns (box prefilter); tools refine distances.

const INCIDENT_COLS =
  "id,source_id,category,subtype,status,opened_at,closed_at,address_block,zip,neighborhood,action_tag,city,lat,lon";
const PLACE_COLS = "id,source_id,kind,name,address_block,starts_at,ends_at,lat,lon";
const SITE_COLS =
  "id,address_block,zip,neighborhood,score,rank,report_count,recurrence_count,first_at,last_at,summary,recommended,city,lat,lon,computed_at";

const V2_DEFINITION = "dbscan_50m_min3_v2";
// Queue reads omit notes, geometry and full histories. Fetch all matching pages
// before applying the clock-dependent Due predicate and the caller's limit.
const V2_LIST_COLS = "id,address_block,zip,neighborhood,rank,report_count,recurrence_count,first_at,last_at,city,lat,lon,computed_at,definition:summary->>definition,source_ids:summary->source_ids,closures:summary->closures,returns_12mo:summary->returns_12mo,last_closed_at:summary->>last_closed_at,base_rate:summary->base_rate,due_threshold:summary->due_threshold,retired:summary->retired";

function calendarDay(value: Date): number {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(value);
  return Date.parse(day + "T00:00:00Z") / 86400000;
}

function currentSite(row: SiteRow, now: Date): SiteRow {
  if (row.summary.definition !== V2_DEFINITION) return row;
  const closed = new Date(String(row.summary.last_closed_at ?? ""));
  const days = Number.isFinite(closed.getTime()) ? calendarDay(now) - calendarDay(closed) : null;
  const base = row.summary.base_rate as { n?: number; rate?: number } | null;
  const threshold = typeof row.summary.due_threshold === "number" ? row.summary.due_threshold : 0.5;
  const due = row.rank != null && !row.summary.retired && days != null && days >= 0 && days <= 60
    && typeof base?.n === "number" && base.n > 0 && typeof base.rate === "number" && base.rate >= threshold;
  return { ...row, score: null, summary: { ...row.summary, due, last_closed: row.summary.last_closed_at ?? null, days_since_close: days } };
}

function queueOrder(a: SiteRow, b: SiteRow): number {
  return Number(Boolean(b.summary.due)) - Number(Boolean(a.summary.due))
    || Number(b.summary.returns_12mo ?? b.recurrence_count) - Number(a.summary.returns_12mo ?? a.recurrence_count)
    || b.report_count - a.report_count || (b.last_at ?? "").localeCompare(a.last_at ?? "") || a.id.localeCompare(b.id);
}

type Env = Record<string, string | undefined>;

export function supabaseConfigured(env: Env = process.env): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Keep PostgREST `or=(...)` filters well-formed: letters, digits, space, dot, dash only. */
export function safeText(s: string): string {
  return s.replace(/[^\p{L}\p{N} .\-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

type PgError = { message: string; code?: string };

// Shapes returned by the map track's draft RPCs. last_note / note (raw closure
// notes) are deliberately not mapped: they may contain staff names (task 1.11).
type DraftSite = {
  id: string; address_block: string | null; neighborhood: string | null; city: string;
  lat: number; lon: number; reports: number; closures: number; returns: number;
  first_at: string; last_at: string; due: boolean; last_closed: string | null; days_since_close: number | null;
};
const DRAFT_SITE_COLS = "id,address_block,neighborhood,city,lat,lon,reports,closures,returns,first_at,last_at,due,last_closed,days_since_close";

type DraftDetail = {
  site: DraftSite;
  reports: { id: string; opened: string; closed: string | null; status: string; action: string | null }[];
  drivers_100m_12mo: Record<string, number>;
  adjacent_vacant_parcels: number | null;
  source_ids: string[];
};

function fromDraft(d: DraftSite, i = 0): SiteRow {
  return {
    id: d.id, address_block: d.address_block ?? "unknown block", zip: d.address_block?.match(/\b\d{5}\b/)?.[0] ?? null,
    neighborhood: d.neighborhood, score: null, rank: null, report_count: d.reports, recurrence_count: d.returns,
    first_at: d.first_at, last_at: d.last_at, city: d.city, lat: d.lat, lon: d.lon, computed_at: null,
    summary: { due: d.due, due_for_follow_up: d.due, last_closed: d.last_closed, days_since_close: d.days_since_close, closures: d.closures, queue_position: i + 1 }, recommended: [], provisional: true,
  };
}

function fromDraftDetail(x: DraftDetail): SiteRow {
  return {
    ...fromDraft(x.site),
    summary: {
      due: x.site.due, due_for_follow_up: x.site.due, last_closed: x.site.last_closed, days_since_close: x.site.days_since_close, closures: x.site.closures,
      drivers: Object.entries(x.drivers_100m_12mo ?? {}).map(([category, n]) => ({ category, n, radius_m: 100, window: "12 months" })),
      adjacent_vacant: (x.adjacent_vacant_parcels ?? 0) > 0, adjacent_vacant_parcels: x.adjacent_vacant_parcels,
      source_ids: x.source_ids,
    },
    reports: x.reports.map((r) => ({ id: r.id, opened_at: r.opened, closed_at: r.closed, status: r.status, action_tag: r.action })),
  };
}

/** PostgREST / Postgres error → why the lookup failed. */
export function classifyError(e: PgError): FailureReason {
  const code = e.code ?? "";
  if (code === "42501" || code === "PGRST301" || code === "PGRST302" || /permission denied|JWT|apikey/i.test(e.message)) return "permission";
  if (code === "PGRST205" || code === "42P01" || /does not exist|could not find the table/i.test(e.message)) return "missing_table";
  if (!code && /fetch failed|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|Failed to fetch/i.test(e.message)) return "connection";
  return "query";
}

export function createSupabaseData(env: Env = process.env, now: () => Date = () => new Date()): AgentData {
  if (!supabaseConfigured(env)) throw new DataUnavailableError("Supabase is not configured", "not_configured");
  const db: SupabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

  const fail = (what: string, e: PgError | null) => {
    if (e) throw new DataUnavailableError(`${what}: ${e.message}`, classifyError(e));
  };

  // Analytics `sites` first; while it is empty, the map track's draft queue
  // (site_queue / site_detail RPCs, migration 20261024300002) so ids match the Act UI.
  let source: Promise<"analytics" | "draft" | "none"> | null = null;
  const siteSource = () => (source ??= (async () => {
    const { count, error } = await db.from("sites").select("id", { count: "exact", head: true }).not("rank", "is", null);
    fail("sites", error);
    if (count) return "analytics";
    const probe = await db.rpc("site_queue", { lim: 1 }, { get: true });
    // Only an absent optional RPC means "not available yet". Permission,
    // connection and query failures must keep their actual reason.
    if (probe.error?.code === "PGRST202") return "none";
    fail("site_queue", probe.error);
    return probe.data?.length ? "draft" : "none";
  })());

  let v2: Promise<boolean> | null = null;
  const hasV2Sites = () => (v2 ??= (async () => {
    const { count, error } = await db.from("sites").select("id", { count: "exact", head: true })
      .eq("summary->>definition", V2_DEFINITION).not("rank", "is", null);
    fail("v2 sites", error);
    return Boolean(count);
  })());

  async function v2Sites(q: SiteQuery, text?: string): Promise<SiteRow[]> {
    const rows: SiteRow[] = [];
    const at = now();
    let offset = 0;
    for (;;) {
      let r = db.from("sites").select(V2_LIST_COLS, { count: "exact" })
        .eq("summary->>definition", V2_DEFINITION).not("rank", "is", null);
      if (q.neighborhood) r = r.ilike("neighborhood", `%${safeText(q.neighborhood)}%`);
      if (q.city) r = r.eq("city", q.city);
      if (q.bbox) r = r.gte("lon", q.bbox[0]).lte("lon", q.bbox[2]).gte("lat", q.bbox[1]).lte("lat", q.bbox[3]);
      if (text) r = r.or(`address_block.ilike.*${text}*,neighborhood.ilike.*${text}*,zip.eq.${text}`);
      const { data, error, count } = await r.order("id").range(offset, offset + 199);
      fail("v2 sites", error);
      if (count == null) throw new DataUnavailableError("V2 queue count unavailable; refusing a potentially truncated result.", "query");
      for (const value of data ?? []) {
        const row = value as unknown as SiteRow & Record<string, unknown>;
        const summary = Object.fromEntries(["definition", "source_ids", "closures", "returns_12mo", "last_closed_at", "base_rate", "due_threshold", "retired"].map(k => [k, row[k]]));
        rows.push(currentSite({ ...row, score: null, summary, recommended: [] }, at));
      }
      offset += data?.length ?? 0;
      if (offset >= count) break;
      if (!data?.length) throw new DataUnavailableError("V2 queue changed while paging; retry the query.", "query");
    }
    return rows.filter(s => !s.summary.retired && (q.due == null || s.summary.due === q.due)).sort(queueOrder).slice(0, q.limit);
  }

  async function draftSites(q: SiteQuery, text?: string): Promise<SiteRow[]> {
    // The same read-only function behind site_queue, filtered before LIMIT.
    // Filtering a capped citywide queue locally can silently miss valid sites.
    let r = db.rpc("draft_sites", {}, { get: true }).select(DRAFT_SITE_COLS);
    if (q.due != null) r = r.eq("due", q.due);
    if (q.neighborhood) r = r.ilike("neighborhood", `%${safeText(q.neighborhood)}%`);
    if (q.city) r = r.eq("city", q.city);
    if (q.bbox) {
      const [minLon, minLat, maxLon, maxLat] = q.bbox;
      r = r.gte("lon", minLon).lte("lon", maxLon).gte("lat", minLat).lte("lat", maxLat);
    }
    // Draft RPC has no zip column; address_block includes the ZIP.
    if (text) r = r.or(`address_block.ilike.*${text}*,neighborhood.ilike.*${text}*`);
    const { data, error } = await r.order("due", { ascending: false })
      .order("returns", { ascending: false }).order("reports", { ascending: false })
      .order("last_at", { ascending: false }).order("id").limit(q.limit);
    fail("draft_sites", error);
    return ((data ?? []) as DraftSite[]).map(fromDraft);
  }

  return {
    async regionInsights() { return readRegions(db); },
    async regionLocation(id) {
      const { data, error } = await db.rpc("cell_detail", { cell_id: id }, { get: true });
      if (error) throw new Error("Region coordinates are unavailable.");
      return data?.cell ?? null;
    },
    async insightRpc(fn, args) {
      const { data, error } = await db.rpc(fn, args);
      fail(fn, error);
      return data;
    },
    async insightsSummary() {
      const { data, error } = await db.rpc("insights_summary", undefined, { get: true });
      fail("insights_summary", error);
      return data;
    },
    async incidents(q: IncidentQuery) {
      let r = db.from("incidents").select(INCIDENT_COLS, { count: "exact" });
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

    async incidentsByIds(ids: string[]) {
      if (!ids.length) return [];
      const rows: IncidentRow[] = [];
      const unique = [...new Set(ids)];
      for (let start = 0; start < unique.length; start += 100) {
        const { data, error } = await db.from("incidents").select(INCIDENT_COLS).in("id", unique.slice(start, start + 100));
        fail("incidents", error);
        rows.push(...((data ?? []) as IncidentRow[]));
      }
      return rows;
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

    siteSource,

    async placesByText(text: string, limit: number) {
      const query = safeText(text);
      if (!query) return [];
      const { data, error } = await db.from("places").select(PLACE_COLS)
        .ilike("name", `%${query}%`).not("lat", "is", null).not("lon", "is", null)
        .order("name").limit(limit);
      fail("places", error);
      return (data ?? []) as PlaceRow[];
    },

    async sites(q: SiteQuery) {
      if ((await siteSource()) === "draft") {
        return draftSites(q);
      }
      if (await hasV2Sites()) return v2Sites(q);
      let r = db.from("sites").select(SITE_COLS).not("rank", "is", null);
      if (q.due != null) {
        const ready = await db.from("sites").select("id").not("summary->due", "is", null).limit(1);
        fail("sites due", ready.error);
        if (!ready.data?.length) throw new DataUnavailableError("Due flags have not been computed yet (Analytics task 2.19).", "analytics_not_computed");
        r = r.eq("summary->>due", String(q.due));
      }
      if (q.neighborhood) r = r.ilike("neighborhood", `%${safeText(q.neighborhood)}%`);
      if (q.city) r = r.eq("city", q.city);
      if (q.bbox) {
        const [minLon, minLat, maxLon, maxLat] = q.bbox;
        r = r.gte("lon", minLon).lte("lon", maxLon).gte("lat", minLat).lte("lat", maxLat);
      }
      const { data, error } = await r.order(q.due ? "recurrence_count" : "score", { ascending: false }).order("id").limit(q.limit);
      fail("sites", error);
      return (data ?? []) as SiteRow[];
    },

    async site(id: string) {
      // Historical clusters remain readable even if the active queue is still draft.
      const { data, error } = await db.from("sites").select(SITE_COLS).eq("id", id).maybeSingle();
      fail("site", error);
      if (data) return currentSite(data as SiteRow, now());
      // An already-selected draft ID can survive the switch to v2 Analytics.
      const legacy = await db.rpc("site_detail", { site_id: id }, { get: true });
      if (legacy.error?.code === "PGRST202") return null;
      fail("site_detail", legacy.error);
      return legacy.data ? fromDraftDetail(legacy.data as DraftDetail) : null;
    },

    async sitesByText(text: string, limit: number) {
      const t = safeText(text);
      if (!t) return [];
      if ((await siteSource()) === "draft") {
        return draftSites({ limit }, t);
      }
      if (await hasV2Sites()) return v2Sites({ limit }, t);
      const { data, error } = await db.from("sites").select(SITE_COLS).not("rank", "is", null)
        .or(`address_block.ilike.*${t}*,neighborhood.ilike.*${t}*,zip.eq.${t}`)
        .order("score", { ascending: false }).limit(limit);
      fail("sites", error);
      return (data ?? []) as SiteRow[];
    },

    async actionOutcomes() {
      // This table contains aggregate analytics only. Read both schema versions,
      // then allowlist fields so A's optional intervals/censoring are preserved
      // without requiring its migration on the shared database.
      const { data, error } = await db.from("action_outcomes").select("*");
      fail("action_outcomes", error);
      return (data ?? []).map((r): ActionOutcomeRow => ({
        action_tag: r.action_tag, n: r.n, recur_60d_pct: r.recur_60d_pct,
        median_days_to_next: r.median_days_to_next, computed_at: r.computed_at,
        n_recurred: r.n_recurred, n_censored: r.n_censored, window_days: r.window_days,
        observed_through: r.observed_through, ci_low: r.ci_low, ci_high: r.ci_high,
        by_year: r.by_year, source_ids: r.source_ids,
      }));
    },

    async analyticsCounts() {
      const [s, a] = await Promise.all([
        db.from("sites").select("id", { count: "exact", head: true }),
        db.from("action_outcomes").select("action_tag", { count: "exact", head: true }),
      ]);
      fail("sites", s.error);
      fail("action_outcomes", a.error);
      return { sites: s.count ?? 0, action_outcomes: a.count ?? 0 };
    },

    async sources(ids: string[]) {
      const uniq = [...new Set(ids)].filter(Boolean);
      if (!uniq.length) return [];
      const { data, error } = await db.from("sources").select("id,name,url,retrieved_at,update_mode,update_note").in("id", uniq);
      fail("sources", error);
      const found = new Map((data ?? []).map((s) => [s.id as string, s as SourceRef]));
      // An unresolved id is still cited (without a link) so the gap is visible, not hidden.
      return uniq.map((id) => found.get(id) ?? { id, name: null, url: null });
    },
  };
}
