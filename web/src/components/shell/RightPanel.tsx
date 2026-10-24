"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useMap } from "@/lib/map-store";
import { rightInset, useUi } from "@/lib/ui-store";
import SidePanel from "./SidePanel";

// Right panel (Inspect / Insights / Ask). Starts folded into a slim rail so the map gets the room;
// slides open on a map selection, a rail click, or "]". Both states stay mounted so the move is a
// single transform; the hidden one is `inert` so keyboard and screen readers skip it.

type Tab = "inspector" | "insights" | "chat";
const ICON: Record<Tab, ReactNode> = {
  inspector: <path d="M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />,
  insights: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  chat: <path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12Z" />,
};
const LABEL: Record<Tab, string> = { inspector: "Inspect", insights: "Insights", chat: "Ask" };

export default function RightPanel() {
  const open = useUi((s) => s.rightOpen);
  const setOpen = useUi((s) => s.setRightOpen);
  const selection = useMap((s) => s.selection);
  const panel = useMap((s) => s.panel);
  const setPanel = useMap((s) => s.setPanel);
  const asideRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // A new selection on the map opens the panel.
  useEffect(() => { if (selection) setOpen(true); }, [selection, setOpen]);

  // "]" toggles; Esc folds it when focus is inside.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "");
      if (!typing && !e.metaKey && !e.ctrlKey && e.key === "]") setOpen((v) => !v);
      if (e.key === "Escape" && asideRef.current?.contains(document.activeElement)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Map controls follow the panel edge.
  useEffect(() => {
    document.documentElement.style.setProperty("--right-inset", `${rightInset(open) + 8}px`);
  }, [open]);

  const openTab = (t: Tab) => { setPanel(t); setOpen(true); };

  return (
    <>
      {/* Folded rail */}
      <div
        ref={railRef}
        inert={open}
        aria-hidden={open}
        className={`glass absolute right-3 top-[68px] z-30 flex w-[52px] flex-col items-center gap-1 rounded-lg p-1 transition-[opacity,transform] duration-300 ease-[var(--ease-spring)] ${open ? "pointer-events-none translate-x-2 opacity-0" : "opacity-100"}`}
        role="toolbar"
        aria-label="Open details panel"
      >
        {(Object.keys(ICON) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => openTab(t)}
            aria-label={`Open ${LABEL[t]}`}
            title={`${LABEL[t]} · ]`}
            className="relative grid h-11 w-11 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-card-hover hover:text-fg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICON[t]}</svg>
            {t === "inspector" && selection && <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-return ring-2 ring-[var(--p-panel-solid)]" />}
          </button>
        ))}
      </div>

      {/* Panel */}
      <aside
        ref={asideRef}
        inert={!open}
        aria-label={`${LABEL[panel as Tab] ?? "Details"} panel`}
        className={`glass absolute bottom-3 right-3 top-[68px] z-30 flex w-[380px] flex-col overflow-hidden rounded-lg transition-[transform,opacity] duration-300 ease-[var(--ease-spring)] will-change-transform ${open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[calc(100%+16px)] opacity-0"}`}
      >
        <SidePanel onCollapse={() => setOpen(false)} />
      </aside>
    </>
  );
}
