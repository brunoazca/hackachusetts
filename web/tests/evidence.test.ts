import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatDate, formatTimestamp } from "../src/lib/dates.ts";
import { reportDays, sourcesFor, sourceUrl } from "../src/lib/evidence.ts";
import { standaloneBrief } from "../src/lib/inspection-brief.ts";

test("SQL calendar dates survive viewer timezones, leap days, and DST transitions", () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ["America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Pacific/Auckland"]) {
      process.env.TZ = zone;
      assert.equal(formatDate("2024-02-29"), "Feb 29, 2024");
      assert.equal(formatDate("2026-03-08"), "Mar 8, 2026");
      assert.equal(formatDate("2026-11-01"), "Nov 1, 2026");
      assert.equal(formatDate("2026-01-01"), "Jan 1, 2026");
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("timestamps use Massachusetts local time; missing and invalid dates are explicit", () => {
  assert.equal(formatDate("2026-10-24T01:00:00Z"), "Oct 23, 2026");
  assert.match(formatTimestamp("2026-10-24T01:00:00Z"), /Oct 23, 2026.*9:00 PM EDT/);
  assert.equal(formatDate("2026-02-30"), "—");
  assert.equal(formatDate(null), "—");
  assert.equal(formatDate("bad"), "—");
  assert.equal(formatTimestamp(null), "Unknown");
});

test("individual records remain distinct while same-day reports share one timeline tick", () => {
  const records = [{ id: "a", opened: "2026-10-24" }, { id: "b", opened: "2026-10-24" }, { id: "c", opened: "2026-09-20" }];
  const days = reportDays(records);
  assert.equal(records.length, 3);
  assert.equal(days.length, 2);
  assert.deepEqual(days.map((d) => d.date), ["2026-09-20", "2026-10-24"]);
  assert.deepEqual(days[1].records.map((r) => r.id), ["a", "b"]);
  assert.deepEqual(reportDays([]), []);
});

test("citations only include requested sources and retain unknown metadata honestly", () => {
  const sources = [{ id: "cambridge", name: "Cambridge reports", url: "https://example.org/data", retrieved_at: "2026-10-24T12:00:00Z", update_mode: "daily" as const, update_note: null }];
  const selected = sourcesFor(["cambridge", "missing", "cambridge"], sources);
  assert.deepEqual(selected.map((s) => s.id), ["cambridge", "missing"]);
  assert.equal(selected[1].retrieved_at, null);
  assert.equal(selected[1].url, "");
  assert.equal(sourceUrl("javascript:alert(1)"), null);
  assert.equal(sourceUrl("data:text/html,unsafe"), null);
  assert.equal(sourceUrl(sources[0].url), sources[0].url);
});

test("download keeps the complete rendered record text, print styles and citations offline", () => {
  const article = '<article><style>@media print {nav{display:none}}</style><p>Full note &lt;script&gt;</p><a href="https://example.org/data">Source</a></article>';
  const html = standaloneBrief(article);
  assert.match(html, /^<!doctype html>/);
  assert.ok(html.includes(article));
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('src="/'));
});

test("provenance RPC preserves the existing return window and spatial distances", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261024202722_site_evidence_provenance.sql", import.meta.url), "utf8");
  assert.match(sql, /security invoker/i);
  assert.match(sql, /b\.opened_at > a\.closed_at \+ interval '1 day'/);
  assert.match(sql, /b\.opened_at <= a\.closed_at \+ interval '60 days'/);
  assert.match(sql, /st_dwithin\(i\.geom, c\.geom, 100\)/);
  assert.match(sql, /st_dwithin\(p\.geom, c\.geom, 40\)/);
  assert.doesNotMatch(sql, /boston-311/);
});
