"use client";
import { create } from "zustand";

// Shell layout state shared by the right panel and the map (padding, control position).
type Flag = boolean | ((o: boolean) => boolean);
type UiState = {
  rightOpen: boolean; setRightOpen: (v: Flag) => void;
  timelineOpen: boolean; setTimelineOpen: (v: Flag) => void;
};

export const useUi = create<UiState>((set) => ({
  rightOpen: false,
  setRightOpen: (v) => set((s) => ({ rightOpen: typeof v === "function" ? v(s.rightOpen) : v })),
  timelineOpen: false,
  setTimelineOpen: (v) => set((s) => ({ timelineOpen: typeof v === "function" ? v(s.timelineOpen) : v })),
}));

/** Right inset of the clear map area, in px (panel 380 + gaps, or the collapsed rail). */
export const rightInset = (open: boolean) => (open ? 404 : 76);
