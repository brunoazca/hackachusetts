"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, NavigationControl, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import { setWorkerUrl } from "maplibre-gl";
import categories from "@/lib/categories.json";
import { useMap } from "@/lib/map-store";
import { fetchIncidents, type BBox, type IncidentProps } from "@/lib/queries";
import LayerPanel, { activeCategories } from "./LayerPanel";
import { addCategoryIcons, iconId } from "./icons";

// Draft map. Each category is its own clustered source, so a cluster only ever counts one kind
// of signal and wears that category's color; individual reports are icons. Owner: map track.

const STYLE = "https://tiles.openfreemap.org/styles/positron";
// MapLibre 6's ESM worker can't be resolved by the Next bundler; serve it from /public (postinstall copies it).
if (typeof window !== "undefined") setWorkerUrl("/maplibre-gl-worker.mjs");

const CATS = categories.incident_categories as Record<string, { label: string; color: string; group: string }>;
type FC = FeatureCollection<Point, IncidentProps>;
const EMPTY: FC = { type: "FeatureCollection", features: [] };

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const view = useMap((s) => s.view);
  const filters = useMap((s) => s.filters);
  const flyToTarget = useMap((s) => s.flyToTarget);
  const select = useMap((s) => s.select);
  const selection = useMap((s) => s.selection);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ rodent: true });
  const [data, setData] = useState<FC>(EMPTY);
  const [iconsReady, setIconsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const cats = useMemo(() => activeCategories(enabled), [enabled]);

  // Split one fetch into one collection per category (one clustered source each).
  const byCategory = useMemo(() => {
    const out: Record<string, FC> = {};
    for (const c of cats) out[c] = { type: "FeatureCollection", features: [] };
    for (const f of data.features) out[f.properties.category]?.features.push(f);
    return out;
  }, [data, cats]);

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

  useEffect(() => { load(); }, [load]);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveEnd = useCallback(() => {
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(load, 300);
  }, [load]);

  const onLoad = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (map) { await addCategoryIcons(map); setIconsReady(true); }
    load();
  }, [load]);

  useEffect(() => {
    if (flyToTarget) mapRef.current?.flyTo({ center: [flyToTarget.lon, flyToTarget.lat], zoom: flyToTarget.zoom, duration: 1200 });
  }, [flyToTarget]);

  const interactive = useMemo(
    () => (iconsReady ? cats.flatMap((c) => [`${c}-clusters`, `${c}-points`]) : []),
    [cats, iconsReady],
  );

  const onClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) return;
    if (f.layer.id.endsWith("-clusters")) {
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
        onLoad={onLoad}
        onMoveEnd={onMoveEnd}
        onClick={onClick}
        interactiveLayerIds={interactive}
        cursor="pointer"
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="bottom-right" />
        {iconsReady && cats.map((c) => {
          const color = CATS[c]?.color ?? "#555";
          return (
            <Fragment key={c}>
              <Source id={`src-${c}`} type="geojson" data={byCategory[c] ?? EMPTY} cluster clusterMaxZoom={15} clusterRadius={45}>
                <Layer
                  id={`${c}-clusters`}
                  type="circle"
                  filter={["has", "point_count"]}
                  paint={{
                    "circle-color": color,
                    "circle-opacity": 0.92,
                    "circle-radius": ["step", ["get", "point_count"], 13, 25, 17, 100, 22, 500, 28],
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 2,
                  }}
                />
                <Layer
                  id={`${c}-cluster-count`}
                  type="symbol"
                  filter={["has", "point_count"]}
                  layout={{
                    "text-field": ["get", "point_count_abbreviated"],
                    "text-size": 13,
                    "text-font": ["Noto Sans Bold"],
                    "text-allow-overlap": true,
                  }}
                  paint={{ "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.35)", "text-halo-width": 1 }}
                />
                <Layer
                  id={`${c}-selected`}
                  type="circle"
                  filter={["==", ["get", "id"], selectedId]}
                  paint={{ "circle-radius": 19, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#111827", "circle-stroke-width": 3 }}
                />
                <Layer
                  id={`${c}-points`}
                  type="symbol"
                  filter={["!", ["has", "point_count"]]}
                  layout={{
                    "icon-image": iconId(c),
                    "icon-size": ["interpolate", ["linear"], ["zoom"], 13, 0.75, 17, 1.1],
                    "icon-allow-overlap": true,
                  }}
                  paint={{ "icon-opacity": ["case", ["==", ["get", "status"], "open"], 1, 0.6] }}
                />
              </Source>
            </Fragment>
          );
        })}
      </Map>

      <LayerPanel enabled={enabled} onChange={setEnabled} count={data.features.length} loading={loading} />

      {error && (
        <div role="alert" className="absolute bottom-4 left-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-900 shadow">
          Could not load reports: {error}
        </div>
      )}
      {data.features.length >= 20000 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-amber-50 px-3 py-1.5 text-sm text-amber-950 shadow">
          Showing the newest 20,000 reports — zoom in or shorten the period to see all of them.
        </div>
      )}
    </div>
  );
}
