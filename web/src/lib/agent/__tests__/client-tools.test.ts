import { test } from "node:test";
import assert from "node:assert/strict";
import { executeClientTool, type MapActions } from "../tools/client";
import { buildMapContext, parseMapContext } from "../context";
import { CATEGORY_IDS, activeCategories, LAYER_GROUPS, filterIncidentStatus } from "../../map-controls";
import { useMap } from "../../map-store";
import { CELL_METRICS } from "../../cell-metrics";

function fakeMap() {
  const calls: [string, unknown][] = [];
  const rec = (name: string) => (v: unknown) => { calls.push([name, v]); };
  const map: MapActions = {
    setMode: rec("setMode"), setViewMode: rec("setViewMode"), setCauses: rec("setCauses"), setCellMetric: rec("setCellMetric"),
    flyTo: rec("flyTo"), setLayers: rec("setLayers"), setFilters: rec("setFilters"), setHighlight: rec("setHighlight"),
    select: rec("select"), setForecastWeek: rec("setForecastWeek"),
  };
  return { map, calls };
}

test("map_fly_to drives the store; coordinates outside the region are rejected", () => {
  const { map, calls } = fakeMap();
  assert.equal(executeClientTool("map_fly_to", { lat: 42.3051, lon: -71.0712, zoom: 16 }, map).ok, true);
  assert.deepEqual(calls, [["flyTo", { lat: 42.3051, lon: -71.0712, zoom: 16 }]]);
  const bad = executeClientTool("map_fly_to", { lat: 40.7, lon: -74 }, map);
  assert.equal(bad.ok, false);
  assert.equal(calls.length, 1);
});

test("layers, highlight, select, forecast, insight, filters", () => {
  const { map, calls } = fakeMap();
  executeClientTool("map_set_layers", { on: ["food"], off: ["rodent"] }, map);
  executeClientTool("map_highlight", { ids: ["a", "b"] }, map);
  executeClientTool("map_select", { kind: "site", id: "s1" }, map);
  executeClientTool("map_show_forecast", { week_start: "2026-10-26" }, map);
  executeClientTool("open_insight", { target: "report", id: "311:1" }, map);
  executeClientTool("map_set_filters", { status: "open" }, map);
  assert.deepEqual(calls, [
    ["setLayers", { rodent: false, ...Object.fromEntries(LAYER_GROUPS.food.map(id => [id, true])) }],
    ["setMode", "assess"],
    ["setCauses", true],
    ["setHighlight", ["a", "b"]],
    ["select", { kind: "site", id: "s1" }],
    ["setMode", "assess"],
    ["setLayers", { forecast: true }],
    ["setForecastWeek", "2026-10-26"],
    ["select", { kind: "incident", id: "311:1" }],
    ["setFilters", { status: "open" }],
    ["setMode", "assess"],
  ]);
});

test("unknown layer and unknown tool are errors", () => {
  const { map, calls } = fakeMap();
  assert.equal(executeClientTool("map_set_layers", { on: ["lasers"] }, map).ok, false);
  assert.equal(executeClientTool("rm_rf", {}, map).ok, false);
  assert.equal(calls.length, 0);
});

test("map context: bbox stays null without store bounds; round-trips validation", () => {
  const state = {
    mode: "act" as const,
    selection: { kind: "site", id: "s1" },
    view: { lat: 42.32, lon: -71.08, zoom: 12 },
    filters: { since: "2026-07-26", until: "2026-10-24", categories: [], status: "all" },
    layers: { rodent: true, sites: true, food: false },
  };
  const ctx = buildMapContext(state);
  assert.equal(ctx.bbox, null);
  assert.equal(ctx.mode, "act");
  assert.deepEqual(ctx.layers, ["rodent", "sites"]);
  assert.deepEqual(parseMapContext(ctx), ctx);
  assert.deepEqual(buildMapContext({ ...state, bounds: [-71.1, 42.3, -71.0, 42.4] }).bbox, [-71.1, 42.3, -71.0, 42.4]);
  assert.equal(parseMapContext({ junk: true }), null);
});


test("app_set_mode changes modes and rejects removed ones (act / Places to visit is gone)", () => {
  const { map, calls } = fakeMap();
  assert.equal(executeClientTool("app_set_mode", { mode: "inspect" }, map).ok, true);
  assert.equal(executeClientTool("app_set_mode", { mode: "assess" }, map).ok, true);
  assert.deepEqual(calls, [["setMode", "inspect"], ["setMode", "assess"]]);
  for (const input of [{}, { mode: "delete" }, { mode: "act" }, { mode: "assess", depth: "explore" }, { depth: "simple" }]) {
    assert.equal(executeClientTool("app_set_mode", input, map).ok, false);
  }
  assert.equal(calls.length, 2, "invalid input must not partially change the store");
});

test("app_set_mode uses the current real store and preserves selection", () => {
  const before = useMap.getState();
  try {
    before.select({ kind: "site", id: "fixture-selected" });
    assert.equal(executeClientTool("app_set_mode", { mode: "inspect" }, useMap.getState()).ok, true);
    assert.equal(useMap.getState().mode, "inspect");
    assert.deepEqual(useMap.getState().selection, { kind: "site", id: "fixture-selected" });
  } finally {
    useMap.setState(before, true);
  }
});


