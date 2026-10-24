"use client";
import { useEffect, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { ExpressionSpecification } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import type { BBox } from "@/lib/queries";
import { fetchForecast, fetchForecastSurface, SURFACE_STOPS } from "@/lib/forecast";

// Forecast layer: a smoothed surface of expected 311 rodent reports (nested areas "≥ 1, ≥ 1.5, …",
// clipped to land, so colors blend instead of hard squares and nothing under 1 report shows).
// Transparent 250 m blocks sit underneath only so a click opens the block card. Owner: model track.

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

const COLOR = [
  "interpolate", ["linear"], ["get", "level"],
  ...SURFACE_STOPS.flatMap(([v, c]) => [v, c]),
] as unknown as ExpressionSpecification;

export const FORECAST_LAYER_IDS = ["forecast-hit"];

export default function ForecastLayer({ visible, period, bbox, selectedId }: {
  visible: boolean; period: string; bbox: BBox | null; selectedId: string;
}) {
  const [surface, setSurface] = useState<FeatureCollection>(EMPTY);
  const [cells, setCells] = useState<FeatureCollection>(EMPTY);

  useEffect(() => {
    if (!visible) return;
    let live = true;
    fetchForecastSurface(period).then((fc) => live && setSurface(fc)).catch(() => {});
    return () => { live = false; };
  }, [visible, period]);

  // Click targets only (any block with a non-trivial forecast in the first week).
  useEffect(() => {
    if (!visible || !bbox) return;
    let live = true;
    const t = setTimeout(() => {
      fetchForecast(bbox, null, 0.02).then((fc) => live && setCells(fc)).catch(() => {});
    }, 150);
    return () => { live = false; clearTimeout(t); };
  }, [visible, bbox]);

  const vis = visible ? "visible" : "none";
  return (
    <>
      <Source id="forecast-cells" type="geojson" data={cells}>
        <Layer id="forecast-hit" type="fill" layout={{ visibility: vis }} paint={{ "fill-color": "#000000", "fill-opacity": 0 }} />
        <Layer
          id="forecast-selected"
          type="line"
          layout={{ visibility: vis }}
          filter={["==", ["get", "id"], selectedId]}
          paint={{ "line-color": "#111827", "line-width": 2.5 }}
        />
      </Source>
      <Source id="forecast-surface" type="geojson" data={surface}>
        <Layer
          id="forecast-surface"
          type="fill"
          layout={{ visibility: vis }}
          paint={{ "fill-color": COLOR, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.5, 15, 0.35], "fill-antialias": false }}
        />
        <Layer
          id="forecast-surface-edge"
          type="line"
          layout={{ visibility: vis }}
          filter={["==", ["get", "level"], SURFACE_STOPS[0][0]]}
          paint={{ "line-color": SURFACE_STOPS[1][1], "line-width": 1, "line-opacity": 0.7 }}
        />
      </Source>
    </>
  );
}
