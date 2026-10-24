"use client";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

// "Morph" a panel out of the button that opened it: the panel starts clipped to the button's box
// (and moved onto it when it lives elsewhere), then grows to full size; closing plays it backwards.
// Content is clipped, never scaled, so text stays crisp. Reduced motion = instant.
// Returns `shown`: keep the panel rendered while this is true (it stays true during the exit).

const OPEN_MS = 280, CLOSE_MS = 200;
const EASE_OPEN = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_CLOSE = "cubic-bezier(0.4, 0, 1, 1)";

function reduced() {
  return typeof window !== "undefined" &&
    (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced");
}

function frames(b: DOMRect, p: DOMRect, radius: number): Keyframe[] {
  const inside = b.left >= p.left - 1 && b.right <= p.right + 1 && b.top >= p.top - 1 && b.bottom <= p.bottom + 1;
  const start: Keyframe = inside
    ? { // button sits inside the panel's box: grow from its spot
        transform: "translate(0px, 0px)",
        clipPath: `inset(${b.top - p.top}px ${p.right - b.right}px ${p.bottom - b.bottom}px ${b.left - p.left}px round ${radius}px)`,
      }
    : { // panel lives elsewhere: start on top of the button, the size of the button
        transform: `translate(${b.left - p.left}px, ${b.top - p.top}px)`,
        clipPath: `inset(0px ${Math.max(0, p.width - b.width)}px ${Math.max(0, p.height - b.height)}px 0px round ${radius}px)`,
      };
  return [
    { ...start, opacity: 0.5 },
    { transform: "translate(0px, 0px)", clipPath: `inset(0px 0px 0px 0px round 8px)`, opacity: 1 },
  ];
}

export function useMorph(open: boolean, panelRef: RefObject<HTMLElement | null>, getAnchor: () => HTMLElement | null) {
  const [shown, setShown] = useState(open);
  const anim = useRef<Animation | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) { setPrevOpen(open); if (open) setShown(true); }

  useLayoutEffect(() => {
    const el = panelRef.current;
    const anchor = getAnchor();
    const hide = () => queueMicrotask(() => setShown(false));
    if (!el) { if (!open) hide(); return; }
    anim.current?.cancel();
    if (reduced() || !anchor || !el.animate) { if (!open) hide(); return; }
    const kf = frames(anchor.getBoundingClientRect(), el.getBoundingClientRect(), 10);
    // Content fades in slightly after the box starts growing, so it never looks squashed.
    const content = el.firstElementChild as HTMLElement | null;
    if (open) {
      anim.current = el.animate(kf, { duration: OPEN_MS, easing: EASE_OPEN });
      content?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: OPEN_MS, easing: "linear" });
    } else {
      anim.current = el.animate([...kf].reverse(), { duration: CLOSE_MS, easing: EASE_CLOSE, fill: "forwards" });
      content?.animate([{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], { duration: CLOSE_MS, fill: "forwards" });
      anim.current.onfinish = hide;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shown]);

  return shown;
}
