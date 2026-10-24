"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, NavigationControl, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import type { FeatureCollection, Point, Polygon } from "geojson";
import { setWorkerUrl, type ExpressionSpecification, type HeatmapLayerSpecification } from "maplibre-gl";
import categories from "@/lib/categories.json";
import { useMap, type Mode } from "@/lib/map-store";
import { filterIncidentStatus, type CategoryId } from "@/lib/map-controls";
import { fetchCoverage, fetchIncidentBins, fetchIncidents, fetchSiteQueue, type BBox, type CoverageRow, type IncidentProps } from "@/lib/queries";
import { circle as turfCircle } from "@turf/turf";
import { fetchCellDetail } from "@/lib/forecast";
import { formatDate } from "@/lib/dates";
import ContextLayers from "./ContextLayers";
import MapLegend from "./MapLegend";
import ForecastLayer, { FORECAST_LAYER_IDS } from "./ForecastLayer";
import PriorityLayer, { PRIORITY_LAYER_IDS } from "./PriorityLayer";
import LayerPanel, { activeCategories, HEAT_RAMPS, type ViewMode } from "./LayerPanel";
import InsightPanel from "@/components/insight/InsightPanel";
import FeatureList from "./FeatureList";
import { addCategoryIcons } from "./icons";
import { useTheme } from "@/lib/theme-store";
import { rightInset, useUi } from "@/lib/ui-store";
import { basemap, BASEMAP_STYLE_URL, themes, type ThemeName } from "@/lib/design-tokens";

// Draft map. Each category is its own clustered source, so a cluster only ever counts one kind
// of signal and wears that category's color; individual reports are icons. Owner: map track.

// Piper basemap: OpenFreeMap "dark", recolored per theme (Night / Bone) so roads, water and parks
// read clearly and the data keeps its color. Values: web/src/lib/design-tokens.ts (basemap).
const STYLE = BASEMAP_STYLE_URL;

type MlMapLike = NonNullable<ReturnType<MapRef["getMap"]>>;

// 3D: the basemap's building footprints carry OSM heights, so at street level we can extrude them and
// pitch the camera. (No per-building highlight: tile building ids repeat, so a feature-state on one id
// would light up buildings all over the city. The selected block is shown as a raised slab instead.)
const THREE_LAYER = "piper-3d";
const extrusionColor = (theme: ThemeName) => basemap[theme].building;
function addThreeLayer(map: MlMapLike, theme: ThemeName) {
  if (map.getLayer(THREE_LAYER) || !map.getSource("openmaptiles")) return;
  map.addLayer({
    id: THREE_LAYER, type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 14,
    layout: { visibility: "none" },
    paint: {
      "fill-extrusion-color": extrusionColor(theme),
      // Grow out of the ground between z14 and z15 instead of popping in.
      "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, ["coalesce", ["get", "render_height"], 6]],
      "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, ["coalesce", ["get", "render_min_height"], 0]],
      "fill-extrusion-opacity": 0.92,
      "fill-extrusion-vertical-gradient": true,
    },
  });
  map.setLight({ anchor: "viewport", color: "#ffffff", intensity: 0.45, position: [1.3, 210, 30] });
}

function recolorBasemap(map: MlMapLike, theme: ThemeName) {
  const c = basemap[theme];
  const set = (id: string, prop: string, v: unknown) => { try { (map.setPaintProperty as (a: string, b: string, c: unknown) => void).call(map, id, prop, v); } catch { /* layer lacks prop */ } };
  for (const l of map.getStyle()?.layers ?? []) {
    if (l.id === THREE_LAYER) { set(l.id, "fill-extrusion-color", extrusionColor(theme)); continue; }
    // Only basemap layers; our data layers sit on GeoJSON sources.
    const src = "source" in l && typeof l.source === "string" ? map.getSource(l.source) : undefined;
    if (src?.type === "geojson") continue;
    const id = l.id.toLowerCase();
    if (l.type === "background") set(l.id, "background-color", c.background);
    else if (l.type === "fill") {
      if (/water|ocean|lake|river/.test(id)) set(l.id, "fill-color", c.water);
      else if (/building/.test(id)) { set(l.id, "fill-color", c.building); set(l.id, "fill-outline-color", c.buildingOutline); }
      else if (/park|wood|grass|landcover|landuse|forest|cemetery|pitch|golf/.test(id)) set(l.id, "fill-color", c.park);
      else set(l.id, "fill-color", c.background);
    } else if (l.type === "fill-extrusion") set(l.id, "fill-extrusion-color", c.building);
    else if (l.type === "line") {
      if (/water|river|stream|canal/.test(id)) set(l.id, "line-color", c.water);
      else if (/boundary|admin/.test(id)) set(l.id, "line-color", c.boundary);
      else if (/rail|transit/.test(id)) set(l.id, "line-color", c.rail);
      else if (/motorway|trunk|primary|major/.test(id)) set(l.id, "line-color", c.roadMajor);
      else set(l.id, "line-color", c.roadMinor);
    } else if (l.type === "symbol") {
      if (/poi/.test(id)) { try { map.setLayoutProperty(l.id, "visibility", "none"); } catch { /* */ } continue; }
      set(l.id, "text-color", /road|street|highway|transportation/.test(id) ? c.labelStreet : c.labelPlace);
      set(l.id, "text-halo-color", c.labelHalo);
      set(l.id, "text-halo-width", 1.2);
    }
  }
}
// MapLibre 6's ESM worker can't be resolved by the Next bundler; serve it from /public (postinstall copies it).
if (typeof window !== "undefined") setWorkerUrl("/maplibre-gl-worker.js");

