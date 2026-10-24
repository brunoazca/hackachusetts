// On-demand AI card for one 250 m cell outside the ranked Insights regions.
// POST {cell_id} -> Modal `insight_ai` (writes cell_solutions, cached after the first call).
// The worker token never reaches the browser.

export const maxDuration = 300;

const CELL = /^g250_\d+_\d+$/;

export async function POST(req: Request) {
  const url = process.env.MODAL_INSIGHT_AI_URL;
  const token = process.env.RAT_AUDIT_WORKER_TOKEN;
  if (!url || !token) return Response.json({ error: "insight AI worker not configured" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const cellId = typeof body?.cell_id === "string" ? body.cell_id : "";
  if (!CELL.test(cellId)) return Response.json({ error: "cell_id required" }, { status: 400 });
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cell_id: cellId }),
  });
  if (!res.ok) return Response.json({ error: `worker returned ${res.status}` }, { status: 502 });
  return Response.json(await res.json());
}
