// Tested result per layer (R2.16), shown next to each toggle. Values from the Oct 24 block-level tests in
// .kiro/specs/rat-audit/data-validation.md (partial Spearman with 2025–26 rodent reports per cell,
// controlling for last year's reports, all-311 volume and address count; placebo = +0.01).
// TODO(analytics): read these from the `correlations` table once it is populated; fallback stays "not tested".

export type Tested = { strength: "outcome" | "leading" | "weak" | "none" | "not tested"; text: string };

export const TESTED: Record<string, Tested> = {
  rodent: { strength: "outcome", text: "the outcome we track" },
  dead_animal: { strength: "leading", text: "leading signal, +0.14" },
  pest: { strength: "leading", text: "leading signal, +0.11" },
  trash_storage: { strength: "weak", text: "weak, +0.18 (block level)" },
  move_in_trash: { strength: "weak", text: "weak, +0.13" },
  weeds: { strength: "weak", text: "weak, +0.10" },
  trash_early: { strength: "weak", text: "weak, +0.09" },
  litter: { strength: "weak", text: "weak, +0.09" },
  dumpster: { strength: "weak", text: "weak, +0.09" },
  ce_trash_storage: { strength: "weak", text: "weak, +0.09" },
  construction_debris: { strength: "none", text: "no effect" },
  inat_rat: { strength: "not tested", text: "independent sightings" },
};

export const testedFor = (id: string): Tested => TESTED[id] ?? { strength: "not tested", text: "not tested" };

export const STRENGTH_STYLE: Record<Tested["strength"], string> = {
  outcome: "text-neutral-900",
  leading: "text-emerald-800",
  weak: "text-amber-800",
  none: "text-neutral-700",
  "not tested": "text-neutral-600",
};