test("every original category, context layer and display setting is shared with the map", () => {
  const before = useMap.getState();
  try {
    for (const id of CATEGORY_IDS) {
      const result = executeClientTool("map_set_filters", { categories: [id] }, useMap.getState());
      assert.equal(result.ok, true);
      assert.deepEqual(activeCategories(useMap.getState().layers), [id]);
    }
    executeClientTool("map_set_layers", { on: ["food", "ctx_housing", "ctx_buildings"], off: ["rodent"] }, useMap.getState());
    assert.equal(useMap.getState().layers.ctx_housing, true);
    assert.equal(useMap.getState().layers.ctx_buildings, true);
    assert.equal(useMap.getState().causes, true);
    assert.equal(useMap.getState().layers.rodent, false);
    for (const id of LAYER_GROUPS.food) assert.equal(useMap.getState().layers[id], true);
    executeClientTool("map_set_view", { mode: "both", nearby_records: false }, useMap.getState());
    assert.equal(useMap.getState().viewMode, "both");
    assert.equal(useMap.getState().causes, false);
    useMap.getState().setLayers({ rodent: true });
    assert.ok(buildMapContext(useMap.getState()).layers.includes("rodent"), "manual changes reach next chat request");
    executeClientTool("map_set_layers", { off: CATEGORY_IDS }, useMap.getState());
    assert.deepEqual(activeCategories(useMap.getState().layers), [], "all off does not become all on");
    executeClientTool("map_set_filters", { categories: [] }, useMap.getState());
    assert.deepEqual(activeCategories(useMap.getState().layers), CATEGORY_IDS);
    executeClientTool("map_show_forecast", { week_start: "4w" }, useMap.getState());
    assert.equal(buildMapContext(useMap.getState()).forecastPeriod, "4w");
  } finally { useMap.setState(before, true); }
});

test("invalid dates, reversed partial ranges and unknown categories cannot partially mutate the map", () => {
  const before = useMap.getState();
  for (const input of [{ since: "2026-02-30" }, { since: "2099-01-01", status: "open" }, { until: "2000-01-01" }, { categories: ["invented"] }]) {
    assert.equal(executeClientTool("map_set_filters", input, useMap.getState()).ok, false);
    assert.equal(useMap.getState(), before);
  }
});

test("all upstream block-profile choices share map state and round-trip through chat context", () => {
  const before = useMap.getState();
  try {
    for (const metric of CELL_METRICS) {
      assert.equal(executeClientTool("map_set_view", { block_metric: metric.key }, useMap.getState()).ok, true);
      assert.equal(useMap.getState().cellMetric, metric.key);
      const context = buildMapContext(useMap.getState());
      assert.equal(context.blockMetric, metric.key);
      assert.deepEqual(parseMapContext(context), context);
    }
    useMap.getState().setCellMetric("pop_per_km2");
    executeClientTool("map_set_view", { mode: "points" }, useMap.getState());
    assert.equal(buildMapContext(useMap.getState()).blockMetric, "pop_per_km2", "unrelated display changes preserve the manual block choice");
    const current = useMap.getState();
    assert.equal(executeClientTool("map_set_view", { block_metric: "invented", mode: "heat" }, current).ok, false);
    assert.equal(useMap.getState(), current);
    executeClientTool("map_set_view", { block_metric: null }, current);
    assert.equal(buildMapContext(useMap.getState()).blockMetric, null);
  } finally { useMap.setState(before, true); }
});

test("status filters preserve exact aggregate weights and individual reports without mutating fetched data", () => {
  const rows = [{ properties: { n: 10, n_open: 3 } }, { properties: { n: 5, n_open: 0 } },
    { properties: { status: "open" } }, { properties: { status: "closed" } }];
  const original = structuredClone(rows);
  const sum = (status: "all" | "open" | "closed") => filterIncidentStatus(rows, status).reduce((n, row) => n + (row.properties.n ?? 1), 0);
  assert.equal(sum("all"), 17);
  assert.equal(sum("open"), 4);
  assert.equal(sum("closed"), 13);
  assert.deepEqual(rows, original);
});

test("highlight reaches the renderer state; context contains actual bounds and display", () => {
  const before = useMap.getState();
  try {
    useMap.getState().setBounds([-71.12, 42.3, -71.0, 42.4]);
    useMap.getState().setView({ lat: 42.35, lon: -71.06, zoom: 15 });
    executeClientTool("map_highlight", { ids: ["a", "b"] }, useMap.getState());
    assert.deepEqual(useMap.getState().highlight, ["a", "b"]);
    const context = buildMapContext(useMap.getState());
    assert.deepEqual(parseMapContext(context), context);
    assert.deepEqual(context.bbox, [-71.12, 42.3, -71.0, 42.4]);
    assert.equal(context.view?.zoom, 15);
    executeClientTool("map_fly_to", { lat: 42.36, lon: -71.1, zoom: 16 }, useMap.getState());
    assert.equal(buildMapContext(useMap.getState()).bbox, null, "pending flight must not reuse old viewport");
  } finally { useMap.setState(before, true); }
});

test("open_insight drives the Insight panel through the selection", () => {
  const before = useMap.getState();
  try {
    assert.equal(executeClientTool("open_insight", { target: "block", id: "g250_948_3594" }, useMap.getState()).ok, true);
    assert.deepEqual(useMap.getState().selection, { kind: "cell", id: "g250_948_3594" });
    assert.equal(executeClientTool("open_insight", { target: "place", id: "food:9" }, useMap.getState()).ok, true);
    assert.deepEqual(useMap.getState().selection, { kind: "place", id: "food:9" });
    assert.equal(executeClientTool("open_insight", { target: "report" }, useMap.getState()).ok, false, "an id is required");
    assert.equal(executeClientTool("open_insight", { target: "ranking" }, useMap.getState()).ok, true);
    assert.equal(useMap.getState().selection, null);
    assert.equal(executeClientTool("map_filter_sites", { neighborhood: "Roxbury" }, useMap.getState()).ok, false, "Places to visit tool removed");
  } finally { useMap.setState(before, true); }
});

