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
 * Map marker, 32-unit canvas (the disc is 22 px; the margin keeps the ring from clipping).
 * Open report: solid disc in the category color, white glyph, a faint dark edge so it separates
 * from a light ground. Closed report: hollow ring in the category color over a tinted interior,
 * glyph in the category color — same shape, clearly quieter, and it works on both themes without
 * a white disc or a baked drop shadow. Shape + fill carry status, so it does not depend on color alone.
 */
export function markerSvg(category: string, size = 32, closed = false): string {
  const color = CATS[category]?.color ?? "#555";
  const ink = closed ? color : "#ffffff";
  const glyph = (GLYPH[category] ?? FALLBACK)
    .replace(/stroke="currentColor"/g, `stroke="${ink}"`)
    .replace(/stroke-width="2"/g, closed ? 'stroke-width="2"' : 'stroke-width="2.25"')
    .replace(/width="24"/, 'width="14"')
    .replace(/height="24"/, 'height="14"')
    .replace("<svg", '<svg x="9" y="9"');
  const disc = closed
    ? `<circle cx="16" cy="16" r="10.25" fill="${color}" fill-opacity=".28" stroke="${color}" stroke-width="2.25"/>`
    : `<circle cx="16" cy="16" r="11" fill="${color}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    ${disc}
    ${glyph}
  </svg>`;
}

export const markerDataUrl = (category: string, closed = false) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg(category, 32, closed))}`;

export const ALERT_ICON = "priority-alert";

/** Alert badge for the open top blocks: dark red disc, white warning triangle. */
function alertSvg(size: number): string {
  const glyph = TriangleAlert
    .replace(/stroke="currentColor"/g, 'stroke="#ffffff"')
    .replace(/stroke-width="2"/g, 'stroke-width="2.5"')
    .replace(/width="24"/, 'width="16"')
    .replace(/height="24"/, 'height="16"')
    .replace("<svg", '<svg x="8" y="7"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#8B0000" stroke="#ffffff" stroke-width="1.5"/>
    ${glyph}
  </svg>`;
}

/** Register both marker variants (open, closed) for every category at 2x for crisp rendering. */
export async function addCategoryIcons(map: MlMap): Promise<void> {
  const scale = 2, px = 32 * scale;
  const jobs = [
    ...Object.keys(CATS).flatMap((cat) => [false, true].map((closed) => ({ id: iconId(cat, closed), svg: markerSvg(cat, px, closed) }))),
    { id: ALERT_ICON, svg: alertSvg(px) },
  ];
  await Promise.all(
    jobs.map(
      ({ id, svg }) =>
        new Promise<void>((resolve) => {
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
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        }),
    ),
  );
}
