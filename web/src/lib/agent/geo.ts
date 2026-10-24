import type { BBox } from "./types";

const R = 6371008.8; // mean Earth radius, m

export function distanceM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Smallest lat/lon box that contains a circle; used to prefilter before the exact distance. */
export function bboxAround(lat: number, lon: number, radiusM: number): BBox {
  const dLat = (radiusM / R) * (180 / Math.PI);
  const dLon = dLat / Math.cos((lat * Math.PI) / 180);
  return [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
}

export function bboxOf(points: { lat: number; lon: number }[]): BBox | null {
  if (!points.length) return null;
  let [minLon, minLat, maxLon, maxLat] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of points) {
    minLon = Math.min(minLon, p.lon); maxLon = Math.max(maxLon, p.lon);
    minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
  }
  return [minLon, minLat, maxLon, maxLat];
}

export function inBBox(lat: number, lon: number, b: BBox): boolean {
  return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];
}

/** Drop a leading house number ("12 Normandy St, 02121" → "Normandy St, 02121"). Defence in depth for R8.8. */
export function stripHouseNumber(s: string | null): string | null {
  return s == null ? s : s.replace(/^\s*\d+[A-Za-z]?(?:\s*-\s*\d+[A-Za-z]?)?\s+/, "");
}
