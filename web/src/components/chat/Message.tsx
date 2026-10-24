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
    <div key={`${d.site_id}:${d.action_label}`} className="rounded-lg border border-line bg-amber-50 p-2.5 text-xs text-fg">
      <p className="flex items-center gap-1.5 font-semibold"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warn" />Suggested work order · needs your OK</p>
      <p>{d.action_label} · {d.owner}{d.address_block ? ` · ${d.address_block}` : ""}</p>
      <p className="text-fg-3">Check again on {d.follow_up_on}</p>
      <button
        type="button"
        onClick={() => select({ kind: "site", id: d.site_id })}
        className="mt-1.5 rounded-md bg-fg px-2.5 py-1 font-semibold text-bg hover:opacity-85 focus-visible:outline-2 focus-visible:outline-accent"
      >
        Review this place
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
        <details className="group/refs pt-1">
          <summary className="inline-flex min-h-10 max-w-full cursor-pointer list-none items-center gap-2.5 rounded-full border border-line bg-card px-3.5 py-2 text-xs font-medium text-fg-2 shadow-sm transition-colors hover:border-edge hover:bg-card-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6M8 13h8M8 17h5" />
            </svg>
            <span>Sources & records</span>
            <span className="rounded-full bg-card-hover px-1.5 py-0.5 text-[10px] leading-none tabular-nums" aria-label={`${sources.length + features.length} references`}>
              {sources.length + features.length}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 transition-transform group-open/refs:rotate-180 motion-reduce:transition-none">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="mt-2 space-y-3 rounded-xl border border-line bg-card p-3">
            <FeatureChips features={features} />
            <SourceChips sources={sources} />
          </div>
        </details>
      )}
    </article>
  );
}
