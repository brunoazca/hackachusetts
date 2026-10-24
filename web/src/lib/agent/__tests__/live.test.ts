import { test } from "node:test";
import assert from "node:assert/strict";
import { createSupabaseData, supabaseConfigured } from "../data/supabase";
import { createServerTools } from "../tools/server";

// Read-only validation of the tools against the shared Supabase (anon key, RLS
// public read: this adapter cannot write). Skips when env is missing:
//   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npx tsx --test src/lib/agent/__tests__/live.test.ts

const skip = supabaseConfigured() ? false : "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set";
const opts = { toolCallId: "live", messages: [] } as never;

test("live: every tool answers or fails honestly", { skip }, async () => {
  const tools = createServerTools({ data: createSupabaseData() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = (name: keyof typeof tools, input: unknown): Promise<any> => (tools[name].execute as any)(input, opts);

  const report: Record<string, string> = {};
  const geo = await call("geocode", { query: "Normandy St" });
  report.geocode = geo.ok ? `found=${geo.data.found} matches=${geo.data.matches.length}` : geo.error;

  const inc = await call("search_incidents", { query: "Normandy St", since: "2025-01-01" });
  report.search_incidents = inc.ok ? `total=${inc.data.total} sources=${inc.sources.map((s: { id: string }) => s.id).join(",")}` : inc.error;
  if (inc.ok) {
    assert.ok(inc.data.items.every((i: { address_block: string | null }) => !/^\d/.test(i.address_block ?? "")), "no house numbers");
    assert.ok(inc.sources.every((s: { name: string | null }) => s.name != null), "every cited source_id resolves in sources");
  }

  const top = await call("top_sites", { limit: 5 });
  report.top_sites = top.ok ? `sites=${top.data.sites.length}` : top.error;
  const firstSite = top.ok ? top.data.sites[0]?.id : undefined;
  if (firstSite) {
    const s = await call("get_site", { site_id: firstSite });
    report.get_site = s.ok ? `timeline=${s.data.timeline?.length}` : s.error;
    const n = await call("nearby_drivers", { site_id: firstSite });
    report.nearby_drivers = n.ok ? `driver_cats=${n.data.driver_reports?.length}` : n.error;
    const d = await call("draft_work_order", { site_id: firstSite, action: "inspection" });
    report.draft_work_order = d.ok ? `status=${d.data.status} saved=${d.data.saved}` : d.error;
    if (d.ok) assert.equal(d.data.saved, false);
  }
  const ww = await call("what_worked", {});
  report.what_worked = ww.ok ? `outcomes=${ww.data.outcomes.length}` : ww.error;

  console.log("live tool report", report);
  // Each tool must either succeed or return a readable error — never throw.
  for (const v of Object.values(report)) assert.equal(typeof v, "string");
});
