import { tool } from "ai";
import { z } from "zod";
import categories from "../../categories.json";
import { bboxAround, bboxOf, distanceM, stripHouseNumber } from "../geo";
import { placeQuery, type PlaceLookup } from "../geocoder";
import type { FeatureRef, SourceRef, ToolFailure, ToolResult } from "../types";
import { DataUnavailableError, type AgentData, type FailureReason, type IncidentRow, type SiteRow } from "../data/types";

const FAILURE_TEXT: Record<FailureReason, string> = {
  not_configured: "not configured",
  connection: "could not reach the database",
  permission: "no permission to read",
  missing_table: "table missing",
  query: "query error",
  analytics_not_computed: "analytics not computed",
};

// Server-side tools (task 4.2). Each one reads through AgentData, returns
// {data, sources, features, caveats} so the UI can render chips, and returns
// {ok:false, error} instead of throwing so the model can say what failed.

const CATEGORY_IDS = Object.keys(categories.incident_categories) as [string, ...string[]];
const ACTION_IDS = Object.keys(categories.actions) as [string, ...string[]];
// Historical action tags remain searchable, but are not all valid next actions.
const DRAFT_ACTION_IDS = ["monitoring", "inspection", "warning", "citation", "abatement_order", "collections", "referral", "cleanup", "barrels"] as const;
const prohibitedRecommendation = /\b(?:rodenticides?|poisons?|pesticides?|bait(?:ing|s)?|exterminat\w*)\b/i;
function recommendationAction(r: unknown): string | undefined {
  if (!r || typeof r !== "object") return undefined;
  const value = r as { action?: unknown; action_tag?: unknown };
  // Analytics uses action for display text and action_tag for the machine id.
  // Older rows used action for both; an explicit unknown tag must not fall back.
  const tag = value.action_tag ?? value.action;
  return typeof tag === "string" ? tag : undefined;
}
function permittedRecommendation(r: unknown): boolean {
  const tag = recommendationAction(r);
  return Boolean(tag && (DRAFT_ACTION_IDS as readonly string[]).includes(tag) && !prohibitedRecommendation.test(JSON.stringify(r)));
}
const PLACE_KINDS = Object.keys(categories.place_kinds);
const DRIVER_CATEGORIES = CATEGORY_IDS.filter((c) => c !== "rodent" && c !== "rodent_program");

const categoryLabel = (id: string) =>
  (categories.incident_categories as Record<string, { label: string }>)[id]?.label ?? id;
const placeLabel = (id: string) => (categories.place_kinds as Record<string, { label: string }>)[id]?.label ?? id;
const action = (id: string) =>
  (categories.actions as Record<string, { label: string; owner: string }>)[id] ?? { label: id, owner: "—" };

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
const lat = z.number().min(41.9).max(42.7);
const lon = z.number().min(-71.5).max(-70.7);

export type ServerToolOptions = {
  /** null when Supabase is not configured: every tool then reports that, never fixture data. */
  data: AgentData | null;
  now?: () => Date;
  lookupPlace?: PlaceLookup;
};

type Out<T> = ToolResult<T> | ToolFailure;

