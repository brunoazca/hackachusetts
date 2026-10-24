"use client";
import { create } from "zustand";
import type { Polygon } from "geojson";

// Single source of truth for what the map shows. The UI and the agent's
// client-side tools both call these actions, so the agent can "drive" the map.

export type LayerId =
  | "rodent" | "rats_other" | "food" | "shelter" | "displace"
  | "restaurants" | "bigbelly" | "events" | "sites" | "forecast"
  | "heatmap" | "tracts_svi" | "tracts_asthma" | "listings" | "prices";

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

type MapState = {
  view: View;
  flyToTarget: (View & { nonce: number }) | null;
  layers: Record<LayerId, boolean>;
  filters: Filters;
  highlight: string[];             // ids of incidents/places/sites to emphasize
  selection: Selection;
  panel: "inspector" | "insights" | "chat";
  forecastWeek: string | null;     // ISO week_start for the forecast layer
  flyTo: (v: Partial<View> & { lat: number; lon: number }) => void;
  setView: (v: View) => void;
  setLayers: (patch: Partial<Record<LayerId, boolean>>) => void;
  setFilters: (patch: Partial<Filters>) => void;
  setHighlight: (ids: string[]) => void;
  select: (s: Selection) => void;
  setPanel: (p: MapState["panel"]) => void;
  setForecastWeek: (w: string | null) => void;
};

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(today.getTime() - n * 86400000));

export const useMap = create<MapState>((set) => ({
  view: { lat: 42.32, lon: -71.08, zoom: 11.5 },
  flyToTarget: null,
  layers: {
    rodent: true, rats_other: false, food: false, shelter: false, displace: false,
    restaurants: false, bigbelly: false, events: false, sites: true, forecast: false,
    heatmap: false, tracts_svi: false, tracts_asthma: false, listings: false, prices: false,
  },
  filters: { since: daysAgo(90), until: iso(today), categories: [], status: "all" },
  highlight: [],
  selection: null,
  panel: "inspector",
  forecastWeek: null,
  flyTo: (v) => set((s) => ({ flyToTarget: { zoom: s.view.zoom, ...v, nonce: Date.now() } })),
  setView: (view) => set({ view }),
  setLayers: (patch) => set((s) => ({ layers: { ...s.layers, ...patch } })),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setHighlight: (highlight) => set({ highlight }),
  select: (selection) => set({ selection, panel: selection ? "inspector" : "inspector" }),
  setPanel: (panel) => set({ panel }),
  setForecastWeek: (forecastWeek) => set({ forecastWeek }),
}));
