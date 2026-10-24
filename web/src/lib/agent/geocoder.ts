import { z } from "zod";
import type { SourceRef } from "./types";

const featureSchema = z.object({
  geometry: z.object({ type: z.literal("Point"), coordinates: z.tuple([z.number().min(-71.5).max(-70.7), z.number().min(41.9).max(42.7)]) }),
  properties: z.object({
    name: z.string().optional(), street: z.string().optional(), city: z.string().optional(),
    osm_type: z.enum(["N", "W", "R"]), osm_id: z.number().int().positive(),
  }),
});

export type PlaceLocation = { label: string; lat: number; lon: number; source: SourceRef };
export type PlaceLookup = (query: string) => Promise<PlaceLocation[]>;

export function placeQuery(query: string): string {
  return query.trim().replace(/\bM\.?I\.?T\.?\b/gi, "Massachusetts Institute of Technology");
}

/** Photon/OSM resolves geography only; it is never evidence of rodent activity.
 * Public demo usage is low-volume: only unmatched submitted place queries,
 * deduplicated and cached for a day, with a bounded cache and request timeout.
 * https://github.com/komoot/photon#demo-server
 */
export function createPlaceLookup(fetcher: typeof fetch = fetch): PlaceLookup {
  const cache = new Map<string, { expires: number; value: Promise<PlaceLocation[]> }>();
  return async (query) => {
    const q = placeQuery(query).slice(0, 160);
    const key = q.toLowerCase();
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    const value = (async () => {
      const url = new URL("https://photon.komoot.io/api/");
      url.search = new URLSearchParams({ q, limit: "3", lang: "en", bbox: "-71.5,41.9,-70.7,42.7" }).toString();
      const res = await fetcher(url, { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Place lookup unavailable");
      const body = z.object({ features: z.array(z.unknown()) }).parse(await res.json());
      const matches = body.features.flatMap((raw): PlaceLocation[] => {
        const parsed = featureSchema.safeParse(raw);
        if (!parsed.success) return [];
        const { properties: p, geometry: { coordinates: [lon, lat] } } = parsed.data;
        const name = p.name ?? p.street;
        if (!name) return [];
        const kind = { N: "node", W: "way", R: "relation" }[p.osm_type];
        return [{ label: [name, p.city].filter(Boolean).join(", "), lat, lon,
          source: { id: `osm:${p.osm_type}${p.osm_id}`, name: `© OpenStreetMap contributors · ${name} (location only, via Photon)`,
            url: `https://www.openstreetmap.org/${kind}/${p.osm_id}`, retrieved_at: new Date().toISOString() } }];
      });
      const exact = matches.filter(p => p.label.split(",")[0].toLowerCase() === key);
      return exact.length ? exact : matches;
    })();
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 86400000, value });
    try { return await value; }
    catch (e) { cache.delete(key); throw e; }
  };
}

export const lookupPlace = createPlaceLookup();