function countBy<T>(rows: T[], key: (r: T) => string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = key(r) ?? "unknown";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function incidentFeature(r: IncidentRow): FeatureRef {
  const block = stripHouseNumber(r.address_block) ?? "unknown block";
  return { kind: "incident", id: r.id, label: `${categoryLabel(r.category)} · ${block} · ${r.opened_at.slice(0, 10)}`, lat: r.lat, lon: r.lon };
}

function siteFeature(s: SiteRow): FeatureRef {
  const rank = s.rank != null ? `#${s.rank} ` : s.provisional ? "Provisional · " : "";
  return { kind: "site", id: s.id, label: `${rank}${stripHouseNumber(s.address_block)}`, lat: s.lat, lon: s.lon };
}

function publicIncident(r: IncidentRow) {
  return {
    id: r.id,
    category: r.category,
    status: r.status,
    opened_at: r.opened_at,
    closed_at: r.closed_at,
    address_block: stripHouseNumber(r.address_block),
    neighborhood: r.neighborhood,
    action_tag: r.action_tag,
    source_id: r.source_id,
  };
}

const PROVISIONAL_CAVEAT =
  "Provisional sites: addresses with repeat rodent reports from the map's draft queue. Analytics clusters and recommendations are not available yet; no score is supplied.";

const provisionalCaveat = (sites: SiteRow[]) => (sites.some((s) => s.provisional) ? [PROVISIONAL_CAVEAT] : []);

function publicSite(s: SiteRow) {
  return {
    id: s.id,
    provisional: Boolean(s.provisional),
    address_block: stripHouseNumber(s.address_block),
    neighborhood: s.neighborhood,
    zip: s.zip,
    city: s.city,
    score: s.summary.definition === "dbscan_50m_min3_v2" ? null : s.score,
    due: s.summary.due ?? null,
    retired: Boolean(s.summary.retired),
    returns_12mo: s.summary.returns_12mo ?? null,
    rank: s.rank,
    report_count: s.report_count,
    recurrence_count: s.recurrence_count,
    first_at: s.first_at,
    last_at: s.last_at,
    lat: s.lat,
    lon: s.lon,
    computed_at: s.computed_at,
  };
}

/** source_ids the analytics track puts in sites.summary / sites.recommended. */
function siteSourceIds(s: SiteRow): string[] {
  const ids: string[] = [];
  const fromSummary = (s.summary as { source_ids?: unknown }).source_ids;
  if (Array.isArray(fromSummary)) ids.push(...fromSummary.filter((x): x is string => typeof x === "string"));
  const baseSources = (s.summary.base_rate as { source_ids?: unknown } | null)?.source_ids;
  if (Array.isArray(baseSources)) ids.push(...baseSources.filter((x): x is string => typeof x === "string"));
  for (const r of s.recommended as { source_ids?: unknown }[]) {
    if (Array.isArray(r?.source_ids)) ids.push(...r.source_ids.filter((x): x is string => typeof x === "string"));
  }
  return ids;
}

export function createServerTools({ data, now = () => new Date(), lookupPlace }: ServerToolOptions) {
  const daysAgo = (n: number) => new Date(now().getTime() - n * 86400000).toISOString().slice(0, 10);

  type Body = { data: unknown; features: FeatureRef[]; caveats: string[]; sourceIds: string[]; locationSources?: SourceRef[] };
  async function run<B extends Body>(fn: (d: AgentData) => Promise<B>): Promise<Out<B["data"]>> {
    if (!data) return { ok: false, reason: "not_configured", error: "Live data is not configured on this deployment, so I can't look that up." };
    try {
      const { data: out, features, caveats, sourceIds, locationSources = [] } = await fn(data);
      const sources: SourceRef[] = await data.sources(sourceIds);
      return { ok: true, data: out, sources: [...sources, ...locationSources], features, caveats };
    } catch (e) {
      if (e instanceof DataUnavailableError) {
        const error = e.reason === "analytics_not_computed" ? e.message : `Data lookup failed (${FAILURE_TEXT[e.reason]}: ${e.message}).`;
        return { ok: false, reason: e.reason, error };
      }
      return { ok: false, reason: "query", error: "Data lookup failed (unexpected error)." };
    }
  }

  /** Provisional sites are acceptable while Analytics task 2.3 is pending. */
  async function requireSites(d: AgentData) {
    if ((await d.siteSource()) !== "none") return;
    throw new DataUnavailableError("Chronic sites have not been computed yet (Analytics task 2.3) and the draft site queue is empty or unavailable.", "analytics_not_computed");
  }

  /** Sources behind computed tables that carry no source_id of their own. */
  async function rodentSourceIds(d: AgentData): Promise<string[]> {
    const { rows } = await d.incidents({ categories: ["rodent"], since: daysAgo(365), limit: 200 });
    return rows.map((r) => r.source_id);
  }

  return {
    geocode: tool({
      description:
        "Locate a named place, campus, landmark, street, neighborhood or ZIP in Greater Boston. Searches named places and reports, then a geographic directory when needed. Use this for MIT or other landmarks BEFORE searching incidents. Move the map to the chosen match and search incidents near its coordinates, WITHOUT the landmark name as a text filter. A location match is not an incident count.",
      inputSchema: z.object({ query: z.string().min(2).max(160).describe("Place name only, e.g. 'MIT', 'Harvard University', 'Normandy St', 'Dorchester'") }),
      execute: ({ query }) =>
        run(async (d) => {
          const named = await d.placesByText(placeQuery(query), 5);
          if (named.length) {
            return {
              data: { query, found: true, matches: named.map(p => ({ label: p.name, lat: p.lat, lon: p.lon, kind: "place" })), sites: [],
                bbox: bboxOf(named as { lat: number; lon: number }[]), suggested_radius_m: 500 },
              features: named.map(p => ({ kind: "place" as const, id: p.id, label: p.name ?? "Place", lat: p.lat, lon: p.lon })),
              caveats: ["Place locations are not incident counts. Search nearby reports by coordinates; omit the place name from the incident text filter."],
              sourceIds: named.map(p => p.source_id),
            };
          }
          const locationCaveats: string[] = [];
          if (lookupPlace) {
            try {
              const places = await lookupPlace(query);
              if (places.length) return {
                data: { query, found: true, matches: places.map(p => ({ label: p.label, lat: p.lat, lon: p.lon, kind: "landmark" })),
                  sites: [], bbox: null, suggested_radius_m: 500 },
                features: [], locationSources: places.map(p => p.source), sourceIds: [],
                caveats: ["Geographic matches from OpenStreetMap via Photon, not evidence of rodent activity. Choose the matching place, move the map, then search nearby reports by coordinates without a name filter. State the search radius; it is not a campus boundary."],
              };
            } catch {
              locationCaveats.push("The geographic directory is temporarily unavailable. This does not mean there are no nearby reports.");
            }
          }
          const [sites, inc] = await Promise.all([
            d.sitesByText(placeQuery(query), 5),
            d.incidents({ text: placeQuery(query), since: daysAgo(3 * 365), limit: 500 }),
          ]);
          const groups = new Map<string, { label: string; neighborhood: string | null; pts: { lat: number; lon: number }[] }>();
          for (const r of inc.rows) {
            if (r.lat == null || r.lon == null) continue;
            const label = stripHouseNumber(r.address_block) ?? r.neighborhood ?? r.zip ?? "unknown";
            const g = groups.get(label) ?? { label, neighborhood: r.neighborhood, pts: [] };
            g.pts.push({ lat: r.lat, lon: r.lon });
            groups.set(label, g);
          }
          const matches = [...groups.values()]
            .sort((a, b) => b.pts.length - a.pts.length)
            .slice(0, 5)
            .map((g) => ({
              label: g.label,
              neighborhood: g.neighborhood,
              reports: g.pts.length,
              lat: g.pts.reduce((s, p) => s + p.lat, 0) / g.pts.length,
              lon: g.pts.reduce((s, p) => s + p.lon, 0) / g.pts.length,
            }));
          const all = inc.rows.filter((r) => r.lat != null && r.lon != null) as { lat: number; lon: number }[];
          const located = sites.filter((s) => s.lat != null && s.lon != null) as { lat: number; lon: number }[];
          const bbox = bboxOf([...all, ...located]);
          const caveats = ["These street locations are estimated from reports in the data.", ...locationCaveats];
          if (!matches.length && !sites.length) caveats.push(`Nothing in the data matches "${query}".`);
          if (inc.rows.length >= 500) caveats.push("Many matches; only the newest 500 reports were used.");
          return {
            data: { query, found: matches.length > 0 || sites.length > 0, matches, sites: sites.map(publicSite), bbox },
            features: sites.map(siteFeature),
            caveats,
            sourceIds: [...inc.rows.slice(0, 50).map((r) => r.source_id), ...sites.flatMap(siteSourceIds)],
          };
        }),
    }),

    search_incidents: tool({
      description:
        "Search 311 incidents (rodent activity and driver categories such as trash storage, dumping, vacant lots). Filter by category, street/neighborhood/ZIP text, dates, status, a point+radius or a bounding box. Returns totals, breakdowns and the newest matching incidents with their ids.",
      inputSchema: z.object({
        categories: z.array(z.enum(CATEGORY_IDS)).optional().describe("Category ids; default ['rodent']"),
        query: z.string().optional().describe("Street, neighborhood or ZIP text"),
        since: isoDate.optional().describe("Default: 90 days ago"),
        until: isoDate.optional(),
        status: z.enum(["all", "open", "closed"]).optional(),
        near: z.object({ lat, lon, radius_m: z.number().min(10).max(1000) }).optional(),
        bbox: z.tuple([lon, lat, lon, lat]).optional().describe("[minLon, minLat, maxLon, maxLat]"),
        limit: z.number().int().min(1).max(200).optional(),
      }),
      execute: (q) =>
        run(async (d) => {
          const limit = q.limit ?? 50;
          const since = q.since ?? daysAgo(90);
          const box = q.near ? bboxAround(q.near.lat, q.near.lon, q.near.radius_m) : q.bbox;
          // With a radius we fetch the box generously, then cut to the circle.
          const res = await d.incidents({
            categories: q.categories ?? ["rodent"], text: q.query, since, until: q.until,
            status: q.status ?? "all", bbox: box, limit: q.near ? 1000 : limit,
          });
          let rows = res.rows;
          let total = res.total;
          if (q.near) {
            const { lat: la, lon: lo, radius_m } = q.near;
            rows = rows.filter((r) => r.lat != null && r.lon != null && distanceM(la, lo, r.lat, r.lon) <= radius_m);
            total = rows.length;
          }
          const caveats: string[] = [];
          if (q.near && res.rows.length >= 1000) caveats.push("Radius search capped at the newest 1,000 reports in the area.");
          if (total != null && total > rows.length) {
            caveats.push(`Showing ${Math.min(rows.length, limit)} of ${total}.`);
            caveats.push(`Category, status and action breakdowns cover only the ${rows.length} fetched reports, not all ${total} matches. For an exact status total, search with that status filter.`);
          }
          if (!rows.length) caveats.push("No incidents match these filters.");
          const shown = rows.slice(0, limit);
          return {
            data: {
              filters: { categories: q.categories ?? ["rodent"], query: q.query ?? null, since, until: q.until ?? null, status: q.status ?? "all", near: q.near ?? null },
              total,
              returned: shown.length,
              breakdowns_count: rows.length,
              breakdowns_scope: "fetched_reports",
              by_category: countBy(rows, (r) => r.category),
              by_status: countBy(rows, (r) => r.status),
              by_action: countBy(rows.filter((r) => r.status === "closed"), (r) => r.action_tag),
              items: shown.map(publicIncident),
            },
            features: shown.slice(0, 50).map(incidentFeature),
            caveats,
            sourceIds: rows.map((r) => r.source_id),
          };
        }),
    }),

    top_sites: tool({
      description:
        "List current rodent sites in queue order: v2 prioritizes Due then returns in the last 12 months. Older Analytics may supply a legacy score. Optionally filter by neighborhood or bounding box.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional(),
        neighborhood: z.string().optional(),
        bbox: z.tuple([lon, lat, lon, lat]).optional(),
      }),
      execute: (q) =>
        run(async (d) => {
          await requireSites(d);
          const sites = await d.sites({ limit: q.limit ?? 10, neighborhood: q.neighborhood, bbox: q.bbox });
          const ids = sites.flatMap(siteSourceIds);
          const caveats = [
            sites.some((x) => x.provisional)
              ? "Ordered by the draft queue: due for follow-up, then returns after closure, then report count."
              : sites.some((x) => x.summary.definition === "dbscan_50m_min3_v2")
                ? "V2 queue: current Due first, then returns in the last 12 months, report count and recency. No composite score; any stored rank is from the last analytics refresh."
                : "Legacy score ranks how persistent reports are at an address, not how many rats there are.",
            ...provisionalCaveat(sites),
          ];
          if (!sites.length) caveats.push("No chronic sites in this area.");
          return {
            data: { sites: sites.map(publicSite) },
            features: sites.map(siteFeature),
            caveats,
            sourceIds: ids.length || !sites.length ? ids : await rodentSourceIds(d),
          };
        }),
    }),

    due_sites: tool({
      description: "List sites flagged Due for follow-up, with report/closure/return counts and sources. Uses the database's Due flag, never an invented risk threshold. Draft-queue results are explicitly provisional.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional(),
        neighborhood: z.string().optional(),
        bbox: z.tuple([lon, lat, lon, lat]).optional(),
      }),
      execute: (q) => run(async (d) => {
        await requireSites(d);
        const provisional = (await d.siteSource()) === "draft";
        const sites = await d.sites({ ...q, limit: q.limit ?? 10, due: true });
        const ids = sites.flatMap(siteSourceIds);
        return {
          data: {
            provisional,
            sites: sites.map((s) => ({
              id: s.id, address_block: stripHouseNumber(s.address_block), neighborhood: s.neighborhood,
              lat: s.lat, lon: s.lon, due: true, report_count: s.report_count,
              closures: s.summary.closures ?? null, returns: s.recurrence_count,
              last_closed: s.summary.last_closed ?? s.summary.last_closed_at ?? null, days_since_close: s.summary.days_since_close ?? null,
              base_rate: s.summary.base_rate ?? null,
              base_rate_unit: s.summary.base_rate ? "fraction" : null,
              due_threshold: s.summary.due_threshold ?? null,
            })),
          },
          features: sites.map(siteFeature),
          caveats: [
            provisional
              ? "Provisional Due flag from the draft queue: last closure within 60 days and at least one recorded return. This is not the Spec v2 base-rate threshold; Analytics task 2.19 is pending."
              : "Due flags come from Analytics. A flag is a follow-up priority, not a prediction that a report will occur.",
            ...(!sites.length ? ["No Due sites match these filters."] : []),
          ],
          sourceIds: ids.length || !sites.length ? ids : await rodentSourceIds(d),
        };
      }),
    }),

    get_site: tool({
      description:
        "Full detail for one site: queue priority, timeline of rodent reports with the city action taken at each closure, nearby drivers, building facts and recommended actions.",
      inputSchema: z.object({ site_id: z.string().min(1) }),
      execute: ({ site_id }) =>
        run(async (d) => {
          await requireSites(d);
          const s = await d.site(site_id);
          if (!s) {
            return { data: { found: false, site_id }, features: [], caveats: [`No site with id ${site_id}.`], sourceIds: [] };
          }
          // V2 Analytics keeps all representative IDs (legacy lists can be capped); draft detail
          // lists its reports directly. Never broaden a supplied list to the street.
          const listed = s.reports ?? (Array.isArray(s.summary.timeline) ? s.summary.timeline : undefined);
          const ids = listed?.flatMap((r: { id?: unknown } | null) => typeof r?.id === "string" ? [r.id] : []);
          const rows: IncidentRow[] = ids
            ? (await d.incidentsByIds([...new Set(ids)]))
            : (await d.incidents({ categories: ["rodent"], addressBlock: s.address_block, limit: 200 })).rows;
          const timeline = [...rows].sort((a, b) => a.opened_at.localeCompare(b.opened_at)).map(publicIncident);
          const summary = s.summary as { drivers?: unknown; building?: unknown; why?: unknown; recur_p?: unknown; adjacent_vacant?: unknown };
          return {
            data: {
              found: true,
              site: publicSite(s),
              why: summary.why ?? null,
              drivers: summary.drivers ?? null,
              building: summary.building ?? null,
              recurrence_probability: summary.recur_p ?? null,
              recommended: s.recommended.filter(permittedRecommendation),
              actions_taken: countBy(timeline.filter((t) => t.status === "closed"), (t) => t.action_tag),
              timeline,
            },
            features: [siteFeature(s), ...rows.slice(0, 30).map(incidentFeature)],
            caveats: [
              ...provisionalCaveat([s]),
              ...(s.summary.retired ? ["Historical retired cluster: review the current queue before planning another action."] : []),
              ...(ids
                ? (rows.length < s.report_count ? [`Partial timeline: ${rows.length} of ${s.report_count} site reports are available from the supplied report IDs; action counts cover only these reports.`] : [])
                : ["Timeline groups rodent reports by street block, which can include neighbouring addresses."]),
              ...(s.recommended.some((r) => !permittedRecommendation(r)) ? ["Some computed recommendations are omitted because their action is unsupported or mentions baiting/pesticides."] : []),
              ...(summary.recur_p == null ? ["No recurrence probability computed for this site yet."] : []),
            ],
            sourceIds: [...rows.map((r) => r.source_id), ...siteSourceIds(s)],
          };
        }),
    }),

    nearby_drivers: tool({
      description:
        "What sits around a point or site that is associated with rodent reports: driver 311 reports (trash storage, dumping, dead animals, indoor pests, vacant lots…) and places (restaurants with rodent violations, vacant parcels, demolitions…) within a radius. Associations, not causes.",
      inputSchema: z.object({
        site_id: z.string().optional(),
        lat: lat.optional(),
        lon: lon.optional(),
        radius_m: z.number().min(25).max(500).optional().describe("Default 100"),
        since: isoDate.optional().describe("Default: the site's first report, else 365 days ago"),
        until: isoDate.optional(),
      }).refine((v) => v.site_id || (v.lat != null && v.lon != null), "Give site_id or lat+lon"),
      execute: (q) =>
        run(async (d) => {
          let la = q.lat, lo = q.lon, since = q.since, until = q.until;
          let site: SiteRow | null = null;
          if (q.site_id) {
            await requireSites(d);
            site = await d.site(q.site_id);
            if (!site || site.lat == null || site.lon == null) {
              return { data: { found: false }, features: [], caveats: [`Site ${q.site_id} not found or has no location.`], sourceIds: [] };
            }
            la = site.lat; lo = site.lon;
            since ??= site.first_at?.slice(0, 10);
            until ??= site.last_at?.slice(0, 10);
          }
          const radius = q.radius_m ?? 100;
          since ??= daysAgo(365);
          const box = bboxAround(la!, lo!, radius);
          const [inc, places] = await Promise.all([
            d.incidents({ categories: DRIVER_CATEGORIES, since, until, bbox: box, limit: 2000 }),
            d.places({ bbox: box, kinds: PLACE_KINDS, limit: 500 }),
          ]);
          const near = <T extends { lat: number | null; lon: number | null }>(r: T) =>
            r.lat != null && r.lon != null && distanceM(la!, lo!, r.lat, r.lon) <= radius;
          const incidents = inc.rows.filter(near);
          const nearPlaces = places.filter(near);
          const drivers = Object.entries(countBy(incidents, (r) => r.category))
            .map(([category, n]) => ({ category, label: categoryLabel(category), n }))
            .sort((a, b) => b.n - a.n);
          const placeCounts = Object.entries(countBy(nearPlaces, (p) => p.kind))
            .map(([kind, n]) => ({ kind, label: placeLabel(kind), n }))
            .sort((a, b) => b.n - a.n);
          const caveats = ["Nearby does not mean causing: these are associations from the data."];
          const truncated = inc.total != null ? inc.total > inc.rows.length : inc.rows.length >= 2000;
          if (truncated) caveats.push(`Driver counts are partial: only the newest ${inc.rows.length} of ${inc.total ?? "an unknown number of"} reports in the bounding box were checked; the database or query row limit was reached.`);
          if (!incidents.length && !nearPlaces.length) caveats.push("No driver reports or places found within the radius.");
          return {
            data: {
              center: { lat: la, lon: lo }, radius_m: radius, since, until: until ?? null,
              site_id: site?.id ?? null,
              driver_reports: drivers,
              driver_reports_truncated: truncated,
              places: placeCounts,
              precomputed_drivers: site ? (site.summary as { drivers?: unknown }).drivers ?? null : null,
            },
            features: [
              ...nearPlaces.slice(0, 20).map((p): FeatureRef => ({ kind: "place", id: p.id, label: `${placeLabel(p.kind)}${p.name ? ` · ${p.name}` : ""}`, lat: p.lat, lon: p.lon })),
              ...incidents.slice(0, 30).map(incidentFeature),
            ],
            caveats,
            sourceIds: [...incidents.map((r) => r.source_id), ...nearPlaces.map((p) => p.source_id)],
          };
        }),
    }),

    what_worked: tool({
      description:
        "For each kind of city action at a rodent case closure, how often the same address got a new rodent report within 60 days (lower is better), with case counts.",
      inputSchema: z.object({ action_tags: z.array(z.enum(ACTION_IDS)).optional() }),
      execute: (q) =>
        run(async (d) => {
          const outcomes = await d.actionOutcomes();
          if (!outcomes.length) {
            throw new DataUnavailableError("Action outcomes (what worked) have not been computed yet (Analytics task 2.4); the action_outcomes table is empty.", "analytics_not_computed");
          }
          const rows = outcomes
            .filter((r) => !q.action_tags?.length || q.action_tags.includes(r.action_tag))
            .sort((a, b) => a.recur_60d_pct - b.recur_60d_pct);
          const caveats = [
            "Observational: what followed an action is not proof the action caused it; harder cases may get stronger actions.",
          ];
          const small = rows.filter((r) => r.n < 30).map((r) => r.action_tag);
          if (small.length) caveats.push(`Few cases (n < 30) for: ${small.join(", ")}.`);
          if (!rows.length) caveats.push("No outcomes for these actions.");
          return {
            data: {
              outcomes: rows.map((r) => ({ ...r, label: action(r.action_tag).label, owner: action(r.action_tag).owner })),
            },
            features: [],
            caveats,
            sourceIds: rows.length
              ? (rows.some((r) => r.source_ids?.length) ? rows.flatMap((r) => r.source_ids ?? []) : await rodentSourceIds(d))
              : [],
          };
        }),
    }),

    draft_work_order: tool({
      description:
        "Draft (never send, never save) a work order for a site so the inspector can review it in the Approve step of the Inspect panel. Use only actions supported by the site's data.",
      inputSchema: z.object({
        site_id: z.string().min(1),
        action: z.enum(DRAFT_ACTION_IDS).describe("Allowed next action; historical baiting is never a recommendation"),
        note: z.string().max(500).optional(),
        follow_up_days: z.number().int().min(7).max(180).optional().describe("Default 60"),
      }),
      execute: (q) =>
        run(async (d) => {
          await requireSites(d);
          const s = await d.site(q.site_id);
          if (!s) return { data: { drafted: false }, features: [], caveats: [`No site with id ${q.site_id}.`], sourceIds: [] };
          if (s.summary.retired) {
            return { data: { drafted: false }, features: [siteFeature(s)], caveats: ["This cluster is retired. Select a current site before drafting a new action."], sourceIds: siteSourceIds(s) };
          }
          if (!(DRAFT_ACTION_IDS as readonly string[]).includes(q.action) || prohibitedRecommendation.test(q.note ?? "")) {
            return { data: { drafted: false }, features: [siteFeature(s)], caveats: ["Choose sanitation, exclusion, enforcement or referral for the next action."], sourceIds: siteSourceIds(s) };
          }
          const rec = (s.recommended.filter(permittedRecommendation) as { because?: unknown; source_ids?: string[] }[]).find((r) => recommendationAction(r) === q.action);
          const follow = new Date(now().getTime() + (q.follow_up_days ?? 60) * 86400000).toISOString().slice(0, 10);
          const a = action(q.action);
          return {
            data: {
              drafted: true,
              status: "draft",
              saved: false,
              site_id: s.id,
              address_block: stripHouseNumber(s.address_block),
              action: q.action,
              action_label: a.label,
              owner: a.owner,
              because: rec?.because ?? null,
              recommended_by_analysis: Boolean(rec),
              note: q.note ?? null,
              follow_up_on: follow,
              next_step: "Review, edit or reject this draft in Inspect → Action review. Nothing has been approved or sent.",
            },
            features: [siteFeature(s)],
            caveats: [...provisionalCaveat([s]), ...(rec ? [] : ["This action is not among the site's computed recommendations."])],
            sourceIds: [...(rec?.source_ids ?? []), ...siteSourceIds(s)],
          };
        }),
    }),
  };
}

export type ServerTools = ReturnType<typeof createServerTools>;
