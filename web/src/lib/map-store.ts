"use client";
import { create } from "zustand";
import type { Polygon } from "geojson";

// Single source of truth for what the map shows. The UI and the agent's
// client-side tools both call these actions, so the agent can "drive" the map.

export type LayerId =
  | "rodent" | "rats_other" | "food" | "shelter" | "displace"
  | "restaurants" | "bigbelly" | "events" | "sites" | "forecast"
  | "heatmap" | "tracts_svi" | "tracts_asthma" | "listings" | "prices"
  | "priority";

export type Selection =
  | { kind: "incident" | "place" | "event" | "site" | "cell" | "listing" | "tract"; id: string }
  | { kind: "area"; geojson: Polygon }
  | null;

export type Filters = {
  since: string;          // ISO date
  until: string;          // ISO date
  categories: string[];   // incident category ids (contracts/categories.json); [] = all in enabled layers
  status: "all" | "open" | "closed";
};

export type View = { lat: number; lon: number; zoom: number };

/** assess = Map; act = Places to visit; inspect = every block ranked by expected reports. */
export type Mode = "assess" | "act" | "inspect";

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
  featuresInView: FeatureInView[];
  setMode: (m: Mode) => void;
  setSites: (s: SiteRow[]) => void;
  setFeaturesInView: (f: FeatureInView[]) => void;
  view: View;
  flyToTarget: (View & { nonce: number }) | null;
  layers: Record<LayerId, boolean>;
  filters: Filters;
  highlight: string[];             // ids of incidents/places/sites to emphasize
  selection: Selection;
  panel: "inspector" | "insights" | "chat";
  forecastWeek: string | null;     // ISO week_start for the forecast layer
  three: boolean;                  // pitched camera + extruded buildings at street level
  selectionAt: [number, number] | null; // [lon, lat] of the current selection once the map knows it
  flyTo: (v: Partial<View> & { lat: number; lon: number }) => void;
  setView: (v: View) => void;
  setLayers: (patch: Partial<Record<LayerId, boolean>>) => void;
  setFilters: (patch: Partial<Filters>) => void;
  setHighlight: (ids: string[]) => void;
  select: (s: Selection) => void;
  setPanel: (p: MapState["panel"]) => void;
  setForecastWeek: (w: string | null) => void;
  setThree: (on: boolean) => void;
  setSelectionAt: (at: [number, number] | null) => void;
};

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(today.getTime() - n * 86400000));

export const useMap = create<MapState>((set) => ({
  mode: "assess",
  sites: [],
  featuresInView: [],
  setMode: (mode) => set({ mode }),
  setSites: (sites) => set({ sites }),
  setFeaturesInView: (featuresInView) => set({ featuresInView }),
  view: { lat: 42.32, lon: -71.08, zoom: 11.5 },
  flyToTarget: null,
  layers: {
    rodent: true, rats_other: false, food: false, shelter: false, displace: false,
    restaurants: false, bigbelly: false, events: false, sites: true, forecast: false,
    heatmap: false, tracts_svi: false, tracts_asthma: false, listings: false, prices: false,
    priority: false,
  },
  filters: { since: daysAgo(90), until: iso(today), categories: [], status: "all" },
  highlight: [],
  selection: null,
  panel: "inspector",
  forecastWeek: null,
  three: true,                     // the map opens tilted; "3D" by the zoom controls flattens it
  selectionAt: null,
  flyTo: (v) => set((s) => ({ flyToTarget: { zoom: s.view.zoom, ...v, nonce: Date.now() } })),
  setView: (view) => set({ view }),
  setLayers: (patch) => set((s) => ({ layers: { ...s.layers, ...patch } })),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setHighlight: (highlight) => set({ highlight }),
  select: (selection) => set({ selection, panel: selection ? "inspector" : "inspector" }),
  setPanel: (panel) => set({ panel }),
  setForecastWeek: (forecastWeek) => set({ forecastWeek }),
  setThree: (three) => set({ three }),
  setSelectionAt: (selectionAt) => set({ selectionAt }),
}));
