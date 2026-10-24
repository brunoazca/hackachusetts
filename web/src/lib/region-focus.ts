import { bbox, difference, featureCollection, pointOnFeature, polygon, union } from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

export type FocusRegion = { region_id: string; rank: number; cell_ids: string[] };
export type RegionFocus = {
  regions: FeatureCollection<Polygon | MultiPolygon>;
  mask: Feature<Polygon | MultiPolygon> | null;
  labels: { id: string; rank: number; lon: number; lat: number }[];
  bounds: [number, number, number, number];
};
export function buildRegionFocus(request: FocusRegion[], cells: FeatureCollection<Polygon>): RegionFocus {
  const byId = new Map(cells.features.map(f => [String(f.properties?.id), f]));
  const labels: RegionFocus["labels"] = [];
  const features = request.map(r => {
    const members = [...new Set(r.cell_ids)].map(id => byId.get(id));
    if (!members.length || members.some(f => !f)) throw new Error(`Complete boundaries are unavailable for region #${r.rank}.`);
    const polygons = members as Feature<Polygon>[];
    const merged = polygons.length === 1 ? polygons[0] : union(featureCollection(polygons));
    if (!merged) throw new Error("Could not assemble region boundaries.");
    const [lon, lat] = pointOnFeature(merged).geometry.coordinates;
    labels.push({ id: r.region_id, rank: r.rank, lon, lat });
    return { ...merged, properties: { region_id: r.region_id, rank: r.rank } };
  });
  const regions = featureCollection(features);
  const merged = features.length === 1 ? features[0] : union(regions);
  if (!merged) throw new Error("No region boundaries available.");
  const world = polygon([[[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]]]);
  return { regions, labels, mask: difference(featureCollection([world, merged])), bounds: bbox(regions) as RegionFocus["bounds"] };
}

/** PostGIS geography SELECT returns EWKB; grid cells are 2D SRID 4326 polygons. */
export function gridPolygon(hex: string): Polygon {
  if (!/^(?:[a-fA-F0-9]{2})+$/.test(hex)) throw new Error("Invalid grid geometry.");
  const bytes = Uint8Array.from(hex.match(/../g)!, b => parseInt(b, 16));
  const view = new DataView(bytes.buffer);
  let offset = 1;
  if (bytes[0] !== 0 && bytes[0] !== 1) throw new Error("Invalid grid geometry byte order.");
  const little = bytes[0] === 1;
  const int = () => { const n = view.getUint32(offset, little); offset += 4; return n; };
  const double = () => { const n = view.getFloat64(offset, little); offset += 8; return n; };
  const type = int();
  if ((type & 0xffff) !== 3 || (type & 0xc0000000) !== 0) throw new Error("Expected a 2D grid polygon.");
  if ((type & 0x20000000) && int() !== 4326) throw new Error("Unexpected grid coordinate system.");
  const rings = int();
  if (!rings || rings > 100) throw new Error("Invalid polygon rings.");
  const coordinates: number[][][] = [];
  for (let r = 0; r < rings; r++) {
    const count = int();
    if (count < 4 || count > 10000) throw new Error("Invalid polygon size.");
    const ring: number[][] = [];
    for (let p = 0; p < count; p++) {
      const lon = double(), lat = double();
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) throw new Error("Invalid polygon coordinates.");
      ring.push([lon, lat]);
    }
    if (ring[0][0] !== ring[count-1][0] || ring[0][1] !== ring[count-1][1]) throw new Error("Unclosed grid polygon.");
    coordinates.push(ring);
  }
  if (offset !== bytes.length) throw new Error("Unexpected grid geometry content.");
  return { type: "Polygon", coordinates };
}
