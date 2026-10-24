"use client";
import { useState } from "react";
import { useMap } from "@/lib/map-store";
import { fmtDate, fmtDateTime, fmtNumber, fmtPct } from "./format";
import type { ForecastView, RiskBand, ScorePair } from "./types";

const BAND_LABEL: Record<RiskBand, string> = {
  low: "Low", elevated: "Elevated", high: "High", very_high: "Very high",
};

type Verdict = "better" | "worse" | "same" | null;

// lowerIsBetter: MAE; otherwise higher is better (top-10% capture).
export function compare(p: ScorePair, lowerIsBetter: boolean): Verdict {
  if (p.model === null || p.baseline === null) return null;
  const d = p.model - p.baseline;
  if (Math.abs(d) < 1e-9) return "same";
  return (lowerIsBetter ? d < 0 : d > 0) ? "better" : "worse";
}

const VERDICT_TEXT: Record<Exclude<Verdict, null>, string> = {
  better: "Better than the simple guess",
  worse: "Worse than the simple guess",
  same: "Same as the simple guess",
};

function ScoreRow({ name, hint, pair, lowerIsBetter, fmt, isBaseline }: {
  name: string; hint: string; pair: ScorePair; lowerIsBetter: boolean; fmt: (v: number) => string; isBaseline: boolean;
}) {
  const v = isBaseline ? null : compare(pair, lowerIsBetter);
  return (
    <tr className="border-t border-neutral-100" data-score={name}>
      <th scope="row" className="py-1 pr-2 text-left font-normal text-neutral-700">
        {name}<span className="block text-[10px] text-neutral-500">{hint}</span>
      </th>
      <td className="py-1 pr-2 tabular-nums">{isBaseline ? "—" : pair.model === null ? "—" : fmt(pair.model)}</td>
      <td className="py-1 pr-2 tabular-nums">{pair.baseline === null ? "—" : fmt(pair.baseline)}</td>
      <td className="py-1 text-neutral-700" data-verdict={v ?? "none"}>
        {isBaseline ? "Simple guess only" : v ? VERDICT_TEXT[v] : "Nothing to compare yet"}
      </td>
    </tr>
  );
}

export function ForecastUnavailable() {
  return (
    <section aria-labelledby="forecast-h" className="rounded-lg border border-dashed border-neutral-300 p-3" data-state="unavailable">
      <h3 id="forecast-h" className="text-sm font-semibold text-neutral-900">Where reports are likely next</h3>
      <p className="mt-1 text-xs text-neutral-600">The forecast is not ready yet. Check back soon.</p>
    </section>
  );
}

// ---- v2 layout: week chips → hero number + trend → ranking win → hotspot list → details ----

const shortDate = (iso: string) => fmtDate(iso).replace(/, \d{4}$/, "");

// Driver families get one color each, so a reader can scan "why" without reading.
function driverKind(label: string): { short: string; dot: string; bar: string } {
  const l = label.toLowerCase();
  if (/rodent|rat/.test(l)) return { short: "Recent reports", dot: "bg-return", bar: "bg-return" };
  if (/build|housing|units|age/.test(l)) return { short: "Buildings", dot: "bg-warn", bar: "bg-warn" };
  if (/311/.test(l)) return { short: "311 use", dot: "bg-forecast", bar: "bg-forecast" };
  const short = label.replace(/\s*\(.*\)\s*/g, "").replace(/\s+here$/i, "").trim();
  return { short: short.length > 22 ? `${short.slice(0, 21)}…` : short, dot: "bg-fg-3", bar: "bg-fg-3" };
}

const RANK_TILE: Record<RiskBand, string> = {
  very_high: "bg-return text-accent-fg",
  high: "bg-warn text-accent-fg",
  elevated: "bg-card-hover text-fg",
  low: "bg-card-hover text-fg-2",
};

