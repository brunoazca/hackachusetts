"use client";
import type { EvidenceInsight } from "@/lib/insight";
import { actionLabel, Caveat, Causes, day, num, pct, ReportLink, Section, Stat, type Cause } from "./shared";

// Evidence: a trash / dumping / dead-animal / pest 311 report, or a place (restaurant, vacant lot,
// permit, bin). What it is, and the rodent reports within 150 m that it may relate to.

type Json = Record<string, unknown>;

export default function EvidenceCard({ insight: v }: { insight: EvidenceInsight }) {
  const it = v.item as Json;
  const related = v.related_rodent_reports as unknown as { id: string; opened: string; address_block: string | null; distance_m: number; p_return_60d: number | null; city_did: string | null }[];
  const same = v.same_kind_nearby as Cause | null;
  const before = v.rodent_before as number | null;
  const after = v.rodent_after as number;
  const timed = before != null;
  const afterDays = v.after_days as number | null;
  const partial = timed && afterDays != null && afterDays < 90;

  return (
    <article className="space-y-3 p-3 text-small">
      <header className="px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-3">Evidence · {String(it.label ?? it.category)}</p>
        <h2 className="text-[15px] font-semibold text-fg">{String(it.name ?? it.address_block ?? "Location")}</h2>
        <p className="text-fg-3">
          {it.opened_at ? `Reported ${day(it.opened_at)}` : it.starts_at ? `Since ${day(it.starts_at)}` : "Fixed place"}
          {it.status ? ` · ${String(it.status)}` : ""}
        </p>
      </header>

      <Section title={`Rodent reports within 150 m · ${String(v.window)}`}>
        <div className="grid grid-cols-2 gap-2">
          {timed && <Stat value={num(before)} label="90 days before" />}
          <Stat value={num(after)} label={!timed ? "Last 12 months" : partial ? `${afterDays} days after (so far)` : "90 days after"} />
        </div>
        {partial && <p className="text-fg-3">Too recent to compare: only {afterDays} of the 90 days after have passed.</p>}
        {timed && !partial && <p className="text-fg-2">{after > (before ?? 0) ? "More rodent reports nearby after this item than before." : after < (before ?? 0) ? "Fewer rodent reports nearby after this item than before." : "Same number of rodent reports nearby before and after."}</p>}
      </Section>

      {same && (
        <Section title="How common this is here">
          <p className="text-fg-2">{same.count} {same.label} within 150 m{same.times_boston != null ? `, ${same.times_boston} times the Boston level` : ""}.</p>
        </Section>
      )}

      <Section title={`Rodent reports it may relate to (${related.length})`}>
        {related.length ? (
          <ol className="space-y-1.5">{related.map((r) => (
            <li key={r.id} className="flex items-baseline justify-between gap-2">
              <span><ReportLink id={r.id}>{r.opened}</ReportLink> <span className="text-fg-3">· {r.address_block ?? "—"} · {r.distance_m} m</span></span>
              <span className="shrink-0 text-fg-3">{actionLabel(r.city_did)}{r.p_return_60d != null ? ` · ${pct(r.p_return_60d)} return` : ""}</span>
            </li>
          ))}</ol>
        ) : <p className="text-fg-3">No rodent reports within 150 m in this window.</p>}
      </Section>

      <Section title="Other possible causes nearby">
        <Causes causes={((v.nearby_causes ?? []) as Cause[]).filter((c) => c.kind !== it.category)} />
      </Section>
      <Caveat>{String(v.caveat ?? "")}</Caveat>
    </article>
  );
}
