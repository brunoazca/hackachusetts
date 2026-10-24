import {
  Binoculars, Bug, Building2, CalendarX, ClipboardList, Clock, Construction, Container, Fence, Gavel, PackageX, Rat, Skull, Sofa, Sprout, Trash, Trash2, TriangleAlert, Truck, Utensils,
} from "lucide-static";
import type { Map as MlMap } from "maplibre-gl";
import categories from "@/lib/categories.json";

// One marker icon per incident category: a colored disc with a white Lucide glyph (ISC license).
// Used by the map (as MapLibre images) and by the legend (as data URLs), so they always match.

const CATS = categories.incident_categories as Record<string, { label: string; color: string; group: string }>;

const GLYPH: Record<string, string> = {
  rodent: Rat,
  pest: Bug,
  bite: TriangleAlert,
  dead_animal: Skull,
  rodent_program: ClipboardList,
  inat_rat: Binoculars,
  trash_storage: Trash2,
  trash_early: Clock,
  missed_trash: CalendarX,
  dumping: Sofa,
  litter: Trash,
  dumpster: Container,
  sanitation: Utensils,
  move_in_trash: Truck,
  ce_trash_storage: Gavel,
  ce_overfill: Gavel,
  ce_dumping: Gavel,
  ce_dumpster: Gavel,
  ce_weeds: Sprout,
  vacant_lot: Fence,
  abandoned_building: Building2,
  weeds: Sprout,
  construction_debris: Construction,
};
const FALLBACK = PackageX;

export const iconId = (category: string, closed = false) => `cat-${category}${closed ? "-closed" : ""}`;

/**
 * Map marker, 32-unit canvas with room for a soft shadow.
 * Open report: solid disc in the category color, white glyph, white ring — reads as "active".
 * Closed report: white disc, ring and glyph in the category color — same shape, clearly calmer.
 * Shape + fill carry status, so it does not depend on color alone.
 */
export function markerSvg(category: string, size = 32, closed = false): string {
  const color = CATS[category]?.color ?? "#555";
  const ink = closed ? color : "#ffffff";
  const glyph = (GLYPH[category] ?? FALLBACK)
    .replace(/stroke="currentColor"/g, `stroke="${ink}"`)
    .replace(/stroke-width="2"/g, 'stroke-width="2.25"')
    .replace(/width="24"/, 'width="15"')
    .replace(/height="24"/, 'height="15"')
    .replace("<svg", '<svg x="8.5" y="7.5"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="1.1" flood-color="#000" flood-opacity=".35"/></filter></defs>
    <circle cx="16" cy="15" r="11" fill="${closed ? "#ffffff" : color}" stroke="${closed ? color : "#ffffff"}" stroke-width="${closed ? 2.25 : 2}" filter="url(#s)"/>
    ${glyph}
  </svg>`;
}

export const markerDataUrl = (category: string, closed = false) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg(category, 32, closed))}`;

/** Register both marker variants (open, closed) for every category at 2x for crisp rendering. */
export async function addCategoryIcons(map: MlMap): Promise<void> {
  const scale = 2, px = 32 * scale;
  const jobs = Object.keys(CATS).flatMap((cat) => [false, true].map((closed) => ({ cat, closed })));
  await Promise.all(
    jobs.map(
      ({ cat, closed }) =>
        new Promise<void>((resolve) => {
          const id = iconId(cat, closed);
          if (map.hasImage(id)) return resolve();
          const img = new Image(px, px);
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = px;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, px, px);
            if (!map.hasImage(id)) map.addImage(id, ctx.getImageData(0, 0, px, px), { pixelRatio: scale });
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg(cat, px, closed))}`;
        }),
    ),
  );
}
