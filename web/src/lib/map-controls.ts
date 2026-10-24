import categories from "./categories.json";

export type CategoryId = keyof typeof categories.incident_categories;
export const CATEGORY_IDS = Object.keys(categories.incident_categories) as CategoryId[];
export const CONTEXT_LAYER_IDS = ["ctx_housing", "ctx_buildings", "sites", "forecast", "priority"] as const;
export type LayerId = CategoryId | (typeof CONTEXT_LAYER_IDS)[number];
export type ViewMode = "points" | "heat" | "both";
export type Bounds = [number, number, number, number];
export const LAYER_IDS = [...CATEGORY_IDS, ...CONTEXT_LAYER_IDS] as LayerId[];
export const LAYER_GROUPS = {
  rats: CATEGORY_IDS.filter(id => categories.incident_categories[id].group === "rats"),
  rats_other: CATEGORY_IDS.filter(id => categories.incident_categories[id].group === "rats" && id !== "rodent"),
  food: CATEGORY_IDS.filter(id => categories.incident_categories[id].group === "food"),
  shelter: CATEGORY_IDS.filter(id => categories.incident_categories[id].group === "shelter"),
  displace: CATEGORY_IDS.filter(id => categories.incident_categories[id].group === "displace"),
};
export function activeCategories(layers: Record<string, boolean>): CategoryId[] {
  return CATEGORY_IDS.filter(id => layers[id]);
}
export function isNearbyCategory(id: string) {
  return CATEGORY_IDS.includes(id as CategoryId) && categories.incident_categories[id as CategoryId].group !== "rats";
}
export const initialLayers = () => Object.fromEntries(LAYER_IDS.map(id => [id, CATEGORY_IDS.includes(id as CategoryId) || id === "sites"])) as Record<LayerId, boolean>;

/** Bins contain n/n_open, not individual statuses. Preserve their exact weights. */
export function filterIncidentStatus<T extends { properties: { status?: string; n?: number; n_open?: number } }>(
  features: T[], status: "all" | "open" | "closed",
): T[] {
  if (status === "all") return features;
  return features.flatMap(feature => {
    const p = feature.properties;
    if (p.n == null) return p.status === status ? [feature] : [];
    const open = Math.max(0, Math.min(p.n, p.n_open ?? 0));
    const n = status === "open" ? open : p.n - open;
    return n > 0 ? [{ ...feature, properties: { ...p, n, n_open: status === "open" ? n : 0, status } }] : [];
  });
}
