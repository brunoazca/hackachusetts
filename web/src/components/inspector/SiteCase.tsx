"use client";
import { useEffect, useMemo, useState } from "react";
import categories from "@/lib/categories.json";
import { fetchSiteDetail, type SiteDetail } from "@/lib/queries";
import { markerDataUrl } from "@/components/map/icons";

// Site case (R3.2), compact: the answer first (returns vs closures), one strip of numbers,
// a report timeline, nearby records, and the last few recorded responses. Long closure notes are
// trimmed to their first sentence; the full list is one click away.
// Decision + work order (R4) land when the analytics `sites` table exists.

const CATS = categories.incident_categories as Record<string, { label: string }>;
const DAY = 86400000;

/** First sentence of a closure note, without staff tags. */
function gist(note: string | null) {
  if (!note) return "No note";
  const clean = note.replace(/\[staff\]/gi, "").replace(/\s+/g, " ").trim();
  const first = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  return first.length > 90 ? `${first.slice(0, 88)}…` : first;
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });

function Stat({ value, label, tone }: { value: string | number; label: string; tone?: string }) {
  return (
    <div className="min-w-0 flex-1 px-3 py-2 first:pl-0">
      <div className={`font-mono text-[18px] font-medium leading-6 tabular-nums ${tone ?? "text-fg"}`}>{value}</div>
      <div className="truncate text-[11px] leading-4 text-fg-3">{label}</div>
    </div>
  );
}

export default function SiteCase({ id }: { id: string }) {
  const [d, setD] = useState<SiteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allDrivers, setAllDrivers] = useState(false);
  const [allReports, setAllReports] = useState(false);

  useEffect(() => {
    let live = true;
    setD(null);
    fetchSiteDetail(id).then((x) => live && setD(x)).catch((e) => live && setError(String(e)));
    return () => { live = false; };
  }, [id]);

  const view = useMemo(() => {
    if (!d) return null;
    const closes = d.reports.filter((r) => r.closed).map((r) => Date.parse(r.closed!));
    const cameBack = (opened: string) => {
      const t = Date.parse(opened);
      return closes.some((c) => t - c > DAY && t - c <= 60 * DAY);
    };
    const reports = d.reports.map((r) => ({ ...r, back: cameBack(r.opened) }));
    const t0 = Math.min(...reports.map((r) => Date.parse(r.opened)));
    const t1 = Math.max(Date.parse(d.site.last_at), ...reports.map((r) => Date.parse(r.opened)));
    const drivers = Object.entries(d.drivers_100m_12mo).sort((a, b) => b[1] - a[1]);
    return { reports, t0, t1, drivers, max: drivers[0]?.[1] ?? 1 };
  }, [d]);

  if (error) return <p role="alert" className="p-5 text-sm text-return">Could not load this site: {error}</p>;
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
            ? <><b className="font-bold text-return">{s.returns}</b> later reports within 60 days of an earlier closure.</>
            : <>No later report recorded within 60 days of a closure.</>}
        </p>
      </header>

      {/* 2. One strip of numbers */}
      <div className="flex divide-x divide-line border-y border-line">
        <Stat value={s.reports} label="reports" />
        <Stat value={s.closures} label="closures" />
        <Stat value={s.returns} label="after closure" tone={s.returns ? "text-return" : undefined} />
        <Stat value={s.days_since_close ?? "—"} label="days since close" />
      </div>

      {/* 3. Return timeline: one tick per report, red = came back within 60 days of a closure */}
      <section className="pt-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[12px] font-semibold text-fg-2">Reports over time</h3>
          <span className="font-mono text-[11px] text-fg-3">{fmt(s.first_at)} → {fmt(s.last_at)}</span>
        </div>
        <div className="relative mt-2 h-7" role="img" aria-label={`${s.reports} reports from ${s.first_at} to ${s.last_at}; ${s.returns} occurred within 60 days after an earlier closure.`}>
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          {view.reports.map((r) => (
            <span
              key={r.id}
              title={`${r.opened}${r.back ? " · report after an earlier closure" : ""}`}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${r.back ? "h-3 w-3 bg-return ring-2 ring-bg" : "h-2 w-2 bg-fg-3"}`}
              style={{ left: `${x(r.opened)}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex gap-4 text-[11px] text-fg-3">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-fg-3" />report</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-return" />after earlier closure</span>
        </div>
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
      </section>

      {/* 5. What the city did, newest first */}
      <section className="pt-4">
        <h3 className="text-[12px] font-semibold text-fg-2">Recorded responses</h3>
        <ol className="mt-1.5 divide-y divide-line">
          {shownReports.map((r) => (
            <li key={r.id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 py-2">
              <span className="pt-px font-mono text-[12px] tabular-nums text-fg-3">{fmt(r.opened)}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold capitalize text-fg">{(r.action ?? (r.closed ? "closed" : "open")).replace(/_/g, " ")}</span>
                  {r.back && <span className="rounded-sm bg-return/15 px-1.5 text-[11px] font-semibold text-return" title="This report followed an earlier closure; this does not evaluate the response shown here.">Report after earlier closure</span>}
                </span>
                <span className="block truncate text-[12px] leading-[18px] text-fg-3" title={r.note ?? undefined}>{gist(r.note)}</span>
              </span>
            </li>
          ))}
        </ol>
        {recent.length > 5 && (
          <button type="button" onClick={() => setAllReports((v) => !v)} className="mt-1 text-[12px] font-semibold text-fg-2 underline-offset-2 hover:text-fg hover:underline">
            {allReports ? "Show latest 5" : `Show all ${recent.length}`}
          </button>
        )}
      </section>

      {/* 6. Next action */}
      <section className="mt-4 rounded-md border border-line bg-card p-3">
        <h3 className="text-[12px] font-semibold text-fg-2">Next action</h3>
        <p className="mt-0.5 text-[13px] text-fg-2">Recommendation, approve / edit / reject and the work order arrive with the analytics site model.</p>
      </section>

      <footer className="mt-4 text-[11px] text-fg-3">
        Sources: municipal rodent reports and available code enforcement records. A place is one address with repeat reports. Reports are not rat counts; a closed case does not confirm resolution.
      </footer>
    </article>
  );
}
