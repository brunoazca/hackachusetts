import { getToolName, isToolUIPart, type UIMessage } from "ai";
import type { FeatureRef, SourceRef } from "./types";

// Pure helpers for ChatPanel: compact tool-step labels (R8.4) and the source /
// feature chips collected from a message's tool outputs (R8.3).

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

const RUNNING: Record<string, string> = {
  get_insights: "Reading Insights and evidence",
  map_set_view: "Changing map display",
  geocode: "Finding the place",
  search_incidents: "Looking up reports",
  top_sites: "Ranking chronic sites",
  due_sites: "Finding sites due for follow-up",
  app_set_mode: "Switching app view",
  get_site: "Opening the site",
  nearby_drivers: "Checking what is nearby",
  what_worked: "Checking what worked",
  draft_work_order: "Drafting a work order",
  map_fly_to: "Moving the map",
  map_set_layers: "Changing layers",
  map_set_filters: "Changing filters",
  map_highlight: "Highlighting features",
  map_select: "Selecting a feature",
  map_show_forecast: "Showing the forecast",
  open_insight: "Opening the insight",
  get_ranking: "Reading the ranking",
  get_insight: "Reading the insight",
};

type Ok = { ok: true; data?: Record<string, unknown>; done?: string; sources?: SourceRef[]; features?: FeatureRef[] };
type Fail = { ok: false; error: string };

function asResult(output: unknown): Ok | Fail | null {
  if (output && typeof output === "object" && "ok" in output) return output as Ok | Fail;
  return null;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

function doneLabel(name: string, input: Record<string, unknown>, r: Ok): string {
  const d = r.data ?? {};
  switch (name) {
    case "get_insights":
      return d.live_status === "ready" ? "Read Insights and sources" : d.live_status === "not_requested" ? "Read historical research and sources" : "Read historical research; live insights unavailable";
    case "geocode": {
      const m = (d.matches as { label: string }[] | undefined) ?? [];
      return d.found ? `Found ${m[0]?.label ?? String(input.query)}` : `No match for "${String(input.query)}"`;
    }
    case "search_incidents": {
      const total = (d.total as number | null) ?? (d.returned as number) ?? 0;
      const where = input.query ? ` on ${String(input.query)}` : input.near ? " nearby" : "";
      return `Looked up ${plural(total, "report")}${where}`;
    }
    case "top_sites":
      return `Ranked ${plural(((d.sites as unknown[]) ?? []).length, "chronic site")}`;
    case "due_sites":
      return `Found ${plural(((d.sites as unknown[]) ?? []).length, "site")} due for follow-up`;
    case "get_site": {
      if (!d.found) return "Site not found";
      const s = d.site as { address_block?: string } | undefined;
      return `Opened ${s?.address_block ?? "site"} · ${plural(((d.timeline as unknown[]) ?? []).length, "report")}`;
    }
    case "nearby_drivers": {
      const n = ((d.driver_reports as { n: number }[]) ?? []).reduce((s, x) => s + x.n, 0);
      const p = ((d.places as { n: number }[]) ?? []).reduce((s, x) => s + x.n, 0);
      return `Found ${plural(n, "driver report")} and ${plural(p, "place")} within ${String(d.radius_m ?? "")} m`;
    }
    case "what_worked":
      return `Compared ${plural(((d.outcomes as unknown[]) ?? []).length, "action type")}`;
    case "draft_work_order":
      return d.drafted ? `Drafted: ${String(d.action_label)} (not approved)` : "Could not draft";
    default:
      return r.done ?? RUNNING[name] ?? name;
  }
}

export type ToolStepView = { id: string; name: string; status: "running" | "done" | "error"; label: string };

export function toolStep(part: ToolPart): ToolStepView {
  const name = getToolName(part as never);
  const input = (part as { input?: Record<string, unknown> }).input ?? {};
  const base = { id: part.toolCallId, name };
  switch (part.state) {
    case "output-available": {
      const r = asResult((part as { output?: unknown }).output);
      if (r && !r.ok) return { ...base, status: "error", label: r.error };
      return { ...base, status: "done", label: r ? doneLabel(name, input, r) : (RUNNING[name] ?? name) };
    }
    case "output-error":
      return { ...base, status: "error", label: (part as { errorText?: string }).errorText ?? "Tool failed" };
    case "output-denied":
      return { ...base, status: "error", label: "Not allowed" };
    default:
      return { ...base, status: "running", label: `${RUNNING[name] ?? name}…` };
  }
}

export function toolParts(m: UIMessage): ToolPart[] {
  return m.parts.filter((p) => isToolUIPart(p)) as ToolPart[];
}

/** Unique sources and features cited by a message's finished tool calls. */
export function collectRefs(m: UIMessage): { sources: SourceRef[]; features: FeatureRef[] } {
  const sources = new Map<string, SourceRef>();
  const features = new Map<string, FeatureRef>();
  for (const p of toolParts(m)) {
    if (p.state !== "output-available") continue;
    const r = asResult((p as { output?: unknown }).output);
    if (!r?.ok) continue;
    for (const s of r.sources ?? []) if (!sources.has(s.id)) sources.set(s.id, s);
    for (const f of r.features ?? []) if (!features.has(`${f.kind}:${f.id}`)) features.set(`${f.kind}:${f.id}`, f);
  }
  return { sources: [...sources.values()], features: [...features.values()] };
}

/** The draft work orders in a message (to render the "review in Inspect" card). */
export type DraftView = { site_id: string; action_label: string; owner: string; follow_up_on: string; address_block: string | null };

export function workOrderDrafts(m: UIMessage): DraftView[] {
  const out: DraftView[] = [];
  for (const p of toolParts(m)) {
    if (getToolName(p as never) !== "draft_work_order" || p.state !== "output-available") continue;
    const r = asResult((p as { output?: unknown }).output);
    if (r?.ok && r.data?.drafted) out.push(r.data as unknown as DraftView);
  }
  return out;
}

export function messageText(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export const STARTERS = [
  "Why do rats keep coming back on Normandy St?",
  "Which sites are due for follow-up?",
  "What is around the selected site?",
  "Show only open rodent reports from the last 30 days as a heatmap.",
  "What do Insights say, and what are the limitations?",
  "Show the latest forecast and explain it.",
];


/** Source provenance, using Boston time rather than the viewer's browser zone. */
export function sourceProvenance(source: SourceRef): { label: string; detail: string } {
  const modes = { live: "Live", daily: "Daily", static: "Static" };
  const label = source.update_mode ? modes[source.update_mode] : "Update cadence unknown";
  const date = source.retrieved_at ? new Date(source.retrieved_at) : null;
  const retrieved = date && Number.isFinite(date.getTime())
    ? `Retrieved ${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }).format(date)} (America/New_York)`
    : "Retrieval time unavailable";
  return { label, detail: [label, retrieved, source.update_note].filter(Boolean).join(" · ") };
}
