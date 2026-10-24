"use client";
import type { EvidenceInsight } from "@/lib/insight";
import { markerDataUrl } from "@/components/map/icons";
import { actionLabel, Caveat, Causes, day, num, pct, ReportLink, Section, Stat, type Cause } from "./shared";

// Evidence: a trash / dumping / dead-animal / pest 311 report, or a place (restaurant, vacant lot,
// permit, bin). What it is, and the rodent reports within 150 m that it may relate to.

type Json = Record<string, unknown>;

const shortDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
// "INTERSECTION Cedar Lane Way & Mount Vernon St" -> "Cedar Lane Way & Mount Vernon St"; drop the ZIP.
const street = (a: string | null) => (a ?? "—").replace(/^INTERSECTION\s+/i, "").replace(/,?\s*\d{5}$/, "");

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

      <Section title="Rodent reports within 150 m">
        <div className="grid grid-cols-2 gap-2">
          {timed && <Stat value={num(before)} label="90 days before" />}
          <Stat value={num(after)} label={!timed ? "Last 12 months" : partial ? `${afterDays} of 90 days after` : "90 days after"} />
        </div>
        {timed && !partial && <p className="text-fg-2">{after > (before ?? 0) ? "More reports after than before." : after < (before ?? 0) ? "Fewer reports after than before." : "No change before vs after."}</p>}
      </Section>

      {same && (
        <Section title="How common this is here">
          <p className="text-fg-2">{same.count} {same.label} within 150 m{same.times_boston != null ? `, ${same.times_boston} times the Boston level` : ""}.</p>
        </Section>
      )}

      <Section title={`Nearby rodent reports (${related.length})`}>
        {related.length ? (
          <ol className="space-y-1">{related.map((r) => (
            <li key={r.id} className="flex items-center gap-2" title={actionLabel(r.city_did)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={markerDataUrl("rodent", r.city_did !== "open")} alt="" width={20} height={20} className="shrink-0" />
              <ReportLink id={r.id}>{shortDay(r.opened)}</ReportLink>
              <span className="min-w-0 flex-1 truncate text-fg-3">{street(r.address_block)}</span>
              <span className="shrink-0 font-mono tabular-nums text-fg-3">{r.distance_m} m{r.p_return_60d != null ? ` · ${pct(r.p_return_60d)}` : ""}</span>
            </li>
          ))}</ol>
        ) : <p className="text-fg-3">None within 150 m in this window.</p>}
      </Section>

      <Section title="Other possible causes nearby">
        <Causes causes={((v.nearby_causes ?? []) as Cause[]).filter((c) => c.kind !== it.category)} />
      </Section>
      <Caveat>{String(v.caveat ?? "")}</Caveat>
    </article>
  );
}
