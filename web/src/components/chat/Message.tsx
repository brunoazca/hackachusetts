"use client";
import type { UIMessage } from "ai";
import { useMap } from "@/lib/map-store";
import { collectRefs, toolParts, toolStep, workOrderDrafts } from "@/lib/agent/ui";
import { FeatureChips, SourceChips } from "./Chips";

const ICON = { running: "…", done: "✓", error: "!" } as const;

function ToolSteps({ message }: { message: UIMessage }) {
  const steps = toolParts(message).map(toolStep);
  if (!steps.length) return null;
  return (
    <ol aria-label="Steps" className="space-y-0.5 text-xs text-neutral-600">
      {steps.map((s) => (
        <li key={s.id} className={`flex gap-1.5 ${s.status === "error" ? "text-red-700" : ""}`}>
          <span aria-hidden className="w-3 text-center">{ICON[s.status]}</span>
          <span>
            {s.label}
            {s.status === "running" && <span className="sr-only"> (in progress)</span>}
            {s.status === "error" && <span className="sr-only"> (failed)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function DraftCards({ message }: { message: UIMessage }) {
  const select = useMap((s) => s.select);
  const drafts = workOrderDrafts(message);
  return drafts.map((d) => (
    <div key={`${d.site_id}:${d.action_label}`} className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950">
      <p className="font-medium">Draft work order — not approved</p>
      <p>{d.action_label} · {d.owner}{d.address_block ? ` · ${d.address_block}` : ""}</p>
      <p>Follow-up {d.follow_up_on}</p>
      <button
        type="button"
        onClick={() => select({ kind: "site", id: d.site_id })}
        className="mt-1 rounded border border-amber-400 bg-white px-2 py-0.5 font-medium hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-900"
      >
        Review in Inspect
      </button>
    </div>
  ));
}

export default function Message({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <div className="ml-8 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white">
        <span className="sr-only">You: </span>{text}
      </div>
    );
  }
  const { sources, features } = collectRefs(message);
  return (
    <article aria-label="Assistant answer" className="space-y-2">
      <ToolSteps message={message} />
      {message.parts.map((p, i) =>
        p.type === "text" && p.text ? (
          <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">{p.text}</p>
        ) : null,
      )}
      <DraftCards message={message} />
      {(sources.length > 0 || features.length > 0) && (
        <details className="group/refs rounded-md border border-edge">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-fg-2 hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="shrink-0 group-open/refs:rotate-90">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="group-open/refs:hidden">Show sources and records</span>
            <span className="hidden group-open/refs:inline">Hide sources and records</span>
          </summary>
          <div className="space-y-3 border-t border-line p-3">
            <FeatureChips features={features} />
            <SourceChips sources={sources} />
          </div>
        </details>
      )}
    </article>
  );
}
