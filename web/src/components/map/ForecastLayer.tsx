"use client";
import { useEffect, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { ExpressionSpecification } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import type { BBox } from "@/lib/queries";
import { fetchForecast, FORECAST_STOPS } from "@/lib/forecast";

// Draft forecast layer: 250 m blocks colored by expected 311 rodent reports for the chosen week
// (log scale, see FORECAST_STOPS). Emerging hotspots get a dashed blue outline. Owner: model track.

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

// Interpolate on log10(expected) so 0.01 → 0.1 → 1 → 10 are evenly spaced colors.
const COLOR = [
  "interpolate", ["linear"], ["log10", ["max", ["get", "expected"], 0.001]],
  ...FORECAST_STOPS.flatMap(([v, c]) => [Math.log10(v), c]),
] as unknown as ExpressionSpecification;

export const FORECAST_LAYER_IDS = ["forecast-fill"];

export default function ForecastLayer({ visible, week, bbox, selectedId }: {
  visible: boolean; week: string | null; bbox: BBox | null; selectedId: string;
}) {
  const [data, setData] = useState<FeatureCollection>(EMPTY);

  useEffect(() => {
    if (!visible || !bbox) return;
    let live = true;
    const t = setTimeout(() => {
      fetchForecast(bbox, week).then((fc) => live && setData(fc)).catch(() => {});
    }, 150);
    return () => { live = false; clearTimeout(t); };
  }, [visible, bbox, week]);

  const vis = visible ? "visible" : "none";
  return (
    <Source id="forecast" type="geojson" data={data}>
      <Layer
        id="forecast-fill"
        type="fill"
        layout={{ visibility: vis }}
        paint={{
          "fill-color": COLOR,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.75, 15, 0.45],
        }}
      />
      <Layer
        id="forecast-outline"
        type="line"
        layout={{ visibility: vis }}
        paint={{ "line-color": "#ffffff", "line-width": 0.4, "line-opacity": 0.6 }}
      />
      <Layer
        id="forecast-emerging"
        type="line"
        layout={{ visibility: vis }}
        filter={["==", ["get", "emerging"], "emerging_hotspot"]}
        paint={{ "line-color": "#1f5fbf", "line-width": 2, "line-dasharray": [2, 1.5] }}
      />
      <Layer
        id="forecast-selected"
        type="line"
        layout={{ visibility: vis }}
        filter={["==", ["get", "id"], selectedId]}
        paint={{ "line-color": "#111827", "line-width": 3 }}
      />
    </Source>
  );
}
