"use client";
import { useEffect, useState } from "react";
import { fetchCellDetail, fmtWeek, type CellDetail } from "@/lib/forecast";
import { CELL_METRICS, fetchCellContext, fmtMetric, type CellContext } from "@/lib/cell-context";
import { BandPill, Eyebrow, Meter, Ring, Skeleton } from "@/components/ui/bits";
import { CameBackHere, SoFarHere } from "./HereSections";

// Forecast block card: the number first, then the next weeks, why (drivers), how the model did here,
// and the block profile (demographics, building age), collapsed.
// Owner: model track.

function History({ h }: { h: CellDetail["history"] }) {
  const W = 260, H = 64, n = h.length;
  const max = Math.max(1, ...h.map((x) => Math.max(x.actual, x.expected)));
  const x = (i: number) => 8 + (i * (W - 16)) / Math.max(1, n - 1);
  const y = (v: number) => H - 6 - (v / max) * (H - 14);
  const line = h.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.expected).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-16 w-full" role="img" aria-label="Actual reports (bars) and forecast (line), last 12 weeks">
      <line x1="0" x2={W} y1={H - 6} y2={H - 6} stroke="var(--p-line)" />
      {h.map((p, i) => p.actual > 0 && (
        <rect key={p.week} x={x(i) - 5} y={y(p.actual)} width={10} height={H - 6 - y(p.actual)} rx={2} fill="var(--p-fg-3)" opacity={0.7} />
      ))}
      <path d={line} fill="none" stroke="var(--p-forecast)" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export default function CellCard({ id }: { id: string }) {
  // Keyed by cell id so a stale response for the previous block is never shown.
  const [got, setGot] = useState<{ id: string; d?: CellDetail; error?: string } | null>(null);
  const [week, setWeek] = useState(0);
  useEffect(() => {
    let live = true;
    fetchCellDetail(id).then((d) => live && setGot({ id, d })).catch((e) => live && setGot({ id, error: String(e) }));
    return () => { live = false; };
  }, [id]);

  if (got?.id === id && got.error) return <p role="alert" className="p-4 text-sm text-return">Could not load this block: {got.error}</p>;
  const d = got?.id === id ? got.d : undefined;
  if (!d) return <Skeleton label="Loading forecast…" />;

  const now = d.forecast[Math.min(week, d.forecast.length - 1)];
  const maxDriver = Math.max(0.01, ...d.drivers.map((x) => x.contribution));
  const hTotal = d.history.reduce((a, h) => a + h.actual, 0);
  const eTotal = d.history.reduce((a, h) => a + h.expected, 0);

  return (
    <article className="space-y-4 p-4 text-sm" aria-live="polite" data-cell={id}>
      <header>
        <Eyebrow><span className="text-forecast">Next</span> · block forecast</Eyebrow>
        <h2 className="mt-0.5 text-title font-bold text-fg">{d.cell?.neighborhood ?? "Boston"}</h2>
      </header>

      {now && (
        <section className="rounded-xl border p-3"
          style={{ borderColor: "color-mix(in srgb, var(--p-forecast) 30%, var(--p-line))", background: "color-mix(in srgb, var(--p-forecast) 8%, var(--p-card))" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-fg-2">Expected reports, week of {fmtWeek(now.week)}</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="font-mono text-headline-sm font-bold tabular-nums text-fg">{now.expected.toFixed(1)}</span>
                <BandPill band={now.band} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Ring share={now.p_any}>{Math.round(now.p_any * 100)}%</Ring>
              <span className="text-[10px] text-fg-3">chance of a report</span>
            </div>
          </div>
          {d.forecast.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-1.5" role="group" aria-label="Forecast week">
              {d.forecast.map((f, i) => (
                <button key={f.week} type="button" onClick={() => setWeek(i)} aria-pressed={i === week}
                  className={`rounded-lg py-1.5 text-center transition-colors ${i === week ? "bg-accent text-accent-fg" : "bg-card text-fg hover:bg-card-hover"}`}>
                  <span className={`block text-[10px] ${i === week ? "" : "text-fg-3"}`}>{fmtWeek(f.week)}</span>
                  <span className="block font-mono text-small font-semibold tabular-nums">{f.expected.toFixed(1)}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {d.emerging?.kind === "emerging_hotspot" && (
        <p className="flex gap-2 rounded-lg border border-line bg-card p-2.5 text-[13px] text-fg-2">
          <span aria-hidden className="mt-1 h-2 w-2 flex-none rounded-full bg-forecast" />
          <span><b className="text-fg">Emerging hotspot.</b> High forecast, but at most 1 rodent report in the last 12 weeks.
            {d.emerging.signals.length > 0 && <> Related signals: {d.emerging.signals.map((s) => `${s.label.toLowerCase()} (${s.last_12_weeks})`).join(", ")}.</>}</span>
        </p>
      )}
      {d.emerging?.kind === "early_warning" && (
        <p className="flex gap-2 rounded-lg border border-line bg-card p-2.5 text-[13px] text-fg-2">
          <span aria-hidden className="mt-1 h-2 w-2 flex-none rounded-full bg-warn" />
          <span><b className="text-fg">Early warning.</b> Dead-animal and indoor-pest reports are rising here.</span>
        </p>
      )}

      {d.cell && (
        <div className="space-y-3 border-y border-line py-3">
          <SoFarHere lon={d.cell.lon} lat={d.cell.lat} />
          <CameBackHere lon={d.cell.lon} lat={d.cell.lat} />
        </div>
      )}

      <section>
        <h3 className="text-[12px] font-semibold text-fg-2">Why this block</h3>
        {d.drivers.length ? (
          <ul className="mt-1.5 space-y-2">
            {d.drivers.slice(0, 5).map((x) => (
              <li key={x.feature} className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-x-2 gap-y-1">
                <span className="truncate text-[13px] text-fg">{x.label}{x.value !== null && <span className="text-fg-3"> · {x.value}</span>}</span>
                <span className="text-right font-mono text-[12px] tabular-nums text-fg-2">+{x.contribution.toFixed(2)}</span>
                <span className="col-span-2"><Meter share={x.contribution / maxDriver} className="bg-forecast" /></span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-fg-3">Nothing here pushes the forecast above a typical block.</p>}
        <p className="mt-2 text-[11px] text-fg-3">These go along with more reports. They do not prove cause.</p>
      </section>

      {d.history.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-[12px] font-semibold text-fg-2">Last 12 weeks</h3>
            <span className="font-mono text-[11px] tabular-nums text-fg-3">{hTotal} actual · {eTotal.toFixed(1)} expected</span>
          </div>
          <History h={d.history} />
          <div className="flex gap-4 text-[11px] text-fg-3">
            <span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-fg-3/70" />actual</span>
            <span className="flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-3 bg-forecast" />forecast</span>
          </div>
        </section>
      )}

      <BlockProfile id={id} />

      <footer className="border-t border-line pt-2 text-[11px] text-fg-3">{d.caveat} Run {d.run_id}.</footer>
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