function Trend({ weeks, active }: { weeks: ForecastView["weeks"]; active: number }) {
  if (weeks.length < 2) return null;
  const W = 300, H = 56, pad = 6;
  const vals = weeks.map((w) => w.expected_total);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const pts = vals.map((v, i) => [pad + (i * (W - 2 * pad)) / (vals.length - 1), H - pad - ((v - lo) / span) * (H - 2 * pad - 10)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  const [ax, ay] = pts[active] ?? pts[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-14 w-full" aria-hidden>
      <defs>
        <linearGradient id="fc-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--p-forecast)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--p-forecast)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#fc-area)" />
      <path d={line} fill="none" stroke="var(--p-forecast)" strokeWidth="2" strokeLinejoin="round" />
      <line x1={ax} x2={ax} y1={0} y2={H} stroke="var(--p-line)" strokeDasharray="2 3" />
      <circle cx={ax} cy={ay} r="4.5" fill="var(--p-forecast)" stroke="var(--p-card)" strokeWidth="2" />
    </svg>
  );
}

function CaptureRing({ model, baseline }: { model: number; baseline: number | null }) {
  const arc = (r: number, share: number) => {
    const c = 2 * Math.PI * r;
    return { strokeDasharray: `${(share * c).toFixed(2)} ${c.toFixed(2)}` };
  };
  return (
    <svg viewBox="0 0 48 48" className="h-14 w-14 flex-none" aria-hidden>
      <g transform="rotate(-90 24 24)" fill="none" strokeLinecap="round">
        <circle cx="24" cy="24" r="19" stroke="var(--p-line)" strokeWidth="4" />
        {baseline !== null && <circle cx="24" cy="24" r="19" stroke="var(--p-fg-3)" strokeOpacity="0.6" strokeWidth="4" style={arc(19, baseline)} />}
        <circle cx="24" cy="24" r="13" stroke="var(--p-line)" strokeWidth="5" />
        <circle cx="24" cy="24" r="13" stroke="var(--p-held)" strokeWidth="5" style={arc(13, model)} />
      </g>
    </svg>
  );
}

function DriverBar({ parts }: { parts: ForecastView["topCells"][number]["driverParts"] }) {
  const pos = parts.filter((p) => (p.value ?? 0) > 0);
  if (!pos.length) return null;
  return (
    <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-card-hover" aria-hidden>
      {pos.map((p) => <div key={p.label} className={driverKind(p.label).bar} style={{ flex: p.value ?? 0 }} />)}
    </div>
  );
}

export default function ForecastSummary({ forecast: f }: { forecast: ForecastView }) {
  const upcoming = f.weeks;
  const mapWeek = useMap((s) => s.forecastWeek);
  const setForecastWeek = useMap((s) => s.setForecastWeek);
  const setLayers = useMap((s) => s.setLayers);
  const select = useMap((s) => s.select);
  const setPanel = useMap((s) => s.setPanel);
  const [picked, setPicked] = useState<string | null>(null);
  const weekId = picked ?? mapWeek;
  const activeIdx = Math.max(0, upcoming.findIndex((w) => w.week_start === weekId));
  const week = upcoming[activeIdx];

  const label = f.isBaseline
    ? "Simple guess: average of the last 4 weeks"
    : "Our forecast";
  const baselineMissing = !f.isBaseline && f.mae.baseline === null && f.top10.baseline === null;
  const capture = f.isBaseline ? f.top10.baseline : f.top10.model;
  const captureBase = f.isBaseline ? null : f.top10.baseline;
  const gainPts = capture !== null && captureBase !== null ? (capture - captureBase) * 100 : null;

  const pickWeek = (ws: string) => {
    setPicked(ws);
    setForecastWeek(ws);
    setLayers({ forecast: true });
  };
  const openCell = (c: ForecastView["topCells"][number]) => {
    setForecastWeek(c.weekStart);
    // The priority grid numbers blocks the same way this list does; the smoothed surface would hide it.
    setLayers({ priority: true, forecast: false });
    select({ kind: "cell", id: c.cellId });
    setPanel("inspector");
  };
  const legend = Array.from(new Map(f.topCells.flatMap((c) => c.driverParts).map((p) => {
    const k = driverKind(p.label);
    return [k.short, k] as const;
  })).values()).slice(0, 4);

  return (
    <section aria-labelledby="forecast-h" className="rounded-xl border border-line bg-card p-3 text-fg" data-model-kind={f.isBaseline ? "baseline" : "model"}>
      <div className="flex items-center justify-between gap-2">
        <h3 id="forecast-h" className="text-eyebrow font-semibold uppercase tracking-wide text-fg-3">Where reports are likely next</h3>
        {f.isBaseline && <span className="rounded-full bg-card-hover px-2 py-0.5 text-[10px] text-fg-2">Simple guess</span>}
      </div>

      {upcoming.length > 0 ? (
        <>
          <div role="group" aria-label="Forecast week" className="mt-2 flex flex-wrap gap-1.5">
            {upcoming.map((w, i) => (
              <button key={w.week_start} type="button" onClick={() => pickWeek(w.week_start)}
                aria-pressed={i === activeIdx} aria-label={`Week of ${fmtDate(w.week_start)}`}
                className={`rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors ${i === activeIdx
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line text-fg-2 hover:bg-card-hover hover:text-fg"}`}>
                {shortDate(w.week_start)}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-lg border p-3"
            style={{ borderColor: "color-mix(in srgb, var(--p-forecast) 30%, var(--p-line))", background: "color-mix(in srgb, var(--p-forecast) 8%, var(--p-card))" }}>
            <p className="text-xs text-fg-2">Expected 311 rodent <em>reports</em> citywide, week of {fmtDate(week.week_start)}</p>
            <div className="mt-0.5 flex items-baseline justify-between gap-2">
              <span className="font-mono text-headline-sm font-bold tabular-nums">~{fmtNumber(Math.round(week.expected_total))}</span>
              <span className="text-right text-[11px] text-fg-3">
                <span className="tabular-nums text-fg-2">{fmtNumber((week.bands.high ?? 0) + (week.bands.very_high ?? 0))} of {fmtNumber(week.cells)}</span>
                <span className="block">blocks likely to be busy</span>
              </span>
            </div>
            <Trend weeks={upcoming} active={activeIdx} />
            <p className="text-[11px] text-fg-3">Counts reports from people, not rats.</p>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-fg-3" role="note">The weekly forecast is not ready yet. Check back soon.</p>
      )}

      {capture !== null && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-line p-2.5" data-capture>
          <CaptureRing model={capture} baseline={captureBase} />
          <div className="text-xs">
            <p className="font-semibold text-fg">Our top 10% of blocks had {fmtPct(capture)} of all reports.</p>
            <p className="mt-0.5 text-fg-3">
              {gainPts !== null
                ? <>A simple guess got <span className={gainPts >= 0 ? "text-fg-2" : "text-return"}>{fmtPct(captureBase!)}</span>{gainPts >= 0 ? <>, so ours finds <span className="font-semibold text-held">{fmtNumber(Math.abs(gainPts), 0)} more in every 100</span>.</> : "."}</>
                : f.isBaseline ? "This is the simple guess. Our forecast is not ready yet." : "Nothing to compare with yet."}
              {f.backtestWeeks !== null && <> Tested on the last {fmtNumber(f.backtestWeeks)} weeks.</>}
            </p>
          </div>
        </div>
      )}

      {f.topCells.length > 0 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-small font-semibold">Busiest blocks, week of {fmtDate(f.topCells[0].weekStart)}</h4>
          </div>
          {legend.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-fg-3" aria-label="Driver colors">
              {legend.map((k) => (
                <li key={k.short} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-sm ${k.dot}`} />{k.short}</li>
              ))}
            </ul>
          )}
          <ol className="mt-2 space-y-1.5">
            {f.topCells.map((c, i) => (
              <li key={`${c.cellId}-${c.weekStart}`} data-cell={c.cellId} title={c.cellId}>
                <button type="button" onClick={() => openCell(c)}
                  className="group flex w-full items-center gap-2.5 rounded-lg border border-line bg-card p-2 text-left transition-[transform,border-color,background-color] hover:translate-x-0.5 hover:border-edge hover:bg-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                  <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg font-mono text-sm font-bold ${RANK_TILE[c.band ?? "low"]}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-small font-semibold">{c.neighborhood ?? "Unnamed block"}</span>
                      <span className="flex-none font-mono text-small font-bold tabular-nums">{fmtNumber(c.expected, 1)}</span>
                    </span>
                    <span className="block text-[10px] text-fg-3">{c.band ? `${BAND_LABEL[c.band]} · ` : ""}reports expected</span>
                    <DriverBar parts={c.driverParts} />
                    {c.drivers.length > 0 && <span className="sr-only">Drivers: {c.drivers.join(", ")}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-1 text-[10px] text-fg-3">Tap a block to see it on the map.</p>
        </div>
      )}

      <details className="group mt-3 border-t border-line pt-2">
        <summary className="cursor-pointer list-none text-xs text-fg-2 hover:text-fg">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> How we checked this
        </summary>
        <p className="mt-2 text-xs">
          <span className="rounded bg-card-hover px-1.5 py-0.5 font-medium text-fg">{label}</span>
        </p>
        <table className="mt-2 w-full text-xs">
          <caption className="text-left text-fg-3">
            {f.backtestWeeks !== null ? `Tested on the last ${fmtNumber(f.backtestWeeks)} weeks` : "Test period unknown"}
          </caption>
          <thead>
            <tr className="text-left text-fg-3">
              <th scope="col" className="pr-2 font-medium">Check</th>
              <th scope="col" className="pr-2 font-medium">Ours</th>
              <th scope="col" className="pr-2 font-medium">Simple guess</th>
              <th scope="col" className="pr-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            <ScoreRow name="Average miss" hint="how far off each block's guess was; lower is better" pair={f.mae} lowerIsBetter fmt={(v) => fmtNumber(v, 3)} isBaseline={f.isBaseline} />
            <ScoreRow name="Top 10% of blocks" hint="share of reports in the busiest 10% of blocks; higher is better" pair={f.top10} lowerIsBetter={false} fmt={fmtPct} isBaseline={f.isBaseline} />
          </tbody>
        </table>
        {baselineMissing && (
          <p className="mt-1 text-xs text-fg-3" role="note">
            The simple guess was not tested this time, so we can&apos;t compare.
          </p>
        )}
        {f.isBaseline && (
          <p className="mt-1 text-xs text-fg-3" role="note">
            Our forecast is not ready yet, so the map shows the simple guess.
          </p>
        )}
        {f.features.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-fg">What matters most</h4>
            <ol className="mt-1 list-decimal pl-4 text-xs text-fg-2">
              {f.features.map((x) => <li key={x.label}>{x.label}</li>)}
            </ol>
          </div>
        )}
        <p className="mt-2 text-[11px] text-fg-3">
          {f.trainedThrough && <>Uses reports up to {fmtDate(f.trainedThrough)} · </>}
          Updated <time dateTime={f.createdAt}>{fmtDateTime(f.createdAt)}</time>
        </p>
      </details>
    </section>
  );
}
