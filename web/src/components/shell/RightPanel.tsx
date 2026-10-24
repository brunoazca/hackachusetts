"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useMap } from "@/lib/map-store";
import { useUi } from "@/lib/ui-store";
import SidePanel from "./SidePanel";
import { useMorph } from "@/lib/use-morph";

// Right panel: Ask (chat) only. Insight and detail live in the left Insight panel, which follows the
// map selection. Starts folded into a floating button in the bottom-right corner; grows out of it on
// click or "]".

type Tab = "chat";
const ICON: Record<Tab, ReactNode> = {
  chat: <path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12Z" />,
};
const LABEL: Record<Tab, string> = { chat: "Ask" };

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
  const panel = "chat" as const;
  const setPanel = useMap((s) => s.setPanel);
  const asideRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(open);
  const btnRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  useMorph(open, asideRef, () => anchorRef.current ?? btnRefs.current.chat ?? null);

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
      const head = 49;
      setHeight(panel === "chat" ? max : Math.min(max, head + body.offsetHeight + 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [panel]);

  const focusPanel = useCallback(() => {
    return focusWhenVisible(() => asideRef.current?.querySelector<HTMLElement>("#chat-input") ?? null);
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

  // Focus only after React has removed inert and the morph has made the panel visible.
  // An event-time animation frame can run before that commit during a busy map render.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return focusPanel();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      return focusWhenVisible(() => returnFocusRef.current?.isConnected
        ? returnFocusRef.current : anchorRef.current ?? btnRefs.current.chat ?? null);
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
        else openTab("chat");
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
    // Folded, the Ask button owns the corner, so the controls sit just above it.
    const ctrlBottom = open ? 4 : 76;
    root.style.setProperty("--ctrl-bottom", `${ctrlBottom}px`);
    const ctrlTop = area - ctrlBottom - 150;
    const aside = asideRef.current;
    const top = aside ? parseFloat(getComputedStyle(aside).top) : 68;
    const covers = open && (height == null || top + height + 8 > ctrlTop);
    root.style.setProperty("--right-inset", covers ? `${(aside?.offsetWidth ?? 380) + 32}px` : "12px");
  }, [open, height]);

  return (
    <>
      {/* Folded: a floating Ask button */}
      <div
        ref={railRef}
        inert={open}
        className={`absolute bottom-5 right-5 z-30 transition-[opacity,transform] duration-200 ${open ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100"}`}
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
            className="flex h-14 items-center gap-2.5 rounded-full bg-return pl-5 pr-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28),0_2px_6px_rgba(0,0,0,0.18)] ring-1 ring-white/20 transition-[filter,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_28px_rgba(0,0,0,0.32),0_3px_8px_rgba(0,0,0,0.2)] active:translate-y-0 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-return"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICON[t]}</svg>
            {LABEL[t]}
          </button>
        ))}
      </div>

      {/* Panel */}
      {(
        <aside
          id="details-panel"
          ref={asideRef}
          inert={!open}
          aria-label="Ask panel"
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
