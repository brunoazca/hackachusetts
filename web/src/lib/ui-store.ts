"use client";
import { create } from "zustand";

// Shell layout state shared by the right panel and the map (padding, control position).
type UiState = { rightOpen: boolean; setRightOpen: (v: boolean | ((o: boolean) => boolean)) => void };

export const useUi = create<UiState>((set) => ({
  rightOpen: false,
  setRightOpen: (v) => set((s) => ({ rightOpen: typeof v === "function" ? v(s.rightOpen) : v })),
}));

/** Right inset of the clear map area, in px (panel 380 + gaps, or the collapsed rail). */
export const rightInset = (open: boolean) => (open ? 404 : 76);
