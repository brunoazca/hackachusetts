// Small shared display parts so every card reads the same way. Theme tokens only (Night/Bone).
import type { ReactNode } from "react";

export type Band = "low" | "elevated" | "high" | "very_high";

export const BAND_STYLE: Record<Band, { label: string; pill: string; solid: string }> = {
  low: { label: "Low", pill: "bg-card-hover text-fg-2", solid: "bg-card-hover text-fg" },
  elevated: { label: "Elevated", pill: "bg-amber-50 text-warn", solid: "bg-card-hover text-fg" },
  high: { label: "High", pill: "bg-amber-50 text-warn", solid: "bg-warn text-accent-fg" },
  very_high: { label: "Very high", pill: "bg-red-100 text-return", solid: "bg-return text-accent-fg" },
};

export function BandPill({ band }: { band: Band }) {
  const b = BAND_STYLE[band];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.pill}`}>{b.label}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="text-eyebrow font-semibold uppercase tracking-wide text-fg-3">{children}</span>;
}

/** One number tile: big value, small label. */
export function StatTile({ value, label, tone }: { value: ReactNode; label: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card px-2.5 py-2">
      <div className={`font-mono text-data-lg font-semibold tabular-nums ${tone ?? "text-fg"}`}>{value}</div>
      <div className="text-[11px] leading-4 text-fg-3">{label}</div>
    </div>
  );
}

/** Ring gauge for a 0..1 share. */
export function Ring({ share, color = "var(--p-forecast)", size = 52, children }: { share: number; color?: string; size?: number; children?: ReactNode }) {
  const r = 18, c = 2 * Math.PI * r, s = Math.max(0, Math.min(1, share));
  return (
    <span className="relative inline-grid flex-none place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--p-line)" strokeWidth="5" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(s * c).toFixed(2)} ${c.toFixed(2)}`} />
      </svg>
      <span className="relative font-mono text-[12px] font-bold tabular-nums text-fg">{children}</span>
    </span>
  );
}

/** Horizontal bar used for drivers and small breakdowns. */
export function Meter({ share, className = "bg-fg-3" }: { share: number; className?: string }) {
  return (
    <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-card-hover">
      <span className={`block h-full rounded-full ${className}`} style={{ width: `${Math.max(2, Math.min(100, share * 100))}%` }} />
    </span>
  );
}

/** Info hint: long rules live behind this instead of in a paragraph. */
export function InfoHint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group relative inline-block">
      <summary aria-label={label} className="grid h-5 w-5 cursor-pointer list-none place-items-center rounded-full border border-line text-[11px] font-semibold text-fg-3 hover:border-edge hover:text-fg">i</summary>
      <div className="absolute right-0 z-30 mt-1 w-64 rounded-lg border border-line bg-panel-solid p-2.5 text-[12px] leading-[17px] text-fg-2 shadow-panel">
        {children}
      </div>
    </details>
  );
}

/** Content-shaped loading placeholder. */
export function Skeleton({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3 p-4">
      <span className="sr-only">{label}</span>
      <div aria-hidden className="h-3 w-24 animate-pulse rounded bg-card-hover" />
      <div aria-hidden className="h-6 w-48 animate-pulse rounded bg-card-hover" />
      {Array.from({ length: rows }, (_, i) => <div key={i} aria-hidden className="h-14 animate-pulse rounded-lg bg-card-hover" />)}
    </div>
  );
}
