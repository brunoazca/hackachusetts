"use client";
import { create } from "zustand";
import type { ThemeName } from "@/lib/design-tokens";

// Night (default, desk) / Bone (daylight). Sets <html data-theme> and remembers the choice.
// Spec: docs/design/foundations/color.md (Themes).

type ThemeState = { theme: ThemeName; setTheme: (t: ThemeName) => void; toggle: () => void };

const KEY = "piper-theme";

function apply(t: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: "night",
  setTheme: (theme) => { apply(theme); set({ theme }); },
  toggle: () => get().setTheme(get().theme === "night" ? "bone" : "night"),
}));

/** Read ?theme=night|bone, else the saved theme, once on the client (called from TopBar on mount). */
export function restoreTheme() {
  try {
    const q = new URLSearchParams(location.search).get("theme");
    const saved = q ?? localStorage.getItem(KEY);
    if (saved === "night" || saved === "bone") useTheme.getState().setTheme(saved);
  } catch { /* ignore */ }
}
