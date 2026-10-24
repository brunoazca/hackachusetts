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
      <FeatureChips features={features} />
      <SourceChips sources={sources} />
    </article>
  );
}