const CATS = categories.incident_categories as Record<string, { label: string; color: string; group: string }>;
type FC = FeatureCollection<Point, IncidentProps>;
const EMPTY: FC = { type: "FeatureCollection", features: [] };
// Below this zoom the server aggregates into cells (~12 px), so nothing is truncated; at or above it, raw points.
const POINTS_ZOOM = 15;
const cellFor = (zoom: number) => (12 * 360) / (512 * 2 ** zoom);
const N = ["coalesce", ["get", "n"], 1] as unknown as ExpressionSpecification;
const TOTAL = ["coalesce", ["get", "total"], N] as unknown as ExpressionSpecification;
const OPEN = ["any", ["==", ["get", "status"], "open"], [">", ["coalesce", ["get", "n_open"], 0], 0]] as unknown as ExpressionSpecification;
const GROUPED = ["any", ["has", "point_count"], [">", N, 1]] as unknown as ExpressionSpecification;
const SINGLE = ["all", ["!", ["has", "point_count"]], ["==", N, 1]] as unknown as ExpressionSpecification;
// Below this zoom a single report is a plain dot; from here on (raw points) it wears its category glyph.
const GLYPH_ZOOM = 15;
// Older reports fade a little so the newest ones read first. Never below half, so nothing disappears.
const AGE_FADE = ["interpolate", ["linear"], ["coalesce", ["get", "age"], 0], 0, 1, 14, 1, 90, 0.85, 365, 0.7] as unknown as ExpressionSpecification;
// Reports from the last week pulse once every 1.5 s.
const FRESH = ["<=", ["coalesce", ["get", "age"], 999], 7] as unknown as ExpressionSpecification;
// Chronic places: one ring per return (up to 4), fading outward — the design spec's "came back" mark.
const RETURN_RINGS = [1, 2, 3, 4];
// Group size grows with the square root of the count (area ~ count) and is capped under half the
// cluster radius (50 px), so two groups can never draw on top of each other.
const CLUSTER_RADIUS = ["interpolate", ["linear"], ["sqrt", TOTAL], 1.4, 9, 3.2, 12, 10, 17, 32, 22] as unknown as ExpressionSpecification;
const COUNT_LABEL = [
  "case", [">=", TOTAL, 1000],
  ["concat", ["to-string", ["/", ["round", ["/", TOTAL, 100]], 10]], "k"],
  ["to-string", TOTAL],
] as unknown as ExpressionSpecification;

// Cluster bookkeeping: how many reports of each family a group holds, and its color from the winner.
const FAMILIES = ["rats", "food", "shelter", "displace"] as const;
const FAMILY_COLOR: Record<string, string> = Object.fromEntries(
  FAMILIES.map((g) => [g, Object.values(CATS).find((c) => c.group === g)?.color ?? "#555"]),
);
const famSum = (g: string) => ["+", ["case", ["==", ["get", "group"], g], N, 0]];
const CLUSTER_PROPS = { total: ["+", N], ...Object.fromEntries(FAMILIES.map((g) => [`f_${g}`, famSum(g)])) };
const fam = (g: string) => ["coalesce", ["get", `f_${g}`], 0];
const beats = (g: string) => ["all", ...FAMILIES.filter((o) => o !== g).map((o) => [">=", fam(g), fam(o)])];
const CLUSTER_COLOR = [
  "case",
  ["has", "point_count"],
  ["case", ...FAMILIES.slice(0, -1).flatMap((g) => [beats(g), FAMILY_COLOR[g]]), FAMILY_COLOR.displace],
  ["match", ["get", "category"], ...Object.entries(CATS).flatMap(([id, c]) => [id, c.color]), "#555"],
] as unknown as ExpressionSpecification;

