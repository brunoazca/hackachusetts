import { createClient } from "@supabase/supabase-js";

// Live data status + the Refresh button.
// GET  -> latest successful ingest per source ("Live · updated N min ago").
// POST -> asks the Modal worker to pull new rows (Boston 311, Cambridge/Somerville,
//         code enforcement) and re-score; at most once every 5 minutes (R1.5).
// The worker token never reaches the browser.

export const maxDuration = 300;

const MIN_INTERVAL_MS = 5 * 60 * 1000;

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

async function latestRuns() {
  const { data, error } = await db()
    .from("ingest_runs")
    .select("source_id, finished_at, rows_upserted, newest_record_at, ok")
    .eq("ok", true)
    .order("finished_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const bySource = new Map<string, (typeof data)[number]>();
  for (const r of data ?? []) if (!bySource.has(r.source_id)) bySource.set(r.source_id, r);
  const sources = [...bySource.values()];
  const updatedAt = sources.reduce<string | null>(
    (max, r) => (r.finished_at && (!max || r.finished_at > max) ? r.finished_at : max),
    null,
  );
  return { updatedAt, sources };
}

export async function GET() {
  try {
    return Response.json(await latestRuns());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}

export async function POST() {
  const url = process.env.MODAL_REFRESH_URL;
  const token = process.env.RAT_AUDIT_WORKER_TOKEN;
  if (!url || !token) {
    return Response.json({ error: "refresh worker not configured" }, { status: 503 });
  }

  const { updatedAt } = await latestRuns();
  if (updatedAt && Date.now() - new Date(updatedAt).getTime() < MIN_INTERVAL_MS) {
    return Response.json({ skipped: "refreshed less than 5 minutes ago", updatedAt }, { status: 429 });
  }

  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    return Response.json({ error: `worker returned ${res.status}` }, { status: 502 });
  }
  const result = await res.json();
  return Response.json({ ...result, ...(await latestRuns()) });
}
