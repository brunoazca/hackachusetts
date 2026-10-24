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

export const iconId = (category: string) => `cat-${category}`;

/** Marker SVG: disc in the category color, white ring, white glyph. */
export function markerSvg(category: string, size = 28): string {
  const color = CATS[category]?.color ?? "#555";
  const glyph = (GLYPH[category] ?? FALLBACK)
    .replace(/stroke="currentColor"/g, 'stroke="#ffffff"')
    .replace(/width="24"/, 'width="16"')
    .replace(/height="24"/, 'height="16"')
    .replace("<svg", '<svg x="6" y="6"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12.5" fill="${color}" stroke="#ffffff" stroke-width="2"/>
    ${glyph}
  </svg>`;
}

export const markerDataUrl = (category: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg(category))}`;

/** Register every category icon on the map at 2x for crisp rendering. */
export async function addCategoryIcons(map: MlMap): Promise<void> {
  const scale = 2;
  await Promise.all(
    Object.keys(CATS).map(
      (cat) =>
        new Promise<void>((resolve) => {
          const id = iconId(cat);
          if (map.hasImage(id)) return resolve();
          const img = new Image(28 * scale, 28 * scale);
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 28 * scale;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, 28 * scale, 28 * scale);
            if (!map.hasImage(id)) map.addImage(id, ctx.getImageData(0, 0, 28 * scale, 28 * scale), { pixelRatio: scale });
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg(cat, 28 * scale))}`;
        }),
    ),
  );
}