// Heatmap paint for one family of signals: transparent at zero density, then the family's ramp.
// Each point weighs ~1500/n so a family with many reports (dead animals, trash) doesn't drown the
// other: the map shows where each family concentrates, not which family is bigger.
function heatPaint(ramp: string[], opacity: number, n: number) {
  const w = Math.min(1, Math.max(0.01, 1500 / Math.max(n, 1)));
  return {
    "heatmap-weight": ["*", w, N],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 13, 1, 16, 2],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 8, 13, 16, 16, 30],
    "heatmap-color": [
      "interpolate", ["linear"], ["heatmap-density"],
      // Fade from the ramp's own first color (not transparent black), so edges don't turn gray.
      0, `${ramp[0]}00`, 0.12, ramp[0], 0.3, ramp[1], 0.55, ramp[2], 0.8, ramp[3], 1, ramp[4],
    ],
    // Hot spots are a city-scale view: they fade out by street level, where the real markers take over.
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 12.5, opacity, 14.5, 0],
  } as unknown as HeatmapLayerSpecification["paint"];
}

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const view = useMap((s) => s.view);
  const filters = useMap((s) => s.filters);
  const flyToTarget = useMap((s) => s.flyToTarget);
  const select = useMap((s) => s.select);
  const selection = useMap((s) => s.selection);
  const enabled = useMap((s) => s.layers);
  const setEnabled = useMap((s) => s.setLayers);
  const mode = useMap((s) => s.viewMode);
  const setMode = useMap((s) => s.setViewMode);
  const causes = useMap((s) => s.causes);
  const setCauses = useMap((s) => s.setCauses);
  const highlight = useMap((s) => s.highlight);
  const setFeaturesInView = useMap((s) => s.setFeaturesInView);
  // Block profile remains off until selected in Buildings & people.
  const cellMetric = useMap((s) => s.cellMetric);
  const setCellMetric = useMap((s) => s.setCellMetric);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [zoom, setZoom] = useState(view.zoom);
  useEffect(() => { fetchCoverage().then(setCoverage).catch(() => {}); }, []);
  const [rawData, setData] = useState<FC>(EMPTY);
  const data = useMemo<FC>(() => ({ type: "FeatureCollection", features: filterIncidentStatus(rawData.features.filter(f => enabled[f.properties.category as CategoryId]), filters.status) }), [rawData, filters.status, enabled]);
  const highlighted = useMemo<FC>(() => ({ type: "FeatureCollection", features: data.features.filter(f => f.properties.id && highlight.includes(f.properties.id)) }), [data, highlight]);
  const [iconsReady, setIconsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [, setFlyoutOpen] = useState(false);
  const reqId = useRef(0);

  // "Places to visit" (act) is gone: one map, whatever mode the agent sets.
  const appMode = useMap((s) => (s.mode === "act" ? "assess" : s.mode)) as Mode;
  const theme = useTheme((s) => s.theme);
  const rightOpen = useUi((s) => s.rightOpen);
  const T = themes[theme];
  const forecastOn = useMap((s) => s.layers.forecast);
  // The ranked outlines always mirror the block list; the full tinted grid is the rail switch
  // (or Inspect mode, if the chat agent asks for it), and then the heatmap steps aside.
  const priorityFull = useMap((s) => s.layers.priority) || appMode === "inspect";
  const priorityOn = appMode !== "act";
  const forecastWeek = useMap((s) => s.forecastWeek);
  const three = useMap((s) => s.three);
  const setThree = useMap((s) => s.setThree);
  const sites = useMap((s) => s.sites);
  const setSites = useMap((s) => s.setSites);
  const flyTo = useMap((s) => s.flyTo);
  const setSelectionAt = useMap((s) => s.setSelectionAt);
  // The chronic-place rings need the queue even when the Act panel has never loaded it.
  useEffect(() => {
    if (useMap.getState().sites.length) return;
    fetchSiteQueue(300).then((r) => { if (!useMap.getState().sites.length) setSites(r); }).catch(() => {});
  }, [setSites]);
  const cats = useMemo(() => activeCategories(enabled), [enabled]);
  const viewMode: ViewMode = mode;
  const sitesFC = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: sites.map((r, i) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [r.lon, r.lat] },
      properties: { id: r.id, rank: i + 1, reports: r.reports, returns: r.returns, due: r.due },
    })),
  }), [sites]);
  const chronicFC = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: sites.filter((r) => r.returns > 0).map((r) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [r.lon, r.lat] },
      properties: { id: r.id, returns: r.returns, due: r.due, reports: r.reports, address_block: r.address_block, neighborhood: r.neighborhood },
    })),
  }), [sites]);
  const routeFC = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: sites.length > 1 ? [{
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates: sites.slice(0, 10).map((r) => [r.lon, r.lat]) },
      properties: {},
    }] : [],
  }), [sites]);

  // Where the selection sits on the map (set by a click or a fly-to), for the 100 m context ring.
  const [clicked, setClicked] = useState<{ at: [number, number]; nonce: number } | null>(null);
  const setFocus = useCallback((at: [number, number]) => setClicked({ at, nonce: Date.now() }), []);
  const focus = useMemo<[number, number] | null>(() => {
    if (!selection) return null;
    if (clicked && (!flyToTarget || clicked.nonce >= flyToTarget.nonce)) return clicked.at;
    return flyToTarget ? [flyToTarget.lon, flyToTarget.lat] : null;
  }, [selection, clicked, flyToTarget]);
  // Cards read the selection's coordinates from the store (a report's detail has none of its own).
  useEffect(() => { setSelectionAt(focus); }, [focus, setSelectionAt]);
  // A block picked from the Insights list (not tapped on the map): bring the map to it.
  useEffect(() => {
    if (selection?.kind !== "cell") return;
    if (clicked && Date.now() - clicked.nonce < 1500) return;
    const map = mapRef.current;
    if (!map) return;
    let live = true;
    fetchCellDetail(selection.id).then((d) => {
      if (!live || !d.cell) return;
      flyTo({ lat: d.cell.lat, lon: d.cell.lon, zoom: Math.max(15.5, map.getZoom()) });
    }).catch(() => {});
    return () => { live = false; };
  }, [selection, clicked, flyTo]);
  // For a report or place: the 100 m ring the drivers panel counts within. For a block: the block
  // itself (a 160 m radius covers the 250 m square), drawn by the grid, so only the dimming applies.
  const isBlock = selection?.kind === "cell";
  const ring = useMemo(
    () => (focus && selection ? turfCircle(focus, isBlock ? 0.16 : 0.1, { units: "kilometers", steps: 48 }) : null),
    [focus, selection, isBlock],
  );
  const ringVisible = !!ring && !isBlock;
  // Inside the ring everything stays; outside, markers step back so the selection reads.
  const inRing = useMemo(
    () => (ring && zoom >= (isBlock ? 13 : 14.5) ? ["case", ["within", ring.geometry], 1, 0.3] : 1) as unknown as ExpressionSpecification,
    [ring, zoom, isBlock],
  );

  // Hover card: one feature under the pointer, keyed by id so moving within the same marker is free.
  const [hover, setHover] = useState<{ x: number; y: number; layer: string; p: Record<string, unknown> } | null>(null);
  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) { setHover((h) => (h ? null : h)); return; }
    const keyOf = (layer: string, p: Record<string, unknown>) => `${layer}:${p.id ?? p.cluster_id ?? ""}`;
    const next = { x: e.point.x, y: e.point.y, layer: f.layer.id, p: (f.properties ?? {}) as Record<string, unknown> };
    setHover((h) => (h && keyOf(h.layer, h.p) === keyOf(next.layer, next.p) ? { ...h, x: next.x, y: next.y } : next));
  }, []);
  const onMouseLeave = useCallback(() => setHover(null), []);

  // Everything that should show as markers right now, tagged with its family for cluster colors.
  // Causes join the markers when asked for, or once you reach street level.
  const street = zoom >= 15;
  const clusterFC = useMemo<FC>(() => {
    const on = new Set<string>(cats);
    const ref = Date.parse(filters.until);
    const ageOf = (p: IncidentProps) => {
      if (!Number.isFinite(ref)) return undefined;
      const d = Date.parse(p.opened ?? p.newest ?? "");
      return Number.isFinite(d) ? Math.max(0, Math.round((ref - d) / 86400000)) : undefined;
    };
    const keep = data.features
      .filter((f) => on.has(f.properties.category) && (CATS[f.properties.category]?.group === "rats" || causes || street))
      .map((f) => ({ ...f, properties: { ...f.properties, age: ageOf(f.properties) } }));
    // Reports at the very same spot (one address) would draw exactly on top of each other and look
    // like one. Fold them into one marker with a count; tapping it opens the address with all of them.
    const spots = new globalThis.Map<string, typeof keep>();
    for (const f of keep) {
      const [x, y] = f.geometry.coordinates;
      const k = `${x.toFixed(5)},${y.toFixed(5)}`;
      const arr = spots.get(k);
      if (arr) arr.push(f); else spots.set(k, [f]);
    }
    const features: FC["features"] = [];
    for (const group of spots.values()) {
      const first = group[0];
      if (group.length === 1) {
        features.push({ ...first, properties: { ...first.properties, group: CATS[first.properties.category]?.group ?? "rats" } as IncidentProps });
        continue;
      }
      const n = group.reduce((a, f) => a + (f.properties.n ?? 1), 0);
      const n_open = group.reduce((a, f) => a + (f.properties.n_open ?? (f.properties.status === "open" ? 1 : 0)), 0);
      const counts: Record<string, number> = {};
      for (const f of group) counts[f.properties.category] = (counts[f.properties.category] ?? 0) + (f.properties.n ?? 1);
      const category = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const pick = group.find((f) => f.properties.category === category && f.properties.id) ?? first;
      features.push({ ...pick, properties: { ...pick.properties, category, n, n_open, spot: true, group: CATS[category]?.group ?? "rats" } as IncidentProps });
    }
    return { type: "FeatureCollection", features };
  }, [data, cats, causes, street, filters.until]);

  // Keep the keyboard "features in view" list (FeatureList) in sync with what the map draws.
  // In Act we list the ranked sites; otherwise the single reports with a real id, nearest first.
  useEffect(() => {
    if (appMode === "act") {
      setFeaturesInView(sites.map((r) => ({
        kind: "site" as const,
        id: r.id,
        label: r.address_block ?? "Unnamed block",
        detail: `${r.neighborhood ?? r.city} · ${r.reports} report days · ${r.returns} return days${r.due ? " · review suggested" : ""}`,
        lat: r.lat,
        lon: r.lon,
      })));
      return;
    }
    const rows = clusterFC.features
      .filter((f) => f.properties.id && (!(f.properties.n && f.properties.n > 1) || f.properties.spot))
      .slice(0, 200)
      .map((f) => {
        const [lon, lat] = f.geometry.coordinates as [number, number];
        const cat = CATS[f.properties.category];
        const n = f.properties.n ?? 1;
        return {
          kind: "incident" as const,
          id: String(f.properties.id),
          label: cat?.label ?? f.properties.category,
          detail: `${f.properties.status === "open" ? "Open" : "Closed"}${n > 1 ? ` · ${n} reports here` : ""}`,
          lat,
          lon,
        };
      });
    setFeaturesInView(rows);
  }, [appMode, sites, clusterFC, setFeaturesInView]);

  // "L" toggles the list twin; never while typing (2.1.4).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "");
      if (!typing && !e.metaKey && !e.ctrlKey && (e.key === "l" || e.key === "L")) setListOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Rat reports and the records that explain them never share a group or a count.
  const ratsFC = useMemo<FC>(() => ({ type: "FeatureCollection", features: clusterFC.features.filter((f) => f.properties.group === "rats") }), [clusterFC]);
  const causesFC = useMemo<FC>(() => ({ type: "FeatureCollection", features: clusterFC.features.filter((f) => f.properties.group !== "rats") }), [clusterFC]);

  // Two heatmap families: rat signals vs. everything that explains them.
  const heat = useMemo(() => {
    const rats: FC = { type: "FeatureCollection", features: [] };
    const evidence: FC = { type: "FeatureCollection", features: [] };
    let nRats = 0, nEvidence = 0;
    for (const f of data.features) {
      const n = f.properties.n ?? 1;
      if (CATS[f.properties.category]?.group === "rats") { rats.features.push(f); nRats += n; }
      else { evidence.features.push(f); nEvidence += n; }
    }
    return { rats, evidence, nRats, nEvidence };
  }, [data]);
  const total = useMemo(() => data.features.reduce((a, f) => a + (f.properties.n ?? 1), 0), [data]);
  const showHeat = viewMode !== "points" && !priorityFull;
  // In "Hot spots" mode, groups and markers still appear once you zoom to street level.
  const markerMinZoom = viewMode === "heat" ? 14 : 0;

  // Fetch a padded box and reuse it: pans and small zooms that stay inside it need no request,
  // so the map settles at once. A new request only goes out when the view leaves the box or the
  // data's detail level changes (street points vs. one cell size per zoom step).
  const fetched = useRef<{ key: string; box: BBox } | null>(null);
  const load = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const view: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    const z = map.getZoom();
    const center = map.getCenter();
    useMap.getState().setView({ lat: center.lat, lon: center.lng, zoom: z });
    useMap.getState().setBounds(view);
    setBbox(view);
    setZoom(z);
    const detail = z >= POINTS_ZOOM ? "pts" : `bins${Math.floor(z)}`;
    const key = `${detail}:${cats.join(",")}:${filters.since}:${filters.until}`;
    const f = fetched.current;
    if (f && f.key === key && view[0] >= f.box[0] && view[1] >= f.box[1] && view[2] <= f.box[2] && view[3] <= f.box[3]) return;
    const padX = (view[2] - view[0]) * 0.35, padY = (view[3] - view[1]) * 0.35;
    const box: BBox = [view[0] - padX, view[1] - padY, view[2] + padX, view[3] + padY];
    const id = ++reqId.current;
    if (cats.length === 0) { setData(EMPTY); setLoading(false); setError(null); fetched.current = null; return; }
    if (f?.key !== key) setData(EMPTY);
    setLoading(true);
    try {
      const fc = detail === "pts"
        ? await fetchIncidents(box, cats, filters.since, filters.until)
        : await fetchIncidentBins(box, cats, filters.since, filters.until, cellFor(Math.floor(z)));
      if (id === reqId.current) { setData(fc); setError(null); fetched.current = { key, box }; }
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [cats, filters.since, filters.until]);

  // Layers or dates changed: the cached box no longer matches, fetch again.
  useEffect(() => { load(); }, [load]);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncViewport = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      const b = map.getBounds(), c = map.getCenter();
      useMap.getState().setView({ lat: c.lat, lon: c.lng, zoom: map.getZoom() });
      useMap.getState().setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    }
  }, []);
  const onMoveEnd = useCallback(() => {
    syncViewport();
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => load(), 120);
  }, [load, syncViewport]);

  useEffect(() => () => { if (moveTimer.current) clearTimeout(moveTimer.current); }, []);

  const onLoad = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (process.env.NODE_ENV !== "production" && map) (window as unknown as { __ratmap: unknown }).__ratmap = map;
    if (map) {
      const t = useTheme.getState().theme;
      recolorBasemap(map, t);
      addThreeLayer(map, t);
      await addCategoryIcons(map);
      setIconsReady(true);
    }
    load();
  }, [load]);

  useEffect(() => {
    // In Act the queue covers the left of the map; offset so the target lands in the visible part.
    if (flyToTarget) mapRef.current?.flyTo({
      center: [flyToTarget.lon, flyToTarget.lat], zoom: flyToTarget.zoom, duration: 1200,
      // Land between the floating panels.
      padding: { left: 420, top: 80, right: rightInset(useUi.getState().rightOpen) + 16, bottom: 24 },
    });
  }, [flyToTarget, appMode]);

  // When the right panel slides, glide the map's clear area with it (same 300 ms).
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({ padding: { left: 0, top: 0, bottom: 0, right: rightOpen ? rightInset(true) - rightInset(false) : 0 }, duration: 300 });
  }, [rightOpen]);

  // Theme switch: recolor the basemap in place.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map && iconsReady) recolorBasemap(map, theme);
  }, [theme, iconsReady]);

  // 3D on: tilt the camera and raise the buildings. Off: back to a flat, north-up map.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !iconsReady) return;
    if (map.getLayer(THREE_LAYER)) map.setLayoutProperty(THREE_LAYER, "visibility", three ? "visible" : "none");
    map.easeTo({ pitch: three ? 35 : 0, bearing: three ? -18 : 0, duration: 900 });
  }, [three, iconsReady]);

  // Fresh reports pulse: a ring that grows and fades, 1.5 s per beat, only at marker zooms.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !iconsReady || zoom < 14) return;
    let raf = 0;
    const tick = (now: number) => {
      const t = (now % 1500) / 1500;
      if (map.getLayer("all-pulse")) {
        map.setPaintProperty("all-pulse", "circle-radius", 6 + 16 * t);
        map.setPaintProperty("all-pulse", "circle-stroke-opacity", 0.6 * (1 - t));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [iconsReady, zoom]);

  const interactive = useMemo(
    () => [...(appMode === "act" && enabled.sites ? ["sites"] : []), ...(enabled.ctx_buildings && zoom >= 15 ? ["ctx-buildings"] : []), ...(cellMetric ? ["ctx-cells"] : []), ...(iconsReady ? ["all-clusters", "all-dots", "all-points", "cause-clusters", "cause-dots", "cause-points", "chronic-hit"] : []), ...(forecastOn ? FORECAST_LAYER_IDS : []), ...(priorityOn ? PRIORITY_LAYER_IDS : [])],
    [iconsReady, appMode, enabled.sites, enabled.ctx_buildings, cellMetric, zoom, forecastOn, priorityOn],
  );

  // A tap on empty map flies there and opens the closest real report.
  const pending = useRef<[number, number] | null>(null);
  const nearest = useCallback((at: [number, number], withId: boolean) => {
    const map = mapRef.current;
    if (!map) return null;
    const p = map.project(at);
    let best: (typeof clusterFC.features)[number] | null = null, bestD = Infinity;
    for (const f of clusterFC.features) {
      if (withId && (!f.properties.id || ((f.properties.n ?? 1) > 1 && !f.properties.spot))) continue;
      const q = map.project(f.geometry.coordinates as [number, number]);
      const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (d < bestD) { bestD = d; best = f; }
    }
    return best;
  }, [clusterFC]);

  // Once the street-level points arrive after a fly-in, pick the closest one.
  useEffect(() => {
    const at = pending.current;
    if (!at || zoom < POINTS_ZOOM) return;
    const f = nearest(at, true);
    if (!f) return;
    pending.current = null;
    setFocus(f.geometry.coordinates as [number, number]);
    select({ kind: "incident", id: String(f.properties.id) });
  }, [clusterFC, zoom, nearest, select, setFocus]);

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) {
      const at: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const near = nearest(at, true);
      const map = mapRef.current;
      if (near && (map?.getZoom() ?? 0) >= POINTS_ZOOM) {
        setFocus(near.geometry.coordinates as [number, number]);
        select({ kind: "incident", id: String(near.properties.id) });
        map?.easeTo({ center: near.geometry.coordinates as [number, number], duration: 500 });
        return;
      }
      const target = (nearest(at, false)?.geometry.coordinates as [number, number] | undefined) ?? at;
      pending.current = target;
      map?.easeTo({ center: target, zoom: Math.max(POINTS_ZOOM + 1, map.getZoom()), duration: 700 });
      return;
    }
    if (f.layer.id === "forecast-hit" || f.layer.id === "priority-hit" || f.layer.id === "ctx-cells") {
      const g = f.geometry as Polygon;
      const ringCoords = g.coordinates?.[0] ?? [];
      if (ringCoords.length) {
        const n = ringCoords.length;
        const c: [number, number] = [ringCoords.reduce((a, p) => a + p[0], 0) / n, ringCoords.reduce((a, p) => a + p[1], 0) / n];
        setFocus(c);
        mapRef.current?.easeTo({ center: c, zoom: Math.max(mapRef.current.getZoom(), 15.5), duration: 700 });
      }
      select({ kind: "cell", id: String(f.properties?.id) });
      return;
    }
    const at = (f.geometry as Point).coordinates as [number, number];
    if (f.properties?.spot && f.properties?.id) {
      setFocus(at);
      select({ kind: "incident", id: String(f.properties.id) });
      return;
    }
    if (f.layer.id.endsWith("-clusters") || !f.properties?.id) {
      mapRef.current?.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom: (mapRef.current?.getZoom() ?? 12) + 2 });
      return;
    }
    if (f.layer.id === "ctx-buildings") {
      select({ kind: "place", id: `parcel:${f.properties?.pid}` });
      return;
    }
    if (f.layer.id === "sites" || f.layer.id === "chronic-hit") {
      setFocus(at);
      select({ kind: "site", id: String(f.properties?.id) });
      return;
    }
    setFocus(at);
    select({ kind: "incident", id: String(f.properties?.id) });
  }, [select, nearest, setFocus]);

  const selectedId = selection && "id" in selection ? selection.id : "";

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        initialViewState={{ latitude: view.lat, longitude: view.lon, zoom: view.zoom, pitch: useMap.getState().three ? 35 : 0, bearing: useMap.getState().three ? -18 : 0 }}
        mapStyle={STYLE}
        onLoad={onLoad}
        onMove={syncViewport}
        onResize={syncViewport}
        onMoveEnd={onMoveEnd}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        interactiveLayerIds={interactive}
        cursor="pointer"
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="bottom-right" />
        <ContextLayers cats={cats} coverage={coverage} housing={!!enabled.ctx_housing} buildings={!!enabled.ctx_buildings} bbox={bbox} zoom={zoom} cellMetric={cellMetric} />
        <ForecastLayer visible={forecastOn} period={forecastWeek ?? "4w"} bbox={bbox} selectedId={selectedId} />
        <PriorityLayer visible={priorityOn} full={priorityFull} three={three} selectedId={selection?.kind === "cell" ? selectedId : ""} week={forecastWeek} T={T} />
        {/* Evidence first so the rat heatmap draws on top. */}
        <Source id="heat-evidence" type="geojson" data={heat.evidence}>
          <Layer id="heat-evidence" type="heatmap" layout={{ visibility: showHeat && causes ? "visible" : "none" }} paint={heatPaint(HEAT_RAMPS.evidence, 0.7, heat.nEvidence)} />
        </Source>
        <Source id="heat-rats" type="geojson" data={heat.rats}>
          <Layer id="heat-rats" type="heatmap" layout={{ visibility: showHeat ? "visible" : "none" }} paint={heatPaint(HEAT_RAMPS.rats, 0.75, heat.nRats)} />
        </Source>
        <Source id="chat-highlight" type="geojson" data={highlighted}>
          <Layer id="chat-highlight" type="circle" paint={{ "circle-radius": 23, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": T.fg, "circle-stroke-width": 4 }} />
        </Source>
        {iconsReady && (
          // Evidence (trash, shelter, works): its own clustered source, hollow and quieter, under the rat
          // markers, so a count on the map is always "rat reports" or "records", never a mix of both.
          <Source
            id="src-causes" type="geojson" data={causesFC}
            cluster clusterMaxZoom={16} clusterRadius={40}
            clusterProperties={CLUSTER_PROPS}
          >
            <Layer
              id="cause-clusters"
              type="circle"
              minzoom={markerMinZoom}
              filter={GROUPED}
              paint={{
                "circle-color": CLUSTER_COLOR,
                "circle-opacity": ["*", 0.08, inRing],
                "circle-radius": ["interpolate", ["linear"], ["sqrt", TOTAL], 1.4, 8, 3.2, 10, 10, 14, 32, 17],
                "circle-stroke-color": CLUSTER_COLOR,
                "circle-stroke-width": 1.25,
                "circle-stroke-opacity": ["*", 0.8, inRing],
                "circle-pitch-alignment": "map",
                "circle-pitch-scale": "viewport",
              }}
            />
            <Layer
              id="cause-cluster-count"
              type="symbol"
              minzoom={markerMinZoom}
              filter={GROUPED}
              layout={{
                "text-field": COUNT_LABEL,
                "text-size": ["interpolate", ["linear"], ["sqrt", TOTAL], 1.4, 10, 10, 12],
                "text-font": ["Noto Sans Regular"],
                "text-allow-overlap": false,
                "text-padding": 0,
                "symbol-sort-key": ["-", 0, TOTAL],
              }}
              paint={{ "text-color": T.fg2, "text-halo-color": T.bg, "text-halo-width": 1.1 }}
            />
            <Layer
              id="cause-selected"
              type="circle"
              filter={["==", ["get", "id"], selectedId]}
              paint={{ "circle-radius": 15, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": T.fg, "circle-stroke-width": 2 }}
            />
            <Layer
              id="cause-dots"
              type="circle"
              minzoom={markerMinZoom}
              maxzoom={GLYPH_ZOOM}
              filter={SINGLE}
              layout={{ "circle-sort-key": ["case", OPEN, 2, 1] }}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 2.5, 16, 4.5],
                "circle-color": CLUSTER_COLOR,
                "circle-opacity": ["case", OPEN, ["*", 0.8, AGE_FADE, inRing], 0],
                "circle-stroke-color": CLUSTER_COLOR,
                "circle-stroke-width": 1,
                "circle-stroke-opacity": ["*", 0.7, AGE_FADE, inRing],
                "circle-pitch-alignment": "map",
                "circle-pitch-scale": "viewport",
              }}
            />
            <Layer
              id="cause-points"
              type="symbol"
              minzoom={GLYPH_ZOOM}
              filter={SINGLE}
              layout={{
                "icon-image": ["concat", "cat-", ["get", "category"], ["case", OPEN, "", "-closed"]],
                "icon-size": ["interpolate", ["linear"], ["zoom"], 15, 0.75, 17, 1, 19, 1.3],
                "icon-allow-overlap": true,
                "symbol-sort-key": ["case", OPEN, 1, 0],
              }}
              paint={{ "icon-opacity": ["*", AGE_FADE, inRing] }}
            />
          </Source>
        )}
        {iconsReady && (
          // Rat reports: one clustered source. A group takes the color of the rat family it holds most of.
          <Source
            id="src-all" type="geojson" data={ratsFC}
            cluster clusterMaxZoom={16} clusterRadius={50}
            clusterProperties={CLUSTER_PROPS}
          >
            {/* Groups: a thin ring in the family color over a translucent fill, count in the text color. */}
            <Layer
              id="all-clusters"
              type="circle"
              minzoom={markerMinZoom}
              filter={GROUPED}
              paint={{
                "circle-color": CLUSTER_COLOR,
                "circle-opacity": ["*", 0.22, inRing],
                "circle-radius": CLUSTER_RADIUS,
                "circle-stroke-color": CLUSTER_COLOR,
                "circle-stroke-width": 1.5,
                "circle-stroke-opacity": ["*", 0.95, inRing],
                "circle-pitch-alignment": "map",
                "circle-pitch-scale": "viewport",
              }}
            />
            <Layer
              id="all-cluster-count"
              type="symbol"
              minzoom={markerMinZoom}
              filter={GROUPED}
              layout={{
                "text-field": COUNT_LABEL,
                "text-size": ["interpolate", ["linear"], ["sqrt", TOTAL], 1.4, 11, 10, 13],
                "text-font": ["Noto Sans Bold"],
                "text-allow-overlap": false,
                "text-padding": 0,
                "symbol-sort-key": ["-", 0, TOTAL],
              }}
              paint={{ "text-color": T.fg, "text-halo-color": T.bg, "text-halo-width": 1.2 }}
            />
            {/* Selection: a soft glow under a crisp ring. */}
            <Layer
              id="all-selected-glow"
              type="circle"
              filter={["==", ["get", "id"], selectedId]}
              paint={{ "circle-radius": 26, "circle-color": T.fg, "circle-opacity": 0.14, "circle-blur": 0.8 }}
            />
            <Layer
              id="all-selected"
              type="circle"
              filter={["==", ["get", "id"], selectedId]}
              paint={{ "circle-radius": 15, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": T.fg, "circle-stroke-width": 2 }}
            />
            {/* Single reports below glyph zoom: small dots. Open = filled, closed = hollow ring. */}
            <Layer
              id="all-dots"
              type="circle"
              minzoom={markerMinZoom}
              maxzoom={GLYPH_ZOOM}
              filter={SINGLE}
              layout={{ "circle-sort-key": ["case", OPEN, 2, 1] }}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 3, 16, 5.5],
                "circle-color": CLUSTER_COLOR,
                "circle-opacity": ["case", OPEN, ["*", 0.95, AGE_FADE, inRing], 0],
                "circle-stroke-color": ["case", OPEN, "rgba(0,0,0,0.35)", CLUSTER_COLOR],
                "circle-stroke-width": ["case", OPEN, 1, 1.25],
                "circle-stroke-opacity": ["case", OPEN, inRing, ["*", 0.8, AGE_FADE, inRing]],
                "circle-pitch-alignment": "map",
                "circle-pitch-scale": "viewport",
              }}
            />
            {/* Single reports at street level: category glyphs. Open ones draw above closed ones. */}
            <Layer
              id="all-points"
              type="symbol"
              minzoom={GLYPH_ZOOM}
              filter={SINGLE}
              layout={{
                "icon-image": ["concat", "cat-", ["get", "category"], ["case", OPEN, "", "-closed"]],
                "icon-size": ["interpolate", ["linear"], ["zoom"], 15, 0.85, 17, 1.15, 19, 1.5],
                "icon-allow-overlap": true,
                "symbol-sort-key": ["case", OPEN, 1, 0],
              }}
              paint={{ "icon-opacity": ["*", AGE_FADE, inRing] }}
            />
            {/* Fresh open reports (last 7 days): an expanding ring, animated from the effect above. */}
            <Layer
              id="all-pulse"
              type="circle"
              minzoom={14}
              filter={["all", SINGLE, OPEN, FRESH]}
              paint={{ "circle-radius": 6, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": CLUSTER_COLOR, "circle-stroke-width": 1.5, "circle-stroke-opacity": 0.4, "circle-pitch-alignment": "map", "circle-pitch-scale": "viewport" }}
            />
          </Source>
        )}
        {/* Chronic places: concentric rings, one per return, in both modes. In Map mode a small core opens the place. */}
        <Source id="chronic" type="geojson" data={chronicFC}>
          {RETURN_RINGS.map((i) => (
            <Layer
              key={i}
              id={`chronic-ring-${i}`}
              type="circle"
              minzoom={13}
              filter={["<=", i, ["min", ["get", "returns"], RETURN_RINGS.length]]}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, (8 + 6 * i) * 0.55, 15, 8 + 6 * i, 17, (8 + 6 * i) * 1.3],
                "circle-color": "rgba(0,0,0,0)",
                "circle-stroke-color": T.returned,
                "circle-stroke-width": 1.25,
                "circle-stroke-opacity": ["*", 1 - 0.2 * i, inRing],
                "circle-pitch-alignment": "map",
                "circle-pitch-scale": "viewport",
              }}
            />
          ))}
          <Layer
            id="chronic-hit"
            type="circle"
            minzoom={13}
            layout={{ visibility: appMode === "act" ? "none" : "visible" }}
            paint={{ "circle-radius": 7, "circle-color": T.returned, "circle-opacity": ["*", 0.9, inRing], "circle-stroke-color": T.bg, "circle-stroke-width": 1.5 }}
          />
        </Source>
        {/* 100 m context ring around the selection: the radius the drivers panel counts within. */}
        {ringVisible && ring && (
          <Source id="ctx-ring" type="geojson" data={ring}>
            <Layer id="ctx-ring-fill" type="fill" minzoom={14.5} paint={{ "fill-color": T.fg, "fill-opacity": 0.05 }} />
            <Layer id="ctx-ring-line" type="line" minzoom={14.5} paint={{ "line-color": T.fg, "line-width": 1.2, "line-opacity": 0.8, "line-dasharray": [3, 3] }} />
            <Layer
              id="ctx-ring-label"
              type="symbol"
              minzoom={15}
              layout={{ "text-field": "100 m", "text-size": 11, "text-font": ["Noto Sans Bold"], "symbol-placement": "line", "text-letter-spacing": 0.05 }}
              paint={{ "text-color": T.fg2, "text-halo-color": T.bg, "text-halo-width": 1.2 }}
            />
          </Source>
        )}
        {appMode === "act" && (
          <Source id="route" type="geojson" data={routeFC}>
            <Layer id="route" type="line" minzoom={11} paint={{ "line-color": T.fg3, "line-width": 1.5, "line-opacity": 0.7, "line-dasharray": [2, 3] }} />
          </Source>
        )}
        {appMode === "act" && enabled.sites && (
          <Source id="sites" type="geojson" data={sitesFC}>
            <Layer
              id="sites"
              type="circle"
              layout={{ "circle-sort-key": ["-", 0, ["get", "rank"]] }}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["get", "returns"], 0, 7, 10, 11, 20, 14],
                "circle-color": ["case", ["get", "due"], T.returned, T.fg3],
                "circle-opacity": 0.95,
                "circle-stroke-color": ["case", ["any", ["==", ["get", "id"], selectedId], ["in", ["get", "id"], ["literal", highlight]]], T.fg, T.bg],
                "circle-stroke-width": ["case", ["any", ["==", ["get", "id"], selectedId], ["in", ["get", "id"], ["literal", highlight]]], 4, 2],
              }}
            />
            <Layer
              id="sites-rank"
              type="symbol"
              layout={{ "text-field": ["to-string", ["get", "rank"]], "text-size": 11, "text-font": ["Noto Sans Bold"], "text-allow-overlap": false, "symbol-sort-key": ["get", "rank"] }}
              paint={{ "text-color": T.bg }}
            />
          </Source>
        )}
      </Map>

      {hover && <HoverCard hover={hover} />}

      <button
        type="button"
        aria-pressed={three}
        onClick={() => setThree(!three)}
        title={three ? "Back to a flat map" : "3D buildings (zoom to street level)"}
        className="glass absolute z-10 h-10 w-10 rounded-md text-[12px] font-bold text-fg-2 transition-colors hover:text-fg aria-pressed:bg-fg aria-pressed:text-bg"
        style={{ right: "calc(var(--right-inset, 84px) + 10px)", bottom: "calc(var(--ctrl-bottom, 4px) + 172px)" }}
      >
        3D
      </button>

      {/* One map: the Insight panel on the left (ranking, or whatever is selected), the layer and
          filter bar along the bottom. Spec: insights-severity-ranking.md §12. */}
      <InsightPanel />
      <LayerPanel enabled={enabled} onChange={setEnabled} mode={mode} onModeChange={setMode} causes={causes} onCausesChange={setCauses} count={total} loading={loading} coverage={coverage} zoom={zoom} cellMetric={cellMetric} onCellMetricChange={setCellMetric} onOpenChange={setFlyoutOpen} />

      {/* Keyboard twin of the map (R2.11 / R9.1). In Act, the Places queue is already the list
          twin, so this only appears in Assess/Map mode. Reachable by Tab and by the "L" shortcut. */}
      {appMode !== "act" && listOpen && <FeatureList onClose={() => setListOpen(false)} />}
      {/* Bottom-left map key, offset right of the 384 px left panel. */}
      {appMode !== "act" && (
        <div
          className="absolute z-20 flex flex-col items-start gap-2 transition-[left,bottom] duration-300 ease-[var(--ease-spring)]"
          style={{ left: 12 + 384 + 8, bottom: "calc(var(--ctrl-bottom, 4px) + 72px)" }}
        >
          <MapLegend mode={viewMode} causes={causes} zoom={zoom} priority={priorityFull} />
        </div>
      )}

      {error && (
        <div role="alert" className="absolute bottom-4 left-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-900 shadow">
          Could not load reports: {error}
        </div>
      )}
      {zoom >= POINTS_ZOOM && rawData.features.length >= 20000 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-amber-50 px-3 py-1.5 text-sm text-amber-950 shadow">
          Showing the newest 20,000 reports — zoom in or shorten the period to see all of them.
        </div>
      )}
    </div>
  );
}

