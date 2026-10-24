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
  score: number;
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
};

export type ActionOutcomeRow = {
  action_tag: string;
  n: number;
  recur_60d_pct: number;
  median_days_to_next: number | null;
  computed_at: string | null;
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

export type SiteQuery = { limit: number; neighborhood?: string; bbox?: BBox; city?: string };

export interface AgentData {
  /** Incidents matching the query, newest first, at most `limit`; `total` is the full match count when known. */
  incidents(q: IncidentQuery): Promise<{ rows: IncidentRow[]; total: number | null }>;
  places(q: PlaceQuery): Promise<PlaceRow[]>;
  sites(q: SiteQuery): Promise<SiteRow[]>;
  site(id: string): Promise<SiteRow | null>;
  /** Sites whose address_block / neighborhood / zip contains text. */
  sitesByText(text: string, limit: number): Promise<SiteRow[]>;
  actionOutcomes(): Promise<ActionOutcomeRow[]>;
  sources(ids: string[]): Promise<SourceRef[]>;
}

export class DataUnavailableError extends Error {}
