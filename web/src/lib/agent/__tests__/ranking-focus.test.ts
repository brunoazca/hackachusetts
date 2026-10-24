import { test } from "node:test";
import assert from "node:assert/strict";
import { rankingFocusFallback } from "../ranking-focus";

const regions = Array.from({ length: 5 }, (_, i) => ({ region_id: `r${i}`, rank: i + 1, cell_ids: [`c${i}`] }));
const ranking = { type: "tool-rank_regions", output: { ok: true, data: { regions } } };
const fly = { type: "tool-map_fly_to", output: { ok: true } };

test("top five followed by five individual flights still displays all five boundaries", () => {
  assert.deepEqual(rankingFocusFallback([ranking, ...Array(5).fill(fly)]), regions);
});
test("subsequent Newbury response has no ranking to resurrect", () => {
  assert.equal(rankingFocusFallback([{ type: "tool-geocode", output: { ok: true } }, fly]), null);
});
test("explicit focus, clear or selection after ranking takes precedence", () => {
  for (const type of ["tool-map_focus_regions", "tool-map_select"]) {
    assert.equal(rankingFocusFallback([ranking, { type, output: { ok: true } }]), null);
    assert.deepEqual(rankingFocusFallback([ranking, { type, output: { ok: false } }]), regions);
  }
});
test("new ranking replaces older focus and empty ranking clears it", () => {
  assert.deepEqual(rankingFocusFallback([{ type: "tool-map_focus_regions", output: { ok: true } }, ranking]), regions);
  assert.deepEqual(rankingFocusFallback([ranking, { type: "tool-rank_regions", output: { ok: true, data: { regions: [] } } }]), []);
});
