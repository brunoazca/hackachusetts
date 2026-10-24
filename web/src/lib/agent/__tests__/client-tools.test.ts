import { test } from "node:test";
import assert from "node:assert/strict";
import { executeClientTool, type MapActions } from "../tools/client";
import { buildMapContext, parseMapContext } from "../context";
import { useMap } from "../../map-store";

function fakeMap() {
  const calls: [string, unknown][] = [];
  const rec = (name: string) => (v: unknown) => { calls.push([name, v]); };
  const map: MapActions = {
    setMode: rec("setMode"), setEnabled: rec("setEnabled"), setDisplay: rec("setDisplay"),
    flyTo: rec("flyTo"), setLayers: rec("setLayers"), setFilters: rec("setFilters"), setHighlight: rec("setHighlight"),
    select: rec("select"), setPanel: rec("setPanel"), setForecastWeek: rec("setForecastWeek"),
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

test("layers, highlight, select, forecast, panel, filters", () => {
  const { map, calls } = fakeMap();
  executeClientTool("map_set_layers", { on: ["food"], off: ["rodent"] }, map);
  executeClientTool("map_highlight", { ids: ["a", "b"] }, map);
  executeClientTool("map_select", { kind: "site", id: "s1" }, map);
  executeClientTool("map_show_forecast", { week_start: "2026-10-26" }, map);
  executeClientTool("open_panel", { panel: "insights" }, map);
  executeClientTool("map_set_filters", { status: "open" }, map);
  assert.deepEqual(calls.filter(([name]) => !["setEnabled", "setDisplay"].includes(name)), [
    ["setLayers", { rodent: false, food: true }],
    ["setHighlight", ["a", "b"]],
    ["select", { kind: "site", id: "s1" }],
    ["setLayers", { forecast: true }],
    ["setForecastWeek", "2026-10-26"],
    ["setPanel", "insights"],
    ["setFilters", { status: "open" }],
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


test("app_set_mode changes modes and rejects removed depth options", () => {
  const { map, calls } = fakeMap();
  assert.equal(executeClientTool("app_set_mode", { mode: "act" }, map).ok, true);
  assert.equal(executeClientTool("app_set_mode", { mode: "assess" }, map).ok, true);
  assert.deepEqual(calls, [["setMode", "act"], ["setMode", "assess"]]);
  for (const input of [{}, { mode: "delete" }, { mode: "act", depth: "explore" }, { depth: "simple" }]) {
    assert.equal(executeClientTool("app_set_mode", input, map).ok, false);
  }
  assert.equal(calls.length, 2, "invalid input must not partially change the store");
});

test("app_set_mode uses the current real store and preserves selection", () => {
  const before = useMap.getState();
  try {
    before.select({ kind: "site", id: "fixture-selected" });
    assert.equal(executeClientTool("app_set_mode", { mode: "act" }, useMap.getState()).ok, true);
    assert.equal(useMap.getState().mode, "act");
    assert.deepEqual(useMap.getState().selection, { kind: "site", id: "fixture-selected" });
  } finally {
    useMap.setState(before, true);
  }
});


test("unwired map actions report a rendering limitation instead of claiming visible success", () => {
  const { map, calls } = fakeMap();
  for (const [name, input] of [
    ["map_highlight", { ids: ["fixture-incident"] }],
  ] as const) {
    const result = executeClientTool(name, input, map);
    assert.ok(result.ok);
    assert.equal(result.rendered, false);
    assert.match(result.caveat!, /do not (claim|say)/);
  }
  assert.equal(calls.length, 1, "requests still reach the store for future map integration");
  for (const [name, input] of [
    ["map_set_layers", { on: ["food"] }],
    ["map_set_filters", { status: "open" }],
    ["map_set_layers", { on: ["forecast"] }],
    ["map_set_filters", { since: "2026-10-01" }],
  ] as const) {
    const result = executeClientTool(name, input, map);
    assert.ok(result.ok);
    assert.equal(result.rendered, undefined);
  }
});


test("dock clicks and chat share exact category state, including none and restore", () => {
  const before = useMap.getState();
  try {
    before.setEnabled({ pest: false, ctx_housing: true });
    let ctx = parseMapContext(buildMapContext(useMap.getState()))!;
    assert.equal(ctx.enabled?.pest, false);
    assert.equal(ctx.enabled?.ctx_housing, true);
    const dates = { since: before.filters.since, until: before.filters.until };
    assert.equal(executeClientTool("map_set_categories", { on: ["pest"], off: ["bite"] }, useMap.getState()).ok, true);
    assert.equal(useMap.getState().enabled.pest, true);
    assert.equal(useMap.getState().enabled.bite, false);
    assert.equal(useMap.getState().enabled.ctx_housing, true);
    executeClientTool("map_set_categories", { only: [] }, useMap.getState());
    assert.deepEqual(useMap.getState().filters.categories, []);
    assert.equal(useMap.getState().enabled.rodent, false);
    executeClientTool("map_set_filters", { categories: ["rodent"], status: "closed" }, useMap.getState());
    assert.equal(useMap.getState().enabled.rodent, true);
    assert.equal(useMap.getState().enabled.pest, false);
    assert.equal(useMap.getState().filters.since, dates.since);
    assert.equal(useMap.getState().filters.until, dates.until);
    executeClientTool("map_set_display", { viewMode: "both", causes: true }, useMap.getState());
    ctx = parseMapContext(buildMapContext(useMap.getState()))!;
    assert.equal(ctx.display?.viewMode, "both");
    assert.equal(ctx.display?.causes, true);
    assert.deepEqual(ctx.filters?.categories, ["rodent"]);
    assert.equal(ctx.filters?.status, "closed");
    const current = useMap.getState();
    assert.equal(executeClientTool("map_set_categories", { on: ["made_up"] }, current).ok, false);
    assert.equal(executeClientTool("map_set_filters", { categories: ["made_up"] }, current).ok, false);
    assert.equal(useMap.getState(), current);
  } finally { useMap.setState(before, true); }
});

test("legacy family tools change actual toggles and enable causes", () => {
  const before = useMap.getState();
  try {
    executeClientTool("map_set_categories", { only: [] }, useMap.getState());
    executeClientTool("map_set_layers", { on: ["rats_other", "food"] }, useMap.getState());
    assert.equal(useMap.getState().enabled.pest, true);
    assert.equal(useMap.getState().enabled.rodent, false);
    assert.equal(useMap.getState().display.causes, true);
    assert.equal(executeClientTool("map_set_layers", { on: ["prices"] }, useMap.getState()).ok, false);
  } finally { useMap.setState(before, true); }
});
