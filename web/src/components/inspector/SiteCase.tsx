"use client";
import { useEffect, useState } from "react";
import categories from "@/lib/categories.json";
import { fetchSiteDetail, type SiteDetail } from "@/lib/queries";
import { markerDataUrl } from "@/components/map/icons";

// Draft site case (R3.2): counts, Due, report timeline with what the city did, drivers within 100 m,
// adjacent vacant land. Decision + work order (R4) land when the analytics `sites` table exists.

const CATS = categories.incident_categories as Record<string, { label: string }>;

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-md border border-neutral-200 p-2">
      <div className={`text-lg font-semibold ${tone ?? "text-neutral-900"}`}>{value}</div>
      <div className="text-xs text-neutral-700">{label}</div>
    </div>
  );
}

export default function SiteCase({ id }: { id: string }) {
  const [d, setD] = useState<SiteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setD(null);
    fetchSiteDetail(id).then((x) => live && setD(x)).catch((e) => live && setError(String(e)));
    return () => { live = false; };
  }, [id]);

  if (error) return <p role="alert" className="p-4 text-sm text-red-800">Could not load this site: {error}</p>;
  if (!d) return <p className="p-4 text-sm text-neutral-700" aria-live="polite">Loading site…</p>;

  const s = d.site;
  const drivers = Object.entries(d.drivers_100m_12mo).sort((a, b) => b[1] - a[1]);
  // A report "came back" if it opened 1–60 days after an earlier closure at this site.
  const closes = d.reports.filter((r) => r.closed).map((r) => Date.parse(r.closed!));
  const cameBack = (opened: string) => {
    const t = Date.parse(opened);
    return closes.some((c) => t - c > 86400000 && t - c <= 60 * 86400000);
  };

  return (
    <article className="space-y-4 p-4 text-sm" aria-live="polite">
      <header>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">Site</span>
          {s.due && <span className="rounded bg-red-700 px-1.5 py-0.5 text-xs font-semibold text-white">Due</span>}
        </div>
        <h2 className="text-lg font-semibold">{s.address_block ?? "Unnamed block"}</h2>
        <p className="text-neutral-700">{s.neighborhood ?? s.city} · {s.first_at} → {s.last_at}</p>
      </header>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="reports" value={s.reports} />
        <Stat label="closures" value={s.closures} />
        <Stat label="came back" value={s.returns} tone={s.returns ? "text-red-800" : undefined} />
        <Stat label="days since close" value={s.days_since_close ?? "—"} />
      </div>
      {s.returns > 0 && (
        <p className="rounded-md bg-red-50 p-2 text-red-950">
          Closed {s.closures} times; reports came back {s.returns} times within 60 days of a closure.
        </p>
      )}

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Around it, last 12 months (100 m)</h3>
        {drivers.length === 0 ? (
          <p className="text-neutral-700">No other signals within 100 m.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-1">
            {drivers.slice(0, 8).map(([cat, n]) => (
              <li key={cat} className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={markerDataUrl(cat)} alt="" aria-hidden className="h-4 w-4" />
                <span className="truncate text-neutral-900">{CATS[cat]?.label ?? cat}</span>
                <span className="ml-auto font-semibold">{n}</span>
              </li>
            ))}
          </ul>
        )}
        {d.adjacent_vacant_parcels > 0 && (
          <p className="mt-2 rounded-md bg-amber-50 p-2 text-amber-950">
            {d.adjacent_vacant_parcels} vacant or unusable land parcel{d.adjacent_vacant_parcels > 1 ? "s" : ""} within 40 m — a likely harborage.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Timeline: what the city did</h3>
        <ol className="space-y-1.5 border-l-2 border-neutral-200 pl-3">
          {d.reports.map((r) => (
            <li key={r.id} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[1.15rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${cameBack(r.opened) ? "bg-red-700" : "bg-neutral-500"}`}
              />
              <div className="flex justify-between text-xs">
                <span className="font-medium text-neutral-900">
                  {r.opened}{r.closed ? ` → ${r.closed}` : " · open"}
                </span>
                {cameBack(r.opened) && <span className="font-semibold text-red-800">came back</span>}
              </div>
              {r.note && <p className="text-xs text-neutral-800">{r.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-md border border-dashed border-neutral-300 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-700">Next action</h3>
        <p className="mt-1 text-neutral-800">
          Recommendation, approve / edit / reject and the work order arrive with the analytics site model.
        </p>
      </section>

      <footer className="border-t border-neutral-100 pt-2 text-xs text-neutral-700">
        Sources: Boston 311 (2024–2026, live) and code enforcement (live). Draft site = one address with repeat reports.
      </footer>
    </article>
  );
}
