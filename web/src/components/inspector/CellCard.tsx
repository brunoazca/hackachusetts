"use client";
import { useEffect, useState } from "react";
import { fetchCellDetail, fmtWeek, type CellDetail } from "@/lib/forecast";
import { CELL_METRICS, fetchCellContext, fmtMetric, type CellContext } from "@/lib/cell-context";

// Draft card for a forecast block: next 4 weeks, why (drivers), last 12 weeks actual vs expected,
// and the block profile (demographics, building age), collapsed.
// Owner: model track.

const BAND = {
  low: ["Low", "bg-neutral-100 text-neutral-800"],
  elevated: ["Elevated", "bg-amber-100 text-amber-900"],
  high: ["High", "bg-orange-200 text-orange-950"],
  very_high: ["Very high", "bg-red-700 text-white"],
} as const;

export default function CellCard({ id }: { id: string }) {
  // Keyed by cell id so a stale response for the previous block is never shown.
  const [got, setGot] = useState<{ id: string; d?: CellDetail; error?: string } | null>(null);
  useEffect(() => {
    let live = true;
    fetchCellDetail(id).then((d) => live && setGot({ id, d })).catch((e) => live && setGot({ id, error: String(e) }));
    return () => { live = false; };
  }, [id]);

  if (got?.id === id && got.error) return <p role="alert" className="p-4 text-sm text-red-700">Could not load this block: {got.error}</p>;
  const d = got?.id === id ? got.d : undefined;
  if (!d) return <p className="p-4 text-sm text-neutral-700" aria-live="polite">Loading forecast…</p>;

  const now = d.forecast[0];
  const band = now ? BAND[now.band] : null;
  const maxH = Math.max(1, ...d.history.map((h) => Math.max(h.actual, h.expected)));
  const hTotal = d.history.reduce((a, h) => a + h.actual, 0);
  const eTotal = d.history.reduce((a, h) => a + h.expected, 0);

  return (
    <article className="space-y-4 p-4 text-sm" aria-live="polite">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">Forecast block · 250 m</span>
        <h2 className="text-lg font-semibold">{d.cell?.neighborhood ?? "Boston"}</h2>
        <p className="font-mono text-xs text-neutral-600">{id}</p>
      </header>

      {now && (
        <section>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-3xl tabular-nums">{now.expected.toFixed(2)}</span>
            <span className="text-neutral-700">expected reports, week of {fmtWeek(now.week)}</span>
            {band && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${band[1]}`}>{band[0]}</span>}
          </div>
          <p className="text-neutral-700">{Math.round(now.p_any * 100)}% chance of at least one report that week.</p>
          <div className="mt-2 grid grid-cols-4 gap-1 text-center">
            {d.forecast.map((f) => (
              <div key={f.week} className="rounded bg-neutral-50 py-1">
                <div className="text-[11px] text-neutral-600">{fmtWeek(f.week)}</div>
                <div className="font-mono tabular-nums">{f.expected.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.emerging?.kind === "emerging_hotspot" && (
        <p className="rounded-md bg-blue-50 p-2 text-blue-900">
          <b>Emerging hotspot:</b> high forecast but at most 1 rodent report in the last 12 weeks.
          {d.emerging.signals.length > 0 && <> Related report signals: {d.emerging.signals.map((s) => `${s.label.toLowerCase()} (${s.last_12_weeks})`).join(", ")}.</>}
        </p>
      )}
      {d.emerging?.kind === "early_warning" && (
        <p className="rounded-md bg-blue-50 p-2 text-blue-900"><b>Early warning:</b> dead-animal and indoor-pest reports are rising here.</p>
      )}

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Factors associated with this forecast</h3>
        <p className="mb-2 text-xs text-fg-3">Model associations do not identify causes or treatment effects.</p>
        {d.drivers.length ? (
          <ul className="space-y-1">
            {d.drivers.slice(0, 5).map((x) => (
              <li key={x.feature} className="flex justify-between gap-3">
                <span>{x.label}{x.value !== null && <span className="text-neutral-600"> ({x.value})</span>}</span>
                <span className="font-mono text-neutral-600">+{x.contribution.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-neutral-700">Nothing here pushes the forecast above a typical block.</p>}
      </section>

      {d.history.length > 0 && (
        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Last 12 weeks: actual vs model</h3>
          <svg viewBox="0 0 240 60" className="w-full" role="img" aria-label="Actual reports (bars) and model expectation (line)">
            {d.history.map((h, i) => {
              const x = 6 + i * (228 / Math.max(1, d.history.length - 1));
              const y = 56 - (h.actual / maxH) * 50;
              return h.actual > 0 ? <rect key={h.week} x={x - 4} y={y} width={8} height={56 - y} fill="#374151" opacity={0.75} /> : null;
            })}
            <polyline
              fill="none" stroke="#1f5fbf" strokeWidth={2}
              points={d.history.map((h, i) => `${6 + i * (228 / Math.max(1, d.history.length - 1))},${56 - (h.expected / maxH) * 50}`).join(" ")}
            />
          </svg>
          <p className="text-xs text-neutral-700">{hTotal} actual reports vs {eTotal.toFixed(1)} expected (bars = actual, blue line = model).</p>
        </section>
      )}

      <BlockProfile id={id} />

      <footer className="border-t border-neutral-100 pt-2 text-xs text-neutral-700">{d.caveat} Run {d.run_id}.</footer>
    </article>
  );
}

/** Who lives in the block and how old its buildings are. Loaded on its own so a missing profile never hides the forecast. */
function BlockProfile({ id }: { id: string }) {
  const [got, setGot] = useState<{ id: string; c: CellContext | null } | null>(null);
  useEffect(() => {
    let live = true;
    fetchCellContext(id).then((c) => live && setGot({ id, c })).catch(() => live && setGot({ id, c: null }));
    return () => { live = false; };
  }, [id]);
  const c = got?.id === id ? got.c : undefined;
  if (c === undefined) return null;
  const rows = c ? CELL_METRICS.filter((m) => c.attrs[m.key] !== undefined) : [];
  return (
    <details className="rounded-md border border-neutral-100 p-2">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-neutral-700">Block profile: people & buildings</summary>
      {rows.length ? (
        <>
          {(["Buildings", "People"] as const).map((g) => (
            <dl key={g} className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
              <dt className="col-span-2 text-[11px] font-semibold text-neutral-600">{g}</dt>
              {rows.filter((m) => m.group === g).map((m) => (
                <div key={m.key} className="contents">
                  <dt title={m.source}>{m.label}</dt>
                  <dd className="text-right font-mono tabular-nums">{fmtMetric(m, c!.attrs[m.key])}</dd>
                </div>
              ))}
            </dl>
          ))}
          <p className="mt-2 text-xs text-fg-3">
            Census values are area-weighted from the tracts this block overlaps; buildings are assessor parcels inside it.
            Context only, not a cause. Sources: {c!.sources.map((s, i) => <span key={s.id}>{i > 0 && ", "}<a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.name}</a></span>)}.
          </p>
        </>
      ) : <p className="mt-2 text-neutral-700">No census or parcel data for this block (mostly water or parkland).</p>}
    </details>
  );
}
