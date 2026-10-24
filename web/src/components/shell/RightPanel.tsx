"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useMap } from "@/lib/map-store";
import { useUi } from "@/lib/ui-store";
import SidePanel from "./SidePanel";
import { useMorph } from "@/lib/use-morph";

// Right panel (Inspect / Insights / Ask). Starts folded into a slim rail so the map gets the room;
// grows out of the rail icon you clicked (or the Inspect icon on a map selection, or "]"), and
// shrinks back into it. The rail stays underneath as the anchor.

type Tab = "inspector" | "insights" | "chat";
const ICON: Record<Tab, ReactNode> = {
  inspector: <path d="M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />,
  insights: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  chat: <path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12Z" />,
};
const LABEL: Record<Tab, string> = { inspector: "Inspect", insights: "Insights", chat: "Ask" };

// Inherited visibility can settle a few frames after a morph changes the parent.
// Wait for the actual target, and cancel if the panel changes again in the meantime.
function focusWhenVisible(getTarget: () => HTMLElement | null) {
  let frame: number;
  const focus = () => {
    const target = getTarget();
    if (!target?.isConnected) return;
    if (target.closest("[inert]")) return;
    if (!target.checkVisibility({ visibilityProperty: true })) {
      frame = requestAnimationFrame(focus);
      return;
    }
    target.focus({ preventScroll: true });
  };
  frame = requestAnimationFrame(focus);
  return () => cancelAnimationFrame(frame);
}

export default function RightPanel() {
  const open = useUi((s) => s.rightOpen);
  const setOpen = useUi((s) => s.setRightOpen);
  const selection = useMap((s) => s.selection);
  const panel = useMap((s) => s.panel);
  const setPanel = useMap((s) => s.setPanel);
  const asideRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(open);
  const btnRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  useMorph(open, asideRef, () => anchorRef.current ?? btnRefs.current.inspector ?? null);

  // Fit the panel to its content (Ask always gets the full height). The height eases when content
  // arrives or changes, so the card grows into place instead of sitting tall and empty.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const aside = asideRef.current, body = bodyRef.current;
    if (!aside || !body) return;
    const measure = () => {
      const top = parseFloat(getComputedStyle(aside).top);
      const max = (aside.parentElement?.clientHeight ?? window.innerHeight) - top - 12;
      const head = (aside.querySelector('[role="tablist"]')?.parentElement as HTMLElement | null)?.offsetHeight ?? 49;
      setHeight(panel === "chat" ? max : Math.min(max, head + body.offsetHeight + 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [panel]);

  const focusPanel = useCallback(() => {
    return focusWhenVisible(() => asideRef.current?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]') ?? null);
  }, []);
  const closePanel = useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  const openTab = useCallback((t: Tab) => {
    anchorRef.current = btnRefs.current[t] ?? null;
    returnFocusRef.current = anchorRef.current;
    setPanel(t);
    setOpen(true);
  }, [setPanel, setOpen]);

  // A selection opens the panel. Keyboard/list users land directly on its controls.
  useEffect(() => {
    if (!selection) return;
    anchorRef.current = btnRefs.current.inspector ?? null;
    const trigger = document.activeElement;
    let cancelFocus: (() => void) | undefined;
    if (trigger instanceof HTMLElement && trigger.hasAttribute("data-site-trigger")) {
      returnFocusRef.current = trigger;
      if (useUi.getState().rightOpen) cancelFocus = focusPanel();
    }
    setOpen(true);
    return cancelFocus;
  }, [selection, setOpen, focusPanel]);

  // Focus only after React has removed inert and the morph has made the panel visible.
  // An event-time animation frame can run before that commit during a busy map render.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return focusPanel();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      return focusWhenVisible(() => returnFocusRef.current?.isConnected
        ? returnFocusRef.current : anchorRef.current ?? btnRefs.current.inspector ?? null);
    }
    wasOpenRef.current = open;
  }, [open, focusPanel]);

  // "]" toggles; Esc folds it when focus is inside.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = /INPUT|TEXTAREA|SELECT/.test(target?.tagName ?? "") || target?.isContentEditable;
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key === "]") {
        e.preventDefault();
        if (useUi.getState().rightOpen) closePanel();
        else openTab(useMap.getState().panel as Tab);
      }
      if (e.key === "Escape" && asideRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel, openTab]);

  // Map controls move left only when the open panel actually reaches down to them;
  // a short panel leaves them in the corner.
  useEffect(() => {
    const root = document.documentElement;
    const area = asideRef.current?.parentElement?.clientHeight ?? window.innerHeight;
    const ctrlBottom = parseFloat(getComputedStyle(root).getPropertyValue("--ctrl-bottom")) || 12;
    const ctrlTop = area - ctrlBottom - 150;
    const aside = asideRef.current;
    const top = aside ? parseFloat(getComputedStyle(aside).top) : 68;
    const covers = open && (height == null || top + height + 8 > ctrlTop);
    root.style.setProperty("--right-inset", covers ? `${(aside?.offsetWidth ?? 380) + 32}px` : "12px");
  }, [open, height]);

  return (
    <>
      {/* Folded rail */}
      <div
        ref={railRef}
        inert={open}
        className={`glass absolute right-3 top-(--shell-top) z-30 flex w-[52px] flex-col items-center gap-1 rounded-lg p-1 transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`}
        role="toolbar"
        aria-label="Open details panel"
      >
        {(Object.keys(ICON) as Tab[]).map((t) => (
          <button
            key={t}
            ref={(el) => { btnRefs.current[t] = el; }}
            type="button"
            onClick={() => openTab(t)}
            aria-label={`Open ${LABEL[t]}`}
            aria-controls="details-panel"
            aria-expanded={open}
            title={`${LABEL[t]} · ]`}
            className="relative grid h-11 w-11 place-items-center rounded-md text-fg-2 transition-colors duration-150 hover:bg-card-hover hover:text-fg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICON[t]}</svg>
            {t === "inspector" && selection && <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-return ring-2 ring-[var(--p-panel-solid)]" />}
          </button>
        ))}
      </div>

      {/* Panel */}
      {(
        <aside
          id="details-panel"
          ref={asideRef}
          inert={!open}
          aria-label={`${LABEL[panel as Tab] ?? "Details"} panel`}
          style={{ height: height ?? undefined }}
          className="glass absolute right-3 top-(--shell-top) z-[31] max-h-[calc(100%-var(--shell-top)-12px)] w-[380px] max-w-[calc(100%-24px)] overflow-hidden rounded-lg transition-[height] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,clip-path] motion-reduce:transition-none"
        >
          <div className="flex h-full flex-col">
            <SidePanel onCollapse={closePanel} bodyRef={bodyRef} />
          </div>
        </aside>
      )}
    </>
  );
}
