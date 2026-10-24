"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import categories from "@/lib/categories.json";
import { fetchSiteDetail, type SiteDetail } from "@/lib/queries";
import { markerDataUrl } from "@/components/map/icons";
import { formatDate } from "@/lib/dates";
import { COUNT_EXPLANATION, reportDays, sourcesFor } from "@/lib/evidence";
import SourceList from "@/components/evidence/SourceList";

// Site case (R3.2), compact: the answer first (returns vs closures), one strip of numbers,
// a report timeline, nearby records, and the last few recorded responses. Long closure notes are
// trimmed to their first sentence; the full list is one click away.
// Decision + work order (R4) land when the analytics `sites` table exists.

const CATS = categories.incident_categories as Record<string, { label: string }>;

/** First sentence of a closure note, without staff tags. */
function gist(note: string | null) {
  if (!note) return "No note";
  const clean = note.replace(/\[staff\]/gi, "").replace(/\s+/g, " ").trim();
  const first = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  return first.length > 90 ? `${first.slice(0, 88)}…` : first;
}

const fmt = (d: string) => formatDate(d, { year: "2-digit" });

function Stat({ value, label, tone }: { value: string | number; label: string; tone?: string }) {
  return (
    <div className="min-w-0 flex-1 px-3 py-2 first:pl-0">
      <div className={`font-mono text-[18px] font-medium leading-6 tabular-nums ${tone ?? "text-fg"}`}>{value}</div>
      <div className="text-[11px] leading-4 text-fg-3">{label}</div>
    </div>
  );
}

