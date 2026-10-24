// Tested result per layer (R2.16), shown next to each toggle. Values from the Oct 24 block-level tests in
// .kiro/specs/rat-audit/data-audit.md (partial Spearman with 2025–26 rodent reports per cell,
// controlling for last year's reports, all-311 volume and address count; placebo = +0.01).
// TODO(analytics): read these from the `correlations` table once it is populated; fallback stays "not tested".

export type Tested = { strength: "outcome" | "leading" | "weak" | "none" | "not tested"; text: string };

export const TESTED: Record<string, Tested> = {
  rodent: { strength: "outcome", text: "what we track" },
  dead_animal: { strength: "weak", text: "small link to rodent reports" },
  pest: { strength: "weak", text: "small link to rodent reports" },
  trash_storage: { strength: "weak", text: "some link to rodent reports" },
  move_in_trash: { strength: "weak", text: "small link to rodent reports" },
  weeds: { strength: "weak", text: "small link to rodent reports" },
  trash_early: { strength: "weak", text: "very small link to rodent reports" },
  litter: { strength: "weak", text: "very small link to rodent reports" },
  dumpster: { strength: "weak", text: "very small link to rodent reports" },
  ce_trash_storage: { strength: "weak", text: "very small link to rodent reports" },
  construction_debris: { strength: "weak", text: "very small link to rodent reports" },
  inat_rat: { strength: "not tested", text: "sightings shared by people; not checked" },
};

export const testedFor = (id: string): Tested => TESTED[id] ?? { strength: "not tested", text: "not checked yet" };

export const STRENGTH_STYLE: Record<Tested["strength"], string> = {
  outcome: "text-neutral-900",
  leading: "text-emerald-800",
  weak: "text-amber-800",
  none: "text-neutral-700",
  "not tested": "text-neutral-600",
};
