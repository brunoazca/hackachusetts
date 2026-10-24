"use client";
import { useEffect, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { ExpressionSpecification } from "maplibre-gl";
import { fetchRankedCells, weekKey, type RankedFC } from "@/lib/priority";
import type { DataColors } from "@/lib/design-tokens";

// Priority grid for the Inspect flow: every block (250 m model cell) drawn at once, ranked citywide,
// strongest first. Tap a block to open its card (select kind "cell"). Owner: map track.
//
// Score: the API's `priority` when the model track adds one; until then expected reports for the
// chosen week, ordered exactly like the Insights "busiest blocks" list (expected desc, id asc) so the
// numbers agree. Ranks are citywide (one fetch over the three cities), so panning never reorders them.

const EMPTY: RankedFC = { type: "FeatureCollection", features: [] };
export const PRIORITY_LAYER_IDS = ["priority-hit"];
export const TOP_N = 20;

/**
 * `visible`: draw the top-20 outlines and ranks (mirrors the block list). `full`: also tint every block
 * by rank — the "Priority blocks" switch in the rail; off by default so the heatmap stays the hero.
 */
export default function PriorityLayer({ visible, full, three, selectedId, week, T }: { visible: boolean; full: boolean; three: boolean; selectedId: string; week: string | null; T: DataColors }) {
  // While a block is selected, it is the only strong thing on the grid: everything else steps back.
  const IS_SEL = ["==", ["get", "id"], selectedId] as unknown as ExpressionSpecification;
  const dim = (full: unknown, factor: number) =>
    (selectedId ? ["case", IS_SEL, 1, ["*", full, factor]] : full) as unknown as ExpressionSpecification;
  const [loaded, setLoaded] = useState<{ week: string | null; fc: RankedFC } | null>(null);
  const wk = weekKey(week);
  const ranked = loaded?.week === wk ? loaded.fc : EMPTY;

  useEffect(() => {
    if (!visible || loaded?.week === wk) return;
    let live = true;
    fetchRankedCells(wk).then((fc) => live && setLoaded({ week: wk, fc })).catch(() => {});
    return () => { live = false; };
  }, [visible, wk, loaded?.week]);

  const vis = visible ? "visible" : "none";
  const fillVis = visible && full ? "visible" : "none";
  return (
    <Source id="priority" type="geojson" data={ranked}>
      {/* Every block, faint to strong by citywide percentile. */}
      <Layer
        id="priority-fill"
        type="fill"
        layout={{ visibility: fillVis }}
        paint={{
          "fill-color": T.returned,
          "fill-opacity": selectedId
            ? ["case", IS_SEL, 0.7, ["*", ["interpolate", ["linear"], ["get", "pct"], 0, 0.04, 0.6, 0.12, 0.9, 0.3, 1, 0.55], 0.35]]
            : ["interpolate", ["linear"], ["get", "pct"], 0, 0.04, 0.6, 0.12, 0.9, 0.3, 1, 0.55],
          "fill-antialias": false,
        }}
      />
      <Layer
        id="priority-grid"
        type="line"
        layout={{ visibility: fillVis }}
        minzoom={13}
        paint={{ "line-color": T.bg, "line-width": 0.6, "line-opacity": 0.5 }}
      />
      {/* The top blocks get an outline and a rank. */}
      <Layer
        id="priority-top-line"
        type="line"
        layout={{ visibility: vis }}
        filter={["<=", ["get", "rank"], TOP_N]}
        paint={{ "line-color": T.fg, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.8, 14, 1.5], "line-opacity": dim(0.9, 0.35) }}
      />
      <Layer
        id="priority-rank"
        type="symbol"
        layout={{
          visibility: vis,
          "text-field": ["to-string", ["get", "rank"]],
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 14, 13],
          "text-font": ["Noto Sans Bold"],
          "text-allow-overlap": false,
          "symbol-sort-key": ["get", "rank"],
        }}
        filter={["<=", ["get", "rank"], TOP_N]}
        paint={{ "text-color": T.fg, "text-halo-color": T.bg, "text-halo-width": 1.4, "text-opacity": dim(1, 0.35) }}
      />
      <Layer id="priority-hit" type="fill" layout={{ visibility: vis }} paint={{ "fill-color": "#000000", "fill-opacity": 0 }} />
      {/* In 3D, lines hide behind the buildings; a thin raised slab shows the block between them. */}
      <Layer
        id="priority-selected-3d"
        type="fill-extrusion"
        layout={{ visibility: visible && three ? "visible" : "none" }}
        filter={IS_SEL}
        paint={{ "fill-extrusion-color": T.returned, "fill-extrusion-height": 2, "fill-extrusion-base": 0, "fill-extrusion-opacity": 0.55 }}
      />
      {/* Selected block: a soft halo under a heavy outline. */}
      <Layer
        id="priority-selected-halo"
        type="line"
        layout={{ visibility: vis, "line-join": "round" }}
        filter={IS_SEL}
        paint={{ "line-color": T.fg, "line-width": 10, "line-opacity": 0.22, "line-blur": 6 }}
      />
      <Layer
        id="priority-selected"
        type="line"
        layout={{ visibility: vis, "line-join": "round" }}
        filter={IS_SEL}
        paint={{ "line-color": T.fg, "line-width": 3 }}
      />
    </Source>
  );
}
