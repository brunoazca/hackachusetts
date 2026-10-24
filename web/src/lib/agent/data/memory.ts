import type { SourceRef } from "../types";
import { inBBox } from "../geo";
import type {
  AgentData,
  ActionOutcomeRow,
  IncidentRow,
  PlaceRow,
  SiteRow,
} from "./types";

// In-memory adapter with the same semantics as the Supabase one. Used by tests
// (with fixtures that live under __tests__) — never wired into the route.

export type MemoryTables = {
  incidents?: IncidentRow[];
  places?: PlaceRow[];
  sites?: SiteRow[];
  action_outcomes?: ActionOutcomeRow[];
  sources?: SourceRef[];
};

const has = (v: string | null, t: string) => (v ?? "").toLowerCase().includes(t.toLowerCase());
const located = <T extends { lat: number | null; lon: number | null }>(r: T) => r.lat != null && r.lon != null;

export function createMemoryData(t: MemoryTables): AgentData {
  const incidents = t.incidents ?? [];
  const sites = t.sites ?? [];
  return {
    async incidents(q) {
      const rows = incidents
        .filter((r) => !q.categories?.length || q.categories.includes(r.category))
        .filter((r) => !q.since || r.opened_at >= q.since)
        .filter((r) => !q.until || r.opened_at.slice(0, 10) <= q.until)
        .filter((r) => !q.status || q.status === "all" || r.status === q.status)
        .filter((r) => !q.addressBlock || r.address_block === q.addressBlock)
        .filter((r) => !q.bbox || (located(r) && inBBox(r.lat!, r.lon!, q.bbox)))
        .filter((r) => !q.text || has(r.address_block, q.text) || has(r.neighborhood, q.text) || r.zip === q.text)
        .sort((a, b) => b.opened_at.localeCompare(a.opened_at));
      return { rows: rows.slice(0, q.limit), total: rows.length };
    },
    async places(q) {
      return (t.places ?? [])
        .filter((r) => located(r) && inBBox(r.lat!, r.lon!, q.bbox))
        .filter((r) => !q.kinds?.length || q.kinds.includes(r.kind))
        .slice(0, q.limit);
    },
    async sites(q) {
      return sites
        .filter((s) => !q.neighborhood || has(s.neighborhood, q.neighborhood))
        .filter((s) => !q.city || s.city === q.city)
        .filter((s) => !q.bbox || (located(s) && inBBox(s.lat!, s.lon!, q.bbox)))
        .sort((a, b) => b.score - a.score)
        .slice(0, q.limit);
    },
    async site(id) {
      return sites.find((s) => s.id === id) ?? null;
    },
    async sitesByText(text, limit) {
      return sites
        .filter((s) => has(s.address_block, text) || has(s.neighborhood, text) || s.zip === text)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
    async actionOutcomes() {
      return t.action_outcomes ?? [];
    },
    async sources(ids) {
      const uniq = [...new Set(ids)].filter(Boolean);
      return uniq.map((id) => (t.sources ?? []).find((s) => s.id === id) ?? { id, name: null, url: null });
    },
  };
}
