import type { BBox, SourceRef } from "../types";

// Read-only data access for the agent tools. The live implementation reads
// Supabase tables through PostgREST (anon key, RLS public read); tests use the
// in-memory adapter. When the agent_* RPCs from design §6 exist, add them
// behind this same interface without touching the tools.

/** Public columns only. No closure_note: the scrub of staff names is P1 (task 1.11). */
export type IncidentRow = {
  id: string;
  source_id: string;
  category: string;
  subtype: string | null;
  status: string;
  opened_at: string;
  closed_at: string | null;
  address_block: string | null;
  zip: string | null;
  neighborhood: string | null;
  action_tag: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
};

export type PlaceRow = {
  id: string;
  source_id: string;
  kind: string;
  name: string | null;
  address_block: string | null;
  starts_at: string | null;
  ends_at: string | null;
  lat: number | null;
  lon: number | null;
};

export type SiteRow = {
  id: string;
  address_block: string;
  zip: string | null;
  neighborhood: string | null;
  /** Legacy composite score only; null for v2 clusters and provisional draft sites. */
  score: number | null;
  rank: number | null;
  report_count: number;
  recurrence_count: number;
  first_at: string | null;
  last_at: string | null;
  summary: Record<string, unknown>;
  recommended: unknown[];
  city: string | null;
  lat: number | null;
  lon: number | null;
  computed_at: string | null;
  /** true when the row comes from the map track's draft queue, not the Analytics `sites` table. */
  provisional?: boolean;
  /** Exact rodent reports at the site, when the source provides them (draft site_detail). */
  reports?: { id: string; opened_at: string; closed_at: string | null; status: string; action_tag: string | null }[];
};

export type ActionOutcomeRow = {
  action_tag: string;
  n: number;
  recur_60d_pct: number;
  median_days_to_next: number | null;
  computed_at: string | null;
  /** Optional until Analytics' additive migration is installed. Intervals are in percent. */
  n_recurred?: number | null;
  n_censored?: number | null;
  window_days?: number | null;
  observed_through?: string | null;
  ci_low?: number | null;
  ci_high?: number | null;
  by_year?: Record<string, { n: number; recurred: number }>;
  source_ids?: string[];
};

export type IncidentQuery = {
  categories?: string[];
  since?: string;
  until?: string;
  status?: "all" | "open" | "closed";
  bbox?: BBox;
  /** Case-insensitive substring of address_block / neighborhood / zip. */
  text?: string;
  /** Exact address_block match (site timelines). */
  addressBlock?: string;
  limit: number;
};

export type PlaceQuery = { bbox: BBox; kinds?: string[]; limit: number };

export type SiteQuery = { due?: boolean; limit: number; neighborhood?: string; bbox?: BBox; city?: string };

export interface AgentData {
  /** Same read-only summary used by the Insights panel. */
  insightsSummary(): Promise<unknown>;
  /** Incidents matching the query, newest first, at most `limit`; `total` is the full match count when known. */
  incidents(q: IncidentQuery): Promise<{ rows: IncidentRow[]; total: number | null }>;
  /** Incidents by primary key (public columns), any order. */
  incidentsByIds(ids: string[]): Promise<IncidentRow[]>;
  places(q: PlaceQuery): Promise<PlaceRow[]>;
  sites(q: SiteQuery): Promise<SiteRow[]>;
  site(id: string): Promise<SiteRow | null>;
  /** Sites whose address_block / neighborhood / zip contains text. */
  sitesByText(text: string, limit: number): Promise<SiteRow[]>;
  actionOutcomes(): Promise<ActionOutcomeRow[]>;
  sources(ids: string[]): Promise<SourceRef[]>;
  /** Row counts of the tables the Analytics track fills (sites, action_outcomes). */
  analyticsCounts(): Promise<{ sites: number; action_outcomes: number }>;
  /** Where sites come from: Analytics table, the map track's draft queue RPC, or nowhere yet. */
  siteSource(): Promise<"analytics" | "draft" | "none">;
}

/**
 * Why a lookup could not be answered. "analytics_not_computed" = the table
 * exists and is readable but the Analytics track has not filled it yet.
 */
export type FailureReason =
  | "not_configured" | "connection" | "permission" | "missing_table" | "query" | "analytics_not_computed";

export class DataUnavailableError extends Error {
  constructor(message: string, readonly reason: FailureReason = "query") {
    super(message);
  }
}
