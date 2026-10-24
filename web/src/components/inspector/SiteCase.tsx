"use client";
import { useEffect, useState } from "react";
import categories from "@/lib/categories.json";
import { fetchSiteDetail, type SiteDetail } from "@/lib/queries";
import { markerDataUrl } from "@/components/map/icons";
import { useTheme } from "@/lib/theme-store";

// Draft site case (R3.2): counts, Due, report timeline with what the city did, drivers within 100 m,
// adjacent vacant land. Decision + work order (R4) land when the analytics `sites` table exists.

const CATS = categories.incident_categories as Record<string, { label: string }>;

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-md border border-line bg-card px-3 py-2.5">
      <div className={`font-mono text-[20px] font-medium leading-6 tabular-nums ${tone ?? "text-fg"}`}>{value}</div>
      <div className="text-xs text-fg-3">{label}</div>
    </div>
  );
}

const WORDS = ["Never", "Once", "Twice", "Three times", "Four times", "Five times", "Six times", "Seven times", "Eight times", "Nine times", "Ten times", "Eleven times", "Twelve times"];
/** One Bodoni headline per panel: a claim about the condition (docs/design/foundations/typography.md). */
function headline(returns: number, closures: number) {
  if (returns > 0) return `Came back ${(WORDS[returns] ?? `${returns} times`).toLowerCase()}.`;
  if (closures > 0) return "Holding since the last closure.";
  return "Open, not yet closed.";
}

export default function SiteCase({ id }: { id: string }) {
  const [d, setD] = useState<SiteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme((t) => t.theme);

  useEffect(() => {
    let live = true;
    setD(null);
    fetchSiteDetail(id).then((x) => live && setD(x)).catch((e) => live && setError(String(e)));
    return () => { live = false; };
  }, [id]);

  if (error) return <p role="alert" className="p-4 text-sm text-return">Could not load this site: {error}</p>;
  if (!d) return <p className="p-4 text-sm text-fg-2" aria-live="polite">Loading site…</p>;

  const s = d.site;
  const drivers = Object.entries(d.drivers_100m_12mo).sort((a, b) => b[1] - a[1]);
  // A report "came back" if it opened 1–60 days after an earlier closure at this site.
  const closes = d.reports.filter((r) => r.closed).map((r) => Date.parse(r.closed!));
  const cameBack = (opened: string) => {
    const t = Date.parse(opened);
    return closes.some((c) => t - c > 86400000 && t - c <= 60 * 86400000);
  };

  return (
    <article className="space-y-5 px-5 pb-5 pt-4 text-sm" aria-live="polite">
      <header>
        <div className="mb-1 flex items-center gap-2">
          <span className="eyebrow">Chronic site</span>
          {s.due && <span className="rounded-full border border-return px-2 py-0.5 text-xs font-medium text-return">Due</span>}
        </div>
        <h2 className="font-display text-[36px] font-medium leading-10 tracking-[-0.015em] text-fg">{headline(s.returns, s.closures)}</h2>
        <p className="mt-1 text-[14px] font-medium text-fg">{s.address_block ?? "Unnamed block"}</p>
        <p className="font-mono text-xs text-fg-3">{s.neighborhood ?? s.city} · {s.first_at} → {s.last_at}</p>
      </header>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="reports" value={s.reports} />
        <Stat label="closures" value={s.closures} />
        <Stat label="came back" value={s.returns} tone={s.returns ? "text-return" : undefined} />
        <Stat label="days since close" value={s.days_since_close ?? "—"} />
      </div>
      {s.returns > 0 && (
        <p className="rounded-md border-l-2 border-return bg-card p-3 text-fg">
          Closed {s.closures} times; reports came back {s.returns} times within 60 days of a closure.
        </p>
      )}

      <section>
        <h3 className="mb-1 eyebrow">Around it, last 12 months (100 m)</h3>
        {drivers.length === 0 ? (
          <p className="text-fg-2">No other signals within 100 m.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-1">
            {drivers.slice(0, 8).map(([cat, n]) => (
              <li key={cat} className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={markerDataUrl(cat, theme)} alt="" aria-hidden className="h-4 w-4" />
                <span className="truncate text-fg">{CATS[cat]?.label ?? cat}</span>
                <span className="ml-auto font-mono text-xs text-fg-3">{n}</span>
              </li>
            ))}
          </ul>
        )}
        {d.adjacent_vacant_parcels > 0 && (
          <p className="mt-2 rounded-md border-l-2 border-accent bg-card p-3 text-fg">
            {d.adjacent_vacant_parcels} vacant or unusable land parcel{d.adjacent_vacant_parcels > 1 ? "s" : ""} within 40 m — a likely harborage.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-1 eyebrow">Timeline: what the city did</h3>
        <ol className="space-y-2 border-l border-line pl-4">
          {d.reports.map((r) => (
            <li key={r.id} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-bg ${cameBack(r.opened) ? "bg-return ring-1 ring-return" : "bg-fg-3"}`}
              />
              <div className="flex justify-between text-xs">
                <span className="font-mono text-fg-2">
                  {r.opened}{r.closed ? ` → ${r.closed}` : " · open"}
                </span>
                {cameBack(r.opened) && <span className="font-semibold text-return">came back</span>}
              </div>
              {r.note && <p className="mt-0.5 font-mono text-xs text-fg-3">{r.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-line bg-card p-4">
        <h3 className="eyebrow">Next action</h3>
        <p className="mt-1 text-fg-2">
          Recommendation, approve / edit / reject and the work order arrive with the analytics site model.
        </p>
      </section>

      <footer className="border-t border-line pt-3 text-xs text-fg-3">
        Sources: Boston 311 (2024–2026, live) and code enforcement (live). Draft site = one address with repeat reports.
      </footer>
    </article>
  );
}
