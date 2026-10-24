"use client";
import { Layer, Marker, Source } from "react-map-gl/maplibre";
import { useMap } from "@/lib/map-store";

export default function RegionFocusLayer() {
  const focus = useMap(s => s.regionFocus);
  const select = useMap(s => s.select);
  if (!focus) return null;
  return <>
    {focus.mask && <Source id="region-focus-mask" type="geojson" data={focus.mask}>
      <Layer id="region-focus-dim" type="fill" paint={{ "fill-color": "#08121b", "fill-opacity": 0.65 }} />
    </Source>}
    <Source id="region-focus-shapes" type="geojson" data={focus.regions}>
      <Layer id="region-focus-hit" type="fill" paint={{ "fill-color": "#67e8f9", "fill-opacity": 0.05 }} />
      <Layer id="region-focus-halo" type="line" paint={{ "line-color": "#082f49", "line-width": 7, "line-opacity": 0.9 }} />
      <Layer id="region-focus-outline" type="line" paint={{ "line-color": "#67e8f9", "line-width": 3 }} />
    </Source>
    {focus.labels.map((r, index) => <Marker key={r.id} longitude={r.lon} latitude={r.lat} anchor="center">
      <button type="button" aria-label={`Open priority region ${index + 1} in Inspect`} onClick={e => { e.stopPropagation(); select({ kind: "cell", id: r.id }); }} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-sky-900 text-sm font-bold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{index + 1}</button>
    </Marker>)}
  </>;
}
