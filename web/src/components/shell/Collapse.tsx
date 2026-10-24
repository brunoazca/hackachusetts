"use client";
import type { ReactNode } from "react";

// Shared header for floating panels: title, optional meta, and a collapse button.
// Collapsed panels shrink to a small glass tab so the map gets the space back.

export function CollapseButton({ onClick, label, dir }: { onClick: () => void; label: string; dir: "left" | "right" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-fg-3 transition-colors duration-150 hover:bg-card-hover hover:text-fg"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}

/** The tab a collapsed panel leaves behind. */
export function CollapsedTab({ side, label, meta, onOpen, top }: { side: "left" | "right"; label: string; meta?: ReactNode; onOpen: () => void; top?: number }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      style={{ top: top ?? "var(--shell-top, 68px)" }}
      className={`map-secondary-panel glass absolute z-30 flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold text-fg transition-colors duration-150 hover:bg-card-hover ${side === "left" ? "left-3" : "right-3"}`}
    >
      {side === "right" && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
      )}
      <span>{label}</span>
      {meta && <span className="font-mono text-[11px] font-normal text-fg-3">{meta}</span>}
      {side === "left" && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="m9 18 6-6-6-6" /></svg>
      )}
    </button>
  );
}