export default function SiteCase({ id }: { id: string }) {
  const [result, setResult] = useState<{ id: string; data?: SiteDetail | null; error?: string } | null>(null);
  const [allDrivers, setAllDrivers] = useState(false);
  const [allReports, setAllReports] = useState(false);

  useEffect(() => {
    let live = true;
    fetchSiteDetail(id).then((data) => live && setResult({ id, data })).catch((e) => live && setResult({ id, error: String(e) }));
    return () => { live = false; };
  }, [id]);

  const d = result?.id === id ? result.data : null;
  const view = useMemo(() => {
    if (!d) return null;
    const metadata = new Map(d.evidence?.reports.map((r) => [r.id, r]));
    const reports = d.reports.map((r) => ({ ...r, back: metadata.get(r.id)?.after_closure ?? false }));
    const t0 = Math.min(...reports.map((r) => Date.parse(r.opened)));
    const t1 = Math.max(Date.parse(d.site.last_at), ...reports.map((r) => Date.parse(r.opened)));
    const drivers = Object.entries(d.drivers_100m_12mo).sort((a, b) => b[1] - a[1]);
    return { reports, days: reportDays(reports), t0, t1, drivers, max: drivers[0]?.[1] ?? 1 };
  }, [d]);

  if (result?.id === id && result.error) return <p role="alert" className="p-5 text-sm text-return">Could not load this site: {result.error}</p>;
  if (result?.id === id && result.data === null) return <p className="p-5 text-sm text-fg-3">This place is no longer available.</p>;
  if (!d || !view) return <p className="p-5 text-sm text-fg-3" aria-live="polite">Loading site…</p>;

  const s = d.site;
  const recent = [...view.reports].sort((a, b) => Date.parse(b.opened) - Date.parse(a.opened));
  const shownReports = allReports ? recent : recent.slice(0, 5);
  const shownDrivers = allDrivers ? view.drivers : view.drivers.slice(0, 5);
  const x = (iso: string) => ((Date.parse(iso) - view.t0) / Math.max(1, view.t1 - view.t0)) * 100;

  return (
    <article className="px-5 pb-5 pt-3 text-sm" aria-live="polite">
      {/* 1. The answer */}
      <header className="pb-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-fg-3">
          <span>Repeat-report place</span>
          <span aria-hidden>·</span>
          <span>{s.neighborhood ?? s.city}</span>
          {s.due && <span className="ml-auto rounded-sm bg-return px-1.5 py-px text-[11px] font-semibold text-bg">Review suggested</span>}
        </div>
        <h2 className="mt-1 text-[20px] font-bold leading-7 tracking-[-0.01em] text-fg">{s.address_block ?? "Unnamed block"}</h2>
        <p className="mt-0.5 text-[14px] leading-5 text-fg-2">
          {s.returns > 0
            ? <><b className="font-bold text-return">{s.returns}</b> report days after an earlier closure, within the 60-day window.</>
            : <>No later report recorded within 60 days of a closure.</>}
        </p>
        <Link href={`/brief/${encodeURIComponent(id)}`} className="mt-3 inline-flex rounded-md bg-fg px-3 py-2 text-[13px] font-semibold text-bg hover:opacity-80">Open inspection brief</Link>
      </header>

      {/* 2. One strip of numbers */}
      <div className="flex divide-x divide-line border-y border-line">
        <Stat value={s.reports} label="report days" />
        <Stat value={s.closures} label="closure days" />
        <Stat value={s.returns} label="return days" tone={s.returns ? "text-return" : undefined} />
        <Stat value={s.days_since_close ?? "—"} label="days since close" />
      </div>
      <p className="mt-2 text-[11px] leading-4 text-fg-3">{d.reports.length} individual records across {s.reports} report days. {COUNT_EXPLANATION}</p>

      {/* 3. Return timeline: one tick per report, red = came back within 60 days of a closure */}
      <section className="pt-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[12px] font-semibold text-fg-2">Reports over time</h3>
          <span className="font-mono text-[11px] text-fg-3">{fmt(s.first_at)} → {fmt(s.last_at)}</span>
        </div>
        <div className="relative mt-2 h-7" role="img" aria-label={`${d.reports.length} records on ${s.reports} report days from ${fmt(s.first_at)} to ${fmt(s.last_at)}; ${s.returns} return days.`}>
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          {view.days.map((day) => (
            <span
              key={day.date}
              title={`${fmt(day.date)} · ${day.records.length} records${day.records.some((r) => r.back) ? " · after an earlier closure" : ""}`}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${day.records.some((r) => r.back) ? "h-3 w-3 bg-return ring-2 ring-bg" : "h-2 w-2 bg-fg-3"}`}
              style={{ left: `${x(day.date)}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex gap-4 text-[11px] text-fg-3">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-fg-3" />report day</span>
          {d.evidence && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-return" />return day</span>}
        </div>
        <SourceList sources={d.report_sources ?? []} unavailable={!d.report_sources?.length} />
      </section>

      {/* 4. What is around it */}
      <section className="pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="text-[12px] font-semibold text-fg-2">Nearby records · 100 m · last 12 months</h3>
          {d.adjacent_vacant_parcels > 0 && (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-warn">
              <span aria-hidden className="h-2 w-2 rotate-45 bg-warn" />
              {d.adjacent_vacant_parcels} vacant lot{d.adjacent_vacant_parcels > 1 ? "s" : ""} ≤ 40 m
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-fg-3">Nearby records provide context. Proximity does not establish a cause.</p>
        {view.drivers.length === 0 ? (
          <p className="mt-2 text-fg-3">No other records within 100 m.</p>
        ) : (
          <ul className="mt-1.5">
            {shownDrivers.map(([cat, n]) => (
              <li key={cat} className="grid grid-cols-[16px_minmax(0,1fr)_64px_28px] items-center gap-2 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={markerDataUrl(cat)} alt="" aria-hidden className="h-4 w-4" />
                <span className="text-[13px] leading-[18px] text-fg">{CATS[cat]?.label ?? cat}</span>
                <span aria-hidden className="h-1 rounded-full bg-line">
                  <span className="block h-1 rounded-full bg-fg-3" style={{ width: `${(n / view.max) * 100}%` }} />
                </span>
                <span className="text-right font-mono text-[12px] tabular-nums text-fg-2">{n}</span>
              </li>
            ))}
          </ul>
        )}
        {view.drivers.length > 5 && (
          <button type="button" onClick={() => setAllDrivers((v) => !v)} className="mt-1 text-[12px] font-semibold text-fg-2 underline-offset-2 hover:text-fg hover:underline">
            {allDrivers ? "Show top 5" : `Show all ${view.drivers.length}`}
          </button>
        )}
        <SourceList sources={d.evidence ? sourcesFor(d.evidence.nearby.flatMap((n) => n.source_ids), d.evidence.sources) : []} unavailable={d.evidence_unavailable} />
        {d.adjacent_vacant_parcels > 0 && <div className="mt-2">
          <p className="text-[11px] font-semibold text-fg-2">Vacant parcel evidence · within 40 m · source snapshot</p>
          <SourceList sources={d.evidence ? sourcesFor(d.evidence.vacant.source_ids, d.evidence.sources) : []} unavailable={d.evidence_unavailable} />
        </div>}
      </section>

      {/* 5. What the city did, newest first */}
      <section className="pt-4">
        <h3 className="text-[12px] font-semibold text-fg-2">Recorded responses · {d.reports.length} individual records</h3>
        <ol className="mt-1.5 divide-y divide-line">
          {shownReports.map((r) => (
            <li key={r.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 py-2">
              <span className="pt-px font-mono text-[12px] tabular-nums text-fg-3" title="Report opened">{fmt(r.opened)}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold capitalize text-fg">{(r.action ?? (r.closed ? "closed" : "open")).replace(/_/g, " ")}</span>
                  {r.back && <span className="rounded-sm bg-return/15 px-1.5 text-[11px] font-semibold text-return" title="This report followed an earlier closure; this does not evaluate the response shown here.">Report after earlier closure</span>}
                </span>
                <span className="block truncate text-[12px] leading-[18px] text-fg-3" title={r.note ?? undefined}>{gist(r.note)}</span>
                {r.closed && <span className="block text-[11px] text-fg-3">Closed {fmt(r.closed)}</span>}
              </span>
            </li>
          ))}
        </ol>
        {recent.length > 5 && (
          <button type="button" onClick={() => setAllReports((v) => !v)} className="mt-1 text-[12px] font-semibold text-fg-2 underline-offset-2 hover:text-fg hover:underline">
            {allReports ? "Show latest 5 records" : `Show all ${recent.length} records`}
          </button>
        )}
        <SourceList sources={d.report_sources ?? []} unavailable={!d.report_sources?.length} />
      </section>

      {/* 6. Next action */}
      <section className="mt-4 rounded-md border border-line bg-card p-3">
        <h3 className="text-[12px] font-semibold text-fg-2">Next action</h3>
        <p className="mt-0.5 text-[13px] text-fg-2">Recommendation, approve / edit / reject and the work order arrive with the analytics site model.</p>
      </section>

      <footer className="mt-4 text-[11px] text-fg-3">
        A place is one address with repeat reports since January 2024. Reports are not rat counts; a closed case does not confirm resolution. Source retrieval and successful import times describe Piper’s copy, not the date of conditions on the ground.
      </footer>
    </article>
  );
}
