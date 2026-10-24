import { test } from "node:test";
import assert from "node:assert/strict";
import type { UIMessage } from "ai";
import { collectRefs, toolParts, toolStep, workOrderDrafts } from "../ui";

const msg = (parts: unknown[]): UIMessage => ({ id: "m", role: "assistant", parts }) as UIMessage;

test("tool step labels: running, done with counts, failed", () => {
  const m = msg([
    { type: "tool-search_incidents", toolCallId: "1", state: "input-available", input: { query: "Normandy St" } },
    { type: "tool-search_incidents", toolCallId: "2", state: "output-available", input: { query: "Normandy St" }, output: { ok: true, data: { total: 16 }, sources: [], features: [], caveats: [] } },
    { type: "tool-top_sites", toolCallId: "3", state: "output-available", input: {}, output: { ok: false, error: "Live data is not configured" } },
    { type: "tool-map_fly_to", toolCallId: "4", state: "output-error", input: {}, errorText: "Invalid input" },
  ]);
  const steps = toolParts(m).map(toolStep);
  assert.deepEqual(steps.map((s) => [s.status, s.label]), [
    ["running", "Looking up reports…"],
    ["done", "Looked up 16 reports on Normandy St"],
    ["error", "Live data is not configured"],
    ["error", "Invalid input"],
  ]);
});

test("collectRefs dedupes sources and features across tool calls", () => {
  const out = (id: string) => ({ ok: true, data: {}, caveats: [], sources: [{ id: "boston-311-2026", name: "311", url: "u" }], features: [{ kind: "site", id, label: id }] });
  const m = msg([
    { type: "tool-top_sites", toolCallId: "1", state: "output-available", input: {}, output: out("s1") },
    { type: "tool-get_site", toolCallId: "2", state: "output-available", input: {}, output: out("s1") },
    { type: "tool-get_site", toolCallId: "3", state: "output-available", input: {}, output: out("s2") },
  ]);
  const r = collectRefs(m);
  assert.equal(r.sources.length, 1);
  assert.deepEqual(r.features.map((f) => f.id), ["s1", "s2"]);
});

test("work order drafts surface for review", () => {
  const m = msg([{ type: "tool-draft_work_order", toolCallId: "1", state: "output-available", input: {}, output: { ok: true, data: { drafted: true, site_id: "s1", action_label: "Abatement order", owner: "ISD", follow_up_on: "2026-12-23", address_block: "A St" }, sources: [], features: [], caveats: [] } }]);
  assert.deepEqual(workOrderDrafts(m).map((d) => d.site_id), ["s1"]);
});
