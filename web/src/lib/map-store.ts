"use client";
import { create } from "zustand";
import type { Polygon } from "geojson";
import { activeCategories, CATEGORY_IDS, initialLayers, isNearbyCategory, type Bounds, type LayerId, type ViewMode } from "./map-controls";
export type { LayerId } from "./map-controls";

// Single source of truth for what the map shows. The UI and the agent's
// client-side tools both call these actions, so the agent can "drive" the map.

export type Selection =
  | { kind: "incident" | "place" | "event" | "site" | "cell" | "listing" | "tract"; id: string }
  | { kind: "area"; geojson: Polygon }
  | null;

export type Filters = {
  since: string;          // ISO date
  until: string;          // ISO date
  categories: string[];   // enabled incident category ids; setFilters({ categories: [] }) enables all
  status: "all" | "open" | "closed";
};

export type View = { lat: number; lon: number; zoom: number };

export type Mode = "assess" | "act";

/** Sites currently listed in the Act queue, so the map can draw and fly to them. */
export type SiteRow = {
  id: string; address_block: string | null; neighborhood: string | null; city: string;
  lat: number; lon: number; reports: number; closures: number; returns: number;
  first_at: string; last_at: string; last_closed: string | null; days_since_close: number | null;
  last_note: string | null; due: boolean;
};

/**
 * One row of the keyboard "features in view" list — the accessible twin of the map
 * (R2.11, R9.1, docs/design/accessibility.md §1). MapView keeps this in sync with what
 * is actually drawn; the FeatureList renders it and selection syncs both ways.
 */
export type FeatureInView = {
  kind: "incident" | "site";
  id: string;
  label: string;        // human name, e.g. street block
  detail: string;       // short line: neighborhood · counts
  lat: number;
  lon: number;
};

type MapState = {
  mode: Mode;
  sites: SiteRow[];
  siteNeighborhood: string;
  setSiteNeighborhood: (neighborhood: string) => void;
  featuresInView: FeatureInView[];
  setMode: (m: Mode) => void;
  setSites: (s: SiteRow[]) => void;
  setFeaturesInView: (f: FeatureInView[]) => void;
  view: View;
  bounds: Bounds | null;
  viewMode: ViewMode;
  causes: boolean;
  cellMetric: string | null;
  setCellMetric: (metric: string | null) => void;
  setBounds: (bounds: Bounds | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setCauses: (on: boolean) => void;
  flyToTarget: (View & { nonce: number }) | null;
  layers: Record<LayerId, boolean>;
  filters: Filters;
  highlight: string[];             // ids of incidents/places/sites to emphasize
  selection: Selection;
  panel: "inspector" | "insights" | "chat";
  forecastWeek: string | null;     // ISO week_start or "4w"; null also means next four weeks
  three: boolean;                  // pitched camera + extruded buildings at street level
  flyTo: (v: Partial<View> & { lat: number; lon: number }) => void;
  setView: (v: View) => void;
  setLayers: (patch: Partial<Record<LayerId, boolean>>) => void;
  setFilters: (patch: Partial<Filters>) => void;
  setHighlight: (ids: string[]) => void;
  select: (s: Selection) => void;
  setPanel: (p: MapState["panel"]) => void;
  setForecastWeek: (w: string | null) => void;
  setThree: (on: boolean) => void;
};

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(today.getTime() - n * 86400000));

export const useMap = create<MapState>((set) => ({
  mode: "act",
  sites: [],
  siteNeighborhood: "",
  setSiteNeighborhood: (siteNeighborhood) => set({ siteNeighborhood }),
  featuresInView: [],
  setMode: (mode) => set({ mode }),
  setSites: (sites) => set({ sites }),
  setFeaturesInView: (featuresInView) => set({ featuresInView }),
  view: { lat: 42.32, lon: -71.08, zoom: 11.5 },
  flyToTarget: null,
  layers: initialLayers(),
  bounds: null,
  viewMode: "heat",
  causes: false,
  cellMetric: null,
  setCellMetric: (cellMetric) => set({ cellMetric }),
  setBounds: (bounds) => set({ bounds }),
  setViewMode: (viewMode) => set({ viewMode }),
  setCauses: (causes) => set({ causes }),
  filters: { since: daysAgo(90), until: iso(today), categories: [...CATEGORY_IDS], status: "all" },
  highlight: [],
  selection: null,
  panel: "inspector",
  forecastWeek: null,
  three: false,
  flyTo: (v) => set((s) => ({ view: { ...s.view, ...v }, bounds: null, flyToTarget: { zoom: s.view.zoom, ...v, nonce: Date.now() } })),
  setView: (view) => set({ view }),
  setLayers: (patch) => set((s) => {
    const layers = { ...s.layers, ...patch };
    const nearbyOn = Object.entries(patch).some(([id, on]) => on && isNearbyCategory(id) && !s.layers[id as LayerId]);
    return { layers, filters: { ...s.filters, categories: activeCategories(layers) },
      causes: nearbyOn ? true : activeCategories(layers).some(isNearbyCategory) && s.causes };
  }),
  setFilters: (patch) => set((s) => {
    const filters = { ...s.filters, ...patch };
    if (filters.since > filters.until) throw new Error("Start date must be on or before end date.");
    if (patch.categories == null) return { filters };
    const wanted = patch.categories.length ? patch.categories : CATEGORY_IDS;
    const layers = { ...s.layers };
    for (const id of CATEGORY_IDS) layers[id] = wanted.includes(id);
    return { filters: { ...filters, categories: activeCategories(layers) }, layers,
      causes: wanted.some(isNearbyCategory) };
  }),
  setHighlight: (highlight) => set({ highlight }),
  select: (selection) => set({ selection, panel: selection ? "inspector" : "inspector" }),
  setPanel: (panel) => set({ panel }),
  setForecastWeek: (forecastWeek) => set({ forecastWeek }),
  setThree: (three) => set({ three }),
}));
