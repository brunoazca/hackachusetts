"use client";

// Placeholder styled with Piper tokens until the insights track lands. Owned by its track;
// replace freely, keep the export name. The one finding shown is the spec's lead result
// (.kiro/specs/rat-audit/requirements.md, R5.2), not live data.

function Bar({ label, before, after, good }: { label: string; before: number; after: number; good?: boolean }) {
  const h = (v: number) => `${(v / 16) * 100}%`;
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <div className="flex h-28 items-end gap-1.5" aria-hidden>
        <div className="flex w-9 flex-col items-center justify-end gap-1" style={{ height: "100%" }}>
          <span className="font-mono text-[10px] text-fg-3">{before}</span>
          <div className="w-full rounded-t-[2px] bg-fg-3/60" style={{ height: h(before) }} />
        </div>
        <div className="flex w-9 flex-col items-center justify-end gap-1" style={{ height: "100%" }}>
          <span className="font-mono text-[10px] text-fg">{after}</span>
          <div className={`w-full rounded-t-[2px] ${good ? "bg-held" : "bg-return"}`} style={{ height: h(after) }} />
        </div>
      </div>
      <span className="font-mono text-[11px] text-fg-3">{label}</span>
    </div>
  );
}

export default function InsightsPanel() {
  return (
    <div className="space-y-3 px-5 pb-5 pt-4">
      <article className="space-y-3 rounded-lg border border-line bg-card p-5">
        <span className="eyebrow">Finding 01 · What worked</span>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-fg">Monitoring changes nothing. Violations do.</h2>
        <p className="text-[13px] leading-[18px] text-fg-2">Share of addresses with a new report within 60 days, before and after each closure type (2025).</p>
        <div className="flex gap-4 pt-1" role="img" aria-label="Monitoring: 14.1% before, 14.2% after. Violation: 15.3% before, 12.2% after.">
          <Bar label="monitoring" before={14.1} after={14.2} />
          <Bar label="violation" before={15.3} after={12.2} good />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-fg-2">14.1% → 14.2% · 15.3% → 12.2%</span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">moderate</span>
        </div>
        <p className="text-xs text-fg-3">Reports, not rats. Source: Boston 311 rodent closures, 2025 (research result; the live Insights panel replaces this card).</p>
      </article>
      <article className="space-y-2 rounded-lg border border-line bg-card p-5">
        <span className="eyebrow">Finding · Weather</span>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-fg">Rain: no effect.</h2>
        <p className="text-xs text-fg-3">Null results get the same card.</p>
      </article>
    </div>
  );
}
