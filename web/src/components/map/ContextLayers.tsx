"use client";
import { useEffect, useMemo, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { mask } from "@turf/turf";
import { fetchCityBoundaries, fetchParcels, fetchTracts, type BBox, type CoverageRow } from "@/lib/queries";

// Context + coverage layers:
// - fog outside Boston/Cambridge/Somerville (always), and over any of the three cities where none of the
//   active layers has data (from coverage_matrix), with a "no data" label;
// - old housing: % of homes built before 1940 per tract (ACS, all three cities);
// - buildings by year built (Boston parcels), only when zoomed in.

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };
export const HOUSING_RAMP = ["#fff7ec", "#fdd49e", "#fc8d59", "#d7301f", "#7f0000"];
export const ERA_STOPS: [number, string, string][] = [
  [1700, "#7f0000", "before 1900"],
  [1900, "#d7301f", "1900–1939"],
  [1940, "#fc8d59", "1940–1979"],
  [1980, "#fdd49e", "1980 or later"],
];

type Props = {
  cats: string[];
  coverage: CoverageRow[];
  housing: boolean;
  buildings: boolean;
  bbox: BBox | null;
  zoom: number;
};

export default function ContextLayers({ cats, coverage, housing, buildings, bbox, zoom }: Props) {
  const [cities, setCities] = useState<FeatureCollection<Polygon | MultiPolygon>>(EMPTY as FeatureCollection<Polygon | MultiPolygon>);
  const [tracts, setTracts] = useState<FeatureCollection>(EMPTY);
  const [parcels, setParcels] = useState<FeatureCollection>(EMPTY);

  useEffect(() => {
    fetchCityBoundaries().then((fc) => setCities(fc as FeatureCollection<Polygon | MultiPolygon>)).catch(() => {});
  }, []);
  useEffect(() => {
    if (housing && tracts.features.length === 0) fetchTracts().then(setTracts).catch(() => {});
  }, [housing, tracts.features.length]);
  useEffect(() => {
    if (!buildings || !bbox || zoom < 15) { setParcels(EMPTY); return; }
    let live = true;
    fetchParcels(bbox).then((fc) => live && setParcels(fc)).catch(() => {});
    return () => { live = false; };
  }, [buildings, bbox, zoom]);

  // World minus the three cities.
  const outside = useMemo(() => (cities.features.length ? mask(cities) : null), [cities]);

  // Cities where none of the active incident layers has data.
  const noData = useMemo(() => {
    if (!cats.length || !coverage.length) return EMPTY;
    const has = new Set(coverage.filter((c) => c.kind === "incident" && cats.includes(c.layer)).map((c) => c.city));
    const features = cities.features.filter((f) => !has.has(String(f.properties?.city))) as Feature[];
    return { type: "FeatureCollection", features } as FeatureCollection;
  }, [cats, coverage, cities]);

  return (
    <>
      {housing && (
        <Source id="ctx-tracts" type="geojson" data={tracts}>
          <Layer
            id="ctx-housing"
            type="fill"
            paint={{
              "fill-color": [
                "interpolate", ["linear"], ["coalesce", ["get", "pct_housing_pre1940"], -1],
                -1, "rgba(0,0,0,0)", 0, HOUSING_RAMP[0], 25, HOUSING_RAMP[1], 50, HOUSING_RAMP[2], 70, HOUSING_RAMP[3], 90, HOUSING_RAMP[4],
              ],
              "fill-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.55, 15, 0.3],
            }}
          />
          <Layer id="ctx-housing-line" type="line" paint={{ "line-color": "#ffffff", "line-width": 0.5, "line-opacity": 0.6 }} />
        </Source>
      )}

      {buildings && zoom >= 15 && (
        <Source id="ctx-parcels" type="geojson" data={parcels}>
          <Layer
            id="ctx-buildings"
            type="circle"
            paint={{
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 15, 2.5, 18, 6],
              "circle-color": [
                "step", ["coalesce", ["get", "yr_built"], 0],
                "#9ca3af", ERA_STOPS[0][0], ERA_STOPS[0][1], ERA_STOPS[1][0], ERA_STOPS[1][1],
                ERA_STOPS[2][0], ERA_STOPS[2][1], ERA_STOPS[3][0], ERA_STOPS[3][1],
              ],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 0.5,
            }}
          />
        </Source>
      )}

      {outside && (
        <Source id="fog-outside" type="geojson" data={outside}>
          <Layer id="fog-outside" type="fill" paint={{ "fill-color": "#e5e7eb", "fill-opacity": 0.72 }} />
        </Source>
      )}
      <Source id="fog-nodata" type="geojson" data={noData}>
        <Layer id="fog-nodata" type="fill" paint={{ "fill-color": "#e5e7eb", "fill-opacity": 0.7 }} />
        <Layer id="fog-nodata-line" type="line" paint={{ "line-color": "#6b7280", "line-width": 1, "line-dasharray": [2, 2] }} />
        <Layer
          id="fog-nodata-label"
          type="symbol"
          layout={{ "text-field": ["concat", "No data here for the layers you picked"], "text-size": 13, "text-font": ["Noto Sans Bold"], "symbol-placement": "point" }}
          paint={{ "text-color": "#374151", "text-halo-color": "#ffffff", "text-halo-width": 1.5 }}
        />
      </Source>
      {cities.features.length > 0 && (
        <Source id="city-outline" type="geojson" data={cities}>
          <Layer id="city-outline" type="line" paint={{ "line-color": "#374151", "line-width": 1.2, "line-opacity": 0.5 }} />
        </Source>
      )}
    </>
  );
}
