"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, NavigationControl, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import { setWorkerUrl, type ExpressionSpecification, type HeatmapLayerSpecification } from "maplibre-gl";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";
import { fetchCoverage, fetchIncidentBins, fetchIncidents, type BBox, type CoverageRow, type IncidentProps } from "@/lib/queries";
import ContextLayers from "./ContextLayers";
import MapLegend from "./MapLegend";
import ForecastLayer, { FORECAST_LAYER_IDS } from "./ForecastLayer";
import LayerPanel, { activeCategories, HEAT_RAMPS, type ViewMode } from "./LayerPanel";
import SiteQueue from "@/components/act/SiteQueue";
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
function recolorBasemap(map: MlMapLike, theme: ThemeName) {
  const c = basemap[theme];
  const set = (id: string, prop: string, v: unknown) => { try { (map.setPaintProperty as (a: string, b: string, c: unknown) => void).call(map, id, prop, v); } catch { /* layer lacks prop */ } };
  for (const l of map.getStyle()?.layers ?? []) {
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
  // All data by default: every incident layer on, shown as heatmaps (icons appear from zoom 15).
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => Object.fromEntries(Object.keys(CATS).map((c) => [c, true])),
  );
  const [mode, setMode] = useState<ViewMode>("heat");
  // Causes (trash, vacant lots, works) are context for rats, not the headline: off until asked for.
  const [causes, setCauses] = useState(false);
  // Block profile (demographics, building age per 250 m cell): off until picked in "Buildings & people".
  const [cellMetric, setCellMetric] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [zoom, setZoom] = useState(view.zoom);
  useEffect(() => { fetchCoverage().then(setCoverage).catch(() => {}); }, []);
  const [data, setData] = useState<FC>(EMPTY);
  const [iconsReady, setIconsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const appMode = useMap((s) => s.mode);
  const theme = useTheme((s) => s.theme);
  const rightOpen = useUi((s) => s.rightOpen);
  const T = themes[theme];
  const forecastOn = useMap((s) => s.layers.forecast);
  const forecastWeek = useMap((s) => s.forecastWeek);
  const sites = useMap((s) => s.sites);
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

  // Everything that should show as markers right now, tagged with its family for cluster colors.
  // Causes join the markers when asked for, or once you reach street level.
  const street = zoom >= 15;
  const clusterFC = useMemo<FC>(() => {
    const on = new Set(cats);
    const keep = data.features.filter((f) => on.has(f.properties.category) && (CATS[f.properties.category]?.group === "rats" || causes || street));
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
  }, [data, cats, causes, street]);

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
  const showHeat = viewMode !== "points";
  // In "Hot spots" mode, groups and markers still appear once you zoom to street level.
  const markerMinZoom = viewMode === "heat" ? 14 : 0;

  // Fetch a padded box and reuse it: pans and small zooms that stay inside it need no request,
  // so the map settles at once. A new request only goes out when the view leaves the box or the
  // data's detail level changes (street points vs. one cell size per zoom step).
  const fetched = useRef<{ key: string; box: BBox } | null>(null);
  const load = useCallback(async (force = false) => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const view: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    const z = map.getZoom();
    setZoom(z);
    const key = z >= POINTS_ZOOM ? "pts" : `bins${Math.floor(z)}`;
    const f = fetched.current;
    if (!force && f && f.key === key && view[0] >= f.box[0] && view[1] >= f.box[1] && view[2] <= f.box[2] && view[3] <= f.box[3]) return;
    const padX = (view[2] - view[0]) * 0.35, padY = (view[3] - view[1]) * 0.35;
    const box: BBox = [view[0] - padX, view[1] - padY, view[2] + padX, view[3] + padY];
    const id = ++reqId.current;
    if (cats.length === 0) { setData(EMPTY); fetched.current = null; return; }
    setLoading(true);
    try {
      const fc = key === "pts"
        ? await fetchIncidents(box, cats, filters.since, filters.until)
        : await fetchIncidentBins(box, cats, filters.since, filters.until, cellFor(Math.floor(z)));
      if (id === reqId.current) { setData(fc); setBbox(box); setError(null); fetched.current = { key, box }; }
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [cats, filters.since, filters.until]);

  // Layers or dates changed: the cached box no longer matches, fetch again.
  useEffect(() => { load(true); }, [load]);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveEnd = useCallback(() => {
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => load(), 120);
  }, [load]);

  const onLoad = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (process.env.NODE_ENV !== "production" && map) (window as unknown as { __ratmap: unknown }).__ratmap = map;
    if (map) { recolorBasemap(map, useTheme.getState().theme); await addCategoryIcons(map); setIconsReady(true); }
    load();
  }, [load]);

  useEffect(() => {
    // In Act the queue covers the left of the map; offset so the target lands in the visible part.
    if (flyToTarget) mapRef.current?.flyTo({
      center: [flyToTarget.lon, flyToTarget.lat], zoom: flyToTarget.zoom, duration: 1200,
      // Land between the floating panels.
      padding: { left: appMode === "act" ? 420 : 80, top: 80, right: rightInset(useUi.getState().rightOpen) + 16, bottom: 24 },
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

  const interactive = useMemo(
    () => [...(appMode === "act" ? ["sites"] : []), ...(enabled.ctx_buildings && zoom >= 15 ? ["ctx-buildings"] : []), ...(cellMetric ? ["ctx-cells"] : []), ...(iconsReady ? ["all-clusters", "all-points"] : []), ...(forecastOn ? FORECAST_LAYER_IDS : [])],
    [iconsReady, appMode, enabled.ctx_buildings, cellMetric, zoom, forecastOn],
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
    select({ kind: "incident", id: String(f.properties.id) });
  }, [clusterFC, zoom, nearest, select]);

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) {
      const at: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const near = nearest(at, true);
      const map = mapRef.current;
      if (near && (map?.getZoom() ?? 0) >= POINTS_ZOOM) {
        select({ kind: "incident", id: String(near.properties.id) });
        map?.easeTo({ center: near.geometry.coordinates as [number, number], duration: 500 });
        return;
      }
      const target = (nearest(at, false)?.geometry.coordinates as [number, number] | undefined) ?? at;
      pending.current = target;
      map?.easeTo({ center: target, zoom: Math.max(POINTS_ZOOM + 1, map.getZoom()), duration: 700 });
      return;
    }
    if (f.layer.id === "forecast-hit" || f.layer.id === "ctx-cells") {
      select({ kind: "cell", id: String(f.properties?.id) });
      return;
    }
    if (f.properties?.spot && f.properties?.id) {
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
    if (f.layer.id === "sites") {
      select({ kind: "site", id: String(f.properties?.id) });
      return;
    }
    select({ kind: "incident", id: String(f.properties?.id) });
  }, [select, nearest]);

  const selectedId = selection && "id" in selection ? selection.id : "";

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        initialViewState={{ latitude: view.lat, longitude: view.lon, zoom: view.zoom }}
        mapStyle={STYLE}
        onLoad={onLoad}
        onMoveEnd={onMoveEnd}
        onClick={onClick}
        interactiveLayerIds={interactive}
        cursor="pointer"
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="bottom-right" />
        <ContextLayers cats={cats} coverage={coverage} housing={!!enabled.ctx_housing} buildings={!!enabled.ctx_buildings} bbox={bbox} zoom={zoom} cellMetric={cellMetric} />
        <ForecastLayer visible={forecastOn} period={forecastWeek ?? "4w"} bbox={bbox} selectedId={selectedId} />
        {/* Evidence first so the rat heatmap draws on top. */}
        <Source id="heat-evidence" type="geojson" data={heat.evidence}>
          <Layer id="heat-evidence" type="heatmap" layout={{ visibility: showHeat && causes ? "visible" : "none" }} paint={heatPaint(HEAT_RAMPS.evidence, 0.7, heat.nEvidence)} />
        </Source>
        <Source id="heat-rats" type="geojson" data={heat.rats}>
          <Layer id="heat-rats" type="heatmap" layout={{ visibility: showHeat ? "visible" : "none" }} paint={heatPaint(HEAT_RAMPS.rats, 0.75, heat.nRats)} />
        </Source>
        {iconsReady && (
          // One clustered source for every visible kind, so groups never stack on top of each other.
          // A group takes the color of whichever family (rats, food, shelter, works) it holds most of.
          <Source
            id="src-all" type="geojson" data={clusterFC}
            cluster clusterMaxZoom={16} clusterRadius={50}
            clusterProperties={CLUSTER_PROPS}
          >
            <Layer
              id="all-clusters"
              type="circle"
              minzoom={markerMinZoom}
              filter={["any", ["has", "point_count"], [">", N, 1]]}
              paint={{
                "circle-color": CLUSTER_COLOR,
                "circle-opacity": 0.95,
                "circle-radius": ["step", ["coalesce", ["get", "total"], N], 12, 25, 15, 100, 19, 500, 24],
                "circle-stroke-color": CLUSTER_COLOR,
                "circle-stroke-width": 6,
                "circle-stroke-opacity": 0.25,
              }}
            />
            <Layer
              id="all-cluster-count"
              type="symbol"
              minzoom={markerMinZoom}
              filter={["any", ["has", "point_count"], [">", N, 1]]}
              layout={{
                "text-field": ["to-string", ["coalesce", ["get", "total"], N]],
                "text-size": 13,
                "text-font": ["Noto Sans Bold"],
                "text-allow-overlap": true,
              }}
              paint={{ "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.35)", "text-halo-width": 1 }}
            />
            <Layer
              id="all-selected"
              type="circle"
              filter={["==", ["get", "id"], selectedId]}
              paint={{ "circle-radius": 19, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": T.fg, "circle-stroke-width": 2.5 }}
            />
            <Layer
              id="all-points"
              type="symbol"
              minzoom={markerMinZoom}
              filter={["all", ["!", ["has", "point_count"]], ["==", N, 1]]}
              layout={{
                "icon-image": ["concat", "cat-", ["get", "category"], ["case", ["any", ["==", ["get", "status"], "open"], [">", ["coalesce", ["get", "n_open"], 0], 0]], "", "-closed"]],
                "icon-size": ["interpolate", ["linear"], ["zoom"], 13, 0.75, 17, 1.1],
                "icon-allow-overlap": true,
              }}
              paint={{ "icon-opacity": 1 }}
            />
          </Source>
        )}
        {appMode === "act" && (
          <Source id="sites" type="geojson" data={sitesFC}>
            <Layer
              id="sites"
              type="circle"
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["get", "returns"], 0, 9, 10, 15, 20, 20],
                "circle-color": ["case", ["get", "due"], T.returned, T.fg3],
                "circle-opacity": 0.95,
                "circle-stroke-color": ["case", ["==", ["get", "id"], selectedId], T.fg, T.bg],
                "circle-stroke-width": ["case", ["==", ["get", "id"], selectedId], 4, 2],
              }}
            />
            <Layer
              id="sites-rank"
              type="symbol"
              layout={{ "text-field": ["to-string", ["get", "rank"]], "text-size": 12, "text-font": ["Noto Sans Bold"], "text-allow-overlap": true }}
              paint={{ "text-color": T.bg }}
            />
          </Source>
        )}
      </Map>

      {appMode === "act" ? (
        <SiteQueue />
      ) : (
        <LayerPanel enabled={enabled} onChange={setEnabled} mode={mode} onModeChange={setMode} causes={causes} onCausesChange={setCauses} count={total} loading={loading} coverage={coverage} zoom={zoom} cellMetric={cellMetric} onCellMetricChange={setCellMetric} />
      )}

      {appMode !== "act" && <MapLegend mode={viewMode} causes={causes} zoom={zoom} />}

      {error && (
        <div role="alert" className="absolute bottom-4 left-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-900 shadow">
          Could not load reports: {error}
        </div>
      )}
      {zoom >= POINTS_ZOOM && data.features.length >= 20000 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-amber-50 px-3 py-1.5 text-sm text-amber-950 shadow">
          Showing the newest 20,000 reports — zoom in or shorten the period to see all of them.
        </div>
      )}
    </div>
  );
}
