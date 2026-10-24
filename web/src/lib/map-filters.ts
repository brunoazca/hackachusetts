import type { FeatureCollection, Point } from "geojson";
import type { IncidentProps } from "./queries";

/** Apply status consistently to raw reports and aggregate counts, before any map rendering. */
export function filterIncidentStatus(data: FeatureCollection<Point, IncidentProps>, status: "all" | "open" | "closed"): FeatureCollection<Point, IncidentProps> {
  if (status === "all") return data;
  return { ...data, features: data.features.flatMap(f => {
    const p = f.properties;
    if (p.n == null) return p.status === status ? [f] : [];
    if (p.n_open == null) return [];
    const n = Math.max(0, status === "open" ? p.n_open : p.n - p.n_open);
    return n ? [{ ...f, properties: { ...p, n, n_open: status === "open" ? n : 0 } }] : [];
  }) };
}
