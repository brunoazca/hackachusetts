import type { Feature, FeatureCollection, Polygon } from "geojson";
import { fetchForecast, type ForecastCellProps } from "./forecast";
import type { BBox } from "./queries";
import { supabase } from "./supabase";

// Ranked blocks, shared by the map grid and the left-hand list so both number blocks the same way.
// Score: the API's `priority` when the model track adds one; until then expected reports for the
// chosen week, ordered like the Citywide "busiest blocks" list (expected desc, id asc). One fetch
// over the three cities per week, cached, so panning never reorders anything.

export type RankedCell = ForecastCellProps & { priority?: number; score: number; rank: number; pct: number; lon: number; lat: number };
export type RankedFC = FeatureCollection<Polygon, RankedCell>;

const CITY_BBOX: BBox = [-71.20, 42.22, -70.95, 42.42];
const cache = new Map<string, Promise<RankedFC>>();

// Block names come straight from the grid table (neighborhood, plus the street label once migration
// 20261024700001 has run), so the list names blocks even while the forecast API does not.
type Name = { neighborhood: string | null; label: string | null };
let names: Promise<Map<string, Name>> | null = null;
async function fetchNames(): Promise<Map<string, Name>> {
  const out = new Map<string, Name>();
  const page = 1000;
  let hasLabel = true; // the label column arrives with the migration; after one miss, stop asking for it
  for (let from = 0; ; from += page) {
    let rows: { id: string; neighborhood: string | null; label?: string | null }[] | null = null;
    if (hasLabel) {
      const withLabel = await supabase.from("grid_cells").select("id,neighborhood,label").range(from, from + page - 1);
      if (!withLabel.error) rows = withLabel.data; else hasLabel = false;
    }
    if (!hasLabel) {
      const plain = await supabase.from("grid_cells").select("id,neighborhood").range(from, from + page - 1);
      if (plain.error) throw plain.error;
      rows = plain.data;
    }
    for (const r of rows ?? []) out.set(r.id, { neighborhood: r.neighborhood ?? null, label: r.label ?? null });
    if (!rows || rows.length < page) break;
  }
  return out;
}
const blockNames = () => (names ??= fetchNames().catch((e) => { names = null; throw e; }));

/** The forecast week to rank by: an ISO week_start, or null for the first forecast week ("4w" counts as null). */
export const weekKey = (week: string | null | undefined) => (week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : null);

function scoreOf(p: ForecastCellProps & { priority?: number }) {
  return typeof p.priority === "number" ? p.priority : p.expected ?? 0;
}

function centroid(f: Feature<Polygon>): [number, number] {
  const ring = f.geometry.coordinates[0] ?? [];
  const n = Math.max(1, ring.length);
  return [ring.reduce((s, c) => s + c[0], 0) / n, ring.reduce((s, c) => s + c[1], 0) / n];
}

export function fetchRankedCells(week: string | null): Promise<RankedFC> {
  const key = week ?? "";
  const hit = cache.get(key);
  if (hit) return hit;
  const p = Promise.all([fetchForecast(CITY_BBOX, week, 0.02), blockNames().catch(() => new Map<string, Name>())]).then(([fc, byId]): RankedFC => {
    const feats = fc.features
      .map((f) => ({ f, score: scoreOf(f.properties) }))
      .sort((a, b) => b.score - a.score || String(a.f.properties.id).localeCompare(String(b.f.properties.id)));
    const n = Math.max(1, feats.length - 1);
    return {
      type: "FeatureCollection",
      features: feats.map(({ f, score }, i): Feature<Polygon, RankedCell> => {
        const [lon, lat] = centroid(f);
        const nm = byId.get(String(f.properties.id));
        return {
          ...f,
          properties: {
            ...f.properties,
            label: f.properties.label ?? nm?.label ?? null,
            neighborhood: f.properties.neighborhood ?? nm?.neighborhood ?? null,
            score, rank: i + 1, pct: 1 - i / n, lon, lat,
          },
        };
      }),
    };
  });
  p.catch(() => cache.delete(key));
  cache.set(key, p);
  return p;
}