/** Small card next to the pointer: what the marker under it is, in plain words. */
function HoverCard({ hover }: { hover: { x: number; y: number; layer: string; p: Record<string, unknown> } }) {
  const { layer, p } = hover;
  const num = (k: string) => (typeof p[k] === "number" ? (p[k] as number) : Number(p[k]) || 0);
  let eyebrow = "", title = "", meta = "";
  if (layer === "priority-hit") {
    eyebrow = `Priority block · #${num("rank")} of the city`;
    title = String(p.label ?? p.neighborhood ?? "Block");
    const band = typeof p.band === "string" ? p.band.replace("_", " ") : null;
    meta = [p.label && p.neighborhood ? String(p.neighborhood) : null, `${num("expected").toFixed(1)} reports expected`, band, p.emerging ? "emerging" : null].filter(Boolean).join(" · ");
  } else if (layer === "sites" || layer === "chronic-hit") {
    eyebrow = "Place to visit";
    title = String(p.address_block ?? p.neighborhood ?? "Chronic address");
    meta = `${num("reports")} report days · ${num("returns")} return days${p.due ? " · review suggested" : ""}`;
  } else if (layer === "all-clusters" && (p.cluster || p.point_count)) {
    eyebrow = "Group";
    title = `${num("total") || num("point_count")} reports`;
    meta = "Click to zoom in";
  } else {
    const cat = CATS[String(p.category)];
    const n = num("n") || 1;
    const open = p.status === "open" || num("n_open") > 0;
    eyebrow = cat?.label ?? String(p.category ?? "Report");
    title = n > 1 ? `${n} reports at this address` : open ? "Open report" : "Closed report";
    const when = typeof p.opened === "string" ? formatDate(p.opened) : typeof p.newest === "string" ? formatDate(p.newest) : null;
    meta = [n > 1 ? `${num("n_open")} open` : null, when ? `${n > 1 ? "newest" : "opened"} ${when}` : null, p.city ? String(p.city) : null].filter(Boolean).join(" · ");
  }
  return (
    <div
      role="tooltip"
      className="glass pointer-events-none absolute z-20 w-[220px] rounded-lg px-3 py-2 text-[12px] leading-4"
      style={{ left: hover.x + 14, top: hover.y + 14 }}
    >
      <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-fg-3">{eyebrow}</div>
      <div className="truncate font-semibold text-fg">{title}</div>
      {meta && <div className="truncate text-fg-2">{meta}</div>}
    </div>
  );
}
