"use client";
import { create } from "zustand";

// In-app accessibility preferences. Today: Reduce motion, required by the ship gate
// (docs/design/accessibility.md) on top of the OS `prefers-reduced-motion` media query.
//
// The CSS in styles/piper.css already stops animation under either
// `@media (prefers-reduced-motion: reduce)` or `[data-motion="reduced"]`, so this store
// only has to flip that attribute on <html> and remember the choice.

export type Motion = "full" | "reduced";
type A11yState = { motion: Motion; setMotion: (m: Motion) => void; toggleMotion: () => void };

const KEY = "piper-motion";

function apply(m: Motion) {
  if (typeof document === "undefined") return;
  if (m === "reduced") document.documentElement.dataset.motion = "reduced";
  else delete document.documentElement.dataset.motion;
  try { localStorage.setItem(KEY, m); } catch { /* private mode */ }
}

export const useA11y = create<A11yState>((set, get) => ({
  motion: "full",
  setMotion: (motion) => { apply(motion); set({ motion }); },
  toggleMotion: () => get().setMotion(get().motion === "reduced" ? "full" : "reduced"),
}));

/**
 * Resolve the motion preference once on the client: a saved in-app choice wins; otherwise
 * the OS `prefers-reduced-motion` setting seeds it. Call from TopBar on mount.
 */
export function restoreMotion() {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "reduced" || saved === "full") { useA11y.getState().setMotion(saved); return; }
  } catch { /* ignore */ }
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) useA11y.getState().setMotion("reduced");
}
