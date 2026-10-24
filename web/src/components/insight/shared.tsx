"use client";
import type { ReactNode } from "react";
import { useMap } from "@/lib/map-store";
import { fmtNumber } from "@/components/insights/format";

// Small pieces shared by the Insight panel views (ranking, area, report, evidence).

export const ACTION_LABEL: Record<string, string> = {
  monitoring: "Inspector monitoring", inspection: "Inspection", abatement_order: "Abatement order", citation: "Citation",
  warning: "Warning / notice", referral: "Referral", cleanup: "Cleanup", barrels: "Rat-resistant barrels",
  baiting: "Earlier ISD visit", carcass: "Dead animal removed", no_violation: "No violation found", duplicate: "Duplicate",
  collections: "Fine to collections", closed_no_action: "Closed, no note", unknown: "Not recorded", open: "Still open",
};
export const actionLabel = (a: unknown) => ACTION_LABEL[String(a ?? "")] ?? String(a ?? "—").replace(/_/g, " ");

export const pct = (p: unknown) => typeof p === "number" && Number.isFinite(p) ? `${Math.round(p * 100)}%` : "—";
export const num = (n: unknown) => typeof n === "number" && Number.isFinite(n) ? fmtNumber(n) : "—";
export const day = (iso: unknown) => typeof iso === "string" && iso
  ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }) : "—";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-line pt-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-fg-3">{title}</h3>
      {children}
    </section>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-card px-2.5 py-2">
      <div className="font-mono text-[18px] font-semibold tabular-nums text-fg">{value}</div>
      <div className="text-[11px] leading-4 text-fg-3">{label}</div>
    </div>
  );
}

/** A report id rendered as a link that opens its own insight. */
export function ReportLink({ id, children }: { id: string; children: ReactNode }) {
  const select = useMap((s) => s.select);
  return (
    <button type="button" onClick={() => select({ kind: "incident", id })}
      className="text-left font-medium text-fg underline decoration-fg-3 underline-offset-2 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-accent">
      {children}
    </button>
  );
}

export type Cause = { kind: string; label: string; count: number; nearest_m: number | null; times_boston: number | null };

export function Causes({ causes }: { causes: Cause[] }) {
  if (!causes.length) return <p className="text-small text-fg-3">No trash, lots or building work recorded within 150 m.</p>;
  return (
    <ul className="space-y-1.5">
      {causes.slice(0, 6).map((c) => (
        <li key={c.kind} className="flex items-baseline justify-between gap-3 text-small">
          <span className="text-fg-2">{c.label}<span className="text-fg-3"> · {c.count}{c.nearest_m != null ? ` · nearest ${c.nearest_m} m` : ""}</span></span>
          {c.times_boston != null && (
            <span className={`shrink-0 font-mono tabular-nums ${c.times_boston >= 2 ? "font-semibold text-fg" : "text-fg-3"}`}>×{c.times_boston} Boston</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export const Caveat = ({ children }: { children: ReactNode }) => <p className="text-[11px] leading-4 text-fg-3">{children}</p>;
