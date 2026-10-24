"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, NavigationControl, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import { setWorkerUrl, type ExpressionSpecification } from "maplibre-gl";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";
import { fetchIncidents, type BBox, type IncidentProps } from "@/lib/queries";
import LayerPanel, { activeCategories } from "./LayerPanel";

// Draft map: every incident category from categories.json, clustered, colored by category.
// Click a point to inspect it. Owner: map track — extend freely.

const STYLE = "https://tiles.openfreemap.org/styles/positron";
// MapLibre 6's ESM worker can't be resolved by the Next bundler; serve it from /public (postinstall copies it).
if (typeof window !== "undefined") setWorkerUrl("/maplibre-gl-worker.mjs");
const CATS = categories.incident_categories as Record<string, { label: string; color: string; group: string }>;

const colorExpr = [
  "match", ["get", "category"],
  ...Object.entries(CATS).flatMap(([id, c]) => [id, c.color]),
  "#888",
] as unknown as ExpressionSpecification;

const EMPTY: FeatureCollection<Point, IncidentProps> = { type: "FeatureCollection", features: [] };

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const view = useMap((s) => s.view);
  const filters = useMap((s) => s.filters);
  const flyToTarget = useMap((s) => s.flyToTarget);
  const select = useMap((s) => s.select);
  const selection = useMap((s) => s.selection);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ rodent: true });
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const cats = useMemo(() => activeCategories(enabled), [enabled]);

  const load = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const bbox: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    const id = ++reqId.current;
    if (cats.length === 0) { setData(EMPTY); return; }
    setLoading(true);
    try {
      const fc = await fetchIncidents(bbox, cats, filters.since, filters.until);
      if (id === reqId.current) { setData(fc); setError(null); }
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [cats, filters.since, filters.until]);

  // Refetch when filters/layers change; debounce map moves.
  useEffect(() => { load(); }, [load]);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveEnd = useCallback(() => {
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(load, 300);
  }, [load]);

  useEffect(() => {
    if (flyToTarget) mapRef.current?.flyTo({ center: [flyToTarget.lon, flyToTarget.lat], zoom: flyToTarget.zoom, duration: 1200 });
  }, [flyToTarget]);

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) return;
    if (f.layer.id === "clusters") {
      mapRef.current?.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom: (mapRef.current?.getZoom() ?? 12) + 2 });
      return;
    }
    select({ kind: "incident", id: String(f.properties?.id) });
  }, [select]);

  const selectedId = selection && "id" in selection ? selection.id : "";

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        initialViewState={{ latitude: view.lat, longitude: view.lon, zoom: view.zoom }}
        mapStyle={STYLE}
        onLoad={load}
        onMoveEnd={onMoveEnd}
        onClick={onClick}
        interactiveLayerIds={["clusters", "points"]}
        cursor="pointer"
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="bottom-right" />
        <Source id="incidents" type="geojson" data={data} cluster clusterMaxZoom={14} clusterRadius={40}>
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#1f2937",
              "circle-opacity": 0.75,
              "circle-radius": ["step", ["get", "point_count"], 14, 50, 18, 250, 24, 1000, 30],
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1.5,
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{ "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Noto Sans Bold"] }}
            paint={{ "text-color": "#fff" }}
          />
          <Layer
            id="points"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": colorExpr,
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 3.5, 17, 8],
              "circle-opacity": ["case", ["==", ["get", "status"], "open"], 0.95, 0.55],
              "circle-stroke-color": ["case", ["==", ["get", "id"], selectedId], "#111", ["==", ["get", "status"], "open"], "#fff", "rgba(255,255,255,0.4)"],
              "circle-stroke-width": ["case", ["==", ["get", "id"], selectedId], 3, 1],
            }}
          />
        </Source>
      </Map>

      <LayerPanel enabled={enabled} onChange={setEnabled} count={data.features.length} loading={loading} />

      {error && (
        <div role="alert" className="absolute bottom-4 left-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 shadow">
          Could not load reports: {error}
        </div>
      )}
      {data.features.length >= 20000 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-900 shadow">
          Showing the newest 20,000 reports — zoom in or shorten the date range for all of them.
        </div>
      )}
    </div>
  );
}
