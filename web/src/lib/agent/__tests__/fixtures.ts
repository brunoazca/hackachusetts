import type { MemoryTables } from "../data/memory";
import type { IncidentRow, SiteRow } from "../data/types";

// TEST FIXTURES ONLY. Synthetic rows with "fixture-" ids, shaped like the
// schema; they are never imported by the route or the UI.

export const NOW = new Date("2026-10-24T15:00:00Z");

const inc = (o: Partial<IncidentRow> & Pick<IncidentRow, "id" | "category" | "opened_at">): IncidentRow => ({
  source_id: "fixture-311",
  subtype: null,
  status: "closed",
  closed_at: null,
  address_block: "Fixture St, 02121",
  zip: "02121",
  neighborhood: "Dorchester",
  action_tag: null,
  city: "boston",
  lat: 42.3051,
  lon: -71.0712,
  ...o,
});

const site: SiteRow = {
  id: "fixture-site-1",
  address_block: "Fixture St, 02121",
  zip: "02121",
  neighborhood: "Dorchester",
  score: 91.5,
  rank: 1,
  report_count: 3,
  recurrence_count: 2,
  first_at: "2026-03-01T00:00:00Z",
  last_at: "2026-10-01T00:00:00Z",
  summary: { why: "fixture why", drivers: [{ category: "trash_storage", n: 1 }], recur_p: 0.7, source_ids: ["fixture-parcels"] },
  recommended: [{ action: "abatement_order", owner: "ISD", because: ["fixture reason"], source_ids: ["fixture-311"] }],
  city: "boston",
  lat: 42.3051,
  lon: -71.0712,
  computed_at: "2026-10-24T10:00:00Z",
};

export const tables: MemoryTables = {
  incidents: [
    inc({ id: "fixture-inc-1", category: "rodent", opened_at: "2026-03-01T12:00:00Z", closed_at: "2026-03-05T12:00:00Z", action_tag: "baiting" }),
    inc({ id: "fixture-inc-2", category: "rodent", opened_at: "2026-06-01T12:00:00Z", closed_at: "2026-06-03T12:00:00Z", action_tag: "citation" }),
    inc({ id: "fixture-inc-3", category: "rodent", opened_at: "2026-10-01T12:00:00Z", status: "open", address_block: "12 Fixture St, 02121" }),
    inc({ id: "fixture-inc-4", category: "trash_storage", opened_at: "2026-09-01T12:00:00Z", lat: 42.3052, lon: -71.0713 }),
    inc({ id: "fixture-inc-5", category: "dumping", opened_at: "2026-09-02T12:00:00Z", lat: 42.32, lon: -71.05 }), // ~2 km away
  ],
  places: [
    { id: "fixture-place-1", source_id: "fixture-parcels", kind: "vacant_parcel", name: null, address_block: "Fixture St, 02121", starts_at: null, ends_at: null, lat: 42.3053, lon: -71.0711 },
  ],
  sites: [site, { ...site, id: "fixture-site-2", address_block: "Other Fixture Ave, 02119", neighborhood: "Roxbury", score: 40, rank: 2, lat: 42.33, lon: -71.08, summary: {}, recommended: [] }],
  action_outcomes: [
    { action_tag: "baiting", n: 400, recur_60d_pct: 31.0, median_days_to_next: 20, computed_at: null },
    { action_tag: "abatement_order", n: 12, recur_60d_pct: 18.0, median_days_to_next: 45, computed_at: null },
  ],
  sources: [
    { id: "fixture-311", name: "Fixture 311", url: "https://example.org/fixture-311" },
    { id: "fixture-parcels", name: "Fixture parcels", url: null },
  ],
};
