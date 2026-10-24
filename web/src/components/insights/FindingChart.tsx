// Small SVG renderer for correlations.chart ({type, x_label, y_label, series}).
// Hand-rolled (no ResponsiveContainer) so it renders identically on the server, in tests
// and in the 420 px panel. Every chart has a text alternative and a data table.

import { fmtNumber } from "./format";
import type { ChartSpec } from "./types";

const W = 320, H = 180;
const M = { l: 40, r: 10, t: 10, b: 34 };
const PW = W - M.l - M.r, PH = H - M.t - M.b;

// Categorical slots 1–3 of the dataviz reference palette (validated light + dark, all pairs).
// Series past 3 fold to neutral and rely on the legend + table.
const SERIES = [
  { stroke: "stroke-[#2a78d6] dark:stroke-[#3987e5]", fill: "fill-[#2a78d6] dark:fill-[#3987e5]", swatch: "bg-[#2a78d6] dark:bg-[#3987e5]" },
  { stroke: "stroke-[#eb6834] dark:stroke-[#d95926]", fill: "fill-[#eb6834] dark:fill-[#d95926]", swatch: "bg-[#eb6834] dark:bg-[#d95926]" },
  { stroke: "stroke-[#1baf7a] dark:stroke-[#199e70]", fill: "fill-[#1baf7a] dark:fill-[#199e70]", swatch: "bg-[#1baf7a] dark:bg-[#199e70]" },
];
const OTHER = { stroke: "stroke-neutral-400", fill: "fill-neutral-400", swatch: "bg-neutral-400" };
const color = (i: number) => SERIES[i] ?? OTHER;
// Axis titles must fit the plot; the full text stays in the description and the table header.
const fit = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const TYPE_NAME: Record<ChartSpec["type"], string> = {
  scatter: "Scatter plot", bar: "Bar chart", line: "Line chart", event_study: "Event study",
};

type Scale = { at: (x: number | string) => number; ticks: { v: number | string; label: string }[]; band?: number };

function niceTicks(lo: number, hi: number, count = 4): number[] {
  if (lo === hi) { lo -= 1; hi += 1; }
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.floor(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function xScale(spec: ChartSpec): Scale {
  const xs = spec.series.flatMap((s) => s.points.map((p) => p[0]));
  const allNum = xs.every((x) => typeof x === "number");
  const allDate = !allNum && xs.every((x) => typeof x === "string" && ISO_DATE.test(x) && Number.isFinite(Date.parse(x)));
  if (spec.type !== "bar" && (allNum || allDate)) {
    const toN = (x: number | string) => (typeof x === "number" ? x : Date.parse(x as string));
    const ns = xs.map(toN);
    const ticks = niceTicks(Math.min(...ns), Math.max(...ns));
    const lo = Math.min(ticks[0], ...ns), hi = Math.max(ticks[ticks.length - 1], ...ns);
    const at = (x: number | string) => M.l + ((toN(x) - lo) / (hi - lo || 1)) * PW;
    if (allDate) {
      const sorted = [...new Set(xs as string[])].sort();
      const pick = [sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]];
      return { at, ticks: [...new Set(pick)].map((v) => ({ v, label: v.slice(0, 7) })) };
    }
    return { at, ticks: ticks.map((v) => ({ v, label: fmtNumber(v) })) };
  }
  const cats = [...new Set(xs.map(String))];
  const band = PW / cats.length;
  const every = Math.ceil(cats.length / 6);
  return {
    at: (x) => M.l + band * (cats.indexOf(String(x)) + 0.5),
    ticks: cats.filter((_, i) => i % every === 0).map((v) => ({ v, label: v.length > 10 ? `${v.slice(0, 9)}…` : v })),
    band,
  };
}

function yScale(spec: ChartSpec) {
  const all = spec.ci ? [...spec.series, spec.ci.lo, spec.ci.hi] : spec.series;
  const ys = all.flatMap((s) => s.points.map((p) => p[1]));
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (spec.type === "bar") { lo = Math.min(0, lo); hi = Math.max(0, hi); }
  const ticks = niceTicks(lo, hi);
  const tlo = Math.min(ticks[0], lo), thi = Math.max(ticks[ticks.length - 1], hi);
  return { at: (y: number) => M.t + PH - ((y - tlo) / (thi - tlo || 1)) * PH, ticks };
}

export function describeChart(spec: ChartSpec): string {
  const n = spec.series.reduce((k, s) => k + s.points.length, 0);
  const names = spec.series.map((s) => s.name).join(", ");
  const axes = [spec.xLabel && `x: ${spec.xLabel}`, spec.yLabel && `y: ${spec.yLabel}`].filter(Boolean).join("; ");
  const ci = spec.ci ? ", with 95% confidence intervals" : "";
  return `${TYPE_NAME[spec.type]} with ${spec.series.length} series (${names}), ${n} points${ci}${axes ? `; ${axes}` : ""}.`;
}

export default function FindingChart({ spec, id }: { spec: ChartSpec; id: string }) {
  const x = xScale(spec);
  const y = yScale(spec);
  const base = y.at(0); // bar domains always include 0
  const xNums = spec.series.flatMap((s) => s.points.map((p) => p[0])).filter((v): v is number => typeof v === "number");
  const showZero = spec.type === "event_study" && x.band === undefined && xNums.length > 0
    && Math.min(...xNums) <= 0 && Math.max(...xNums) >= 0;
  const titleId = `${id}-chart-title`, descId = `${id}-chart-desc`;
  const ciAt = (s: ChartSpec["series"][number] | undefined, px: number | string) => s?.points.find((p) => p[0] === px)?.[1];
  const tableRows = spec.series.flatMap((s, si) => s.points.map((p) => ({
    s: s.name, x: p[0], y: p[1],
    lo: si === 0 ? ciAt(spec.ci?.lo, p[0]) : undefined, hi: si === 0 ? ciAt(spec.ci?.hi, p[0]) : undefined,
  })));
  const nSeries = spec.series.length;
  const bandW = x.band ?? PW;
  const barW = Math.max(2, (bandW * 0.8) / nSeries - 2);
  // Centre of series si at category px (bars are grouped; points sit on the tick).
  const markX = (si: number, px: number | string) =>
    spec.type === "bar" ? x.at(px) - (bandW * 0.8) / 2 + si * (barW + 2) + barW / 2 : x.at(px);

  return (
    <figure className="mt-2" data-chart-type={spec.type}>
      {/* "Charts speak first" (accessibility.md §8): the plain-language summary is visible above the
          chart for everyone, not only read out from the SVG <desc>. */}
      <figcaption id={`${id}-chart-summary`} className="mb-1 text-[11px] leading-4 text-fg-2">
        {describeChart(spec)}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>{TYPE_NAME[spec.type]}</title>
        <desc id={descId}>{describeChart(spec)}</desc>

        {/* grid + y axis */}
        {y.ticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.l} x2={W - M.r} y1={y.at(t)} y2={y.at(t)} className="stroke-neutral-200" strokeWidth={1} />
            <text x={M.l - 4} y={y.at(t)} textAnchor="end" dominantBaseline="middle" className="fill-neutral-500 text-[9px]">
              {fmtNumber(t)}
            </text>
          </g>
        ))}
        {/* x axis */}
        <line x1={M.l} x2={W - M.r} y1={M.t + PH} y2={M.t + PH} className="stroke-neutral-300" strokeWidth={1} />
        {x.ticks.map((t) => (
          <text key={`x${t.v}`} x={x.at(t.v)} y={M.t + PH + 12} className="fill-neutral-500 text-[9px]"
            textAnchor={x.at(t.v) > W - M.r - 20 ? "end" : x.at(t.v) < M.l + 20 ? "start" : "middle"}>
            {t.label}
          </text>
        ))}
        {spec.xLabel && (
          <text x={M.l + PW / 2} y={H - 4} textAnchor="middle" className="fill-neutral-600 text-[9px]">{fit(spec.xLabel, 60)}</text>
        )}
        {spec.yLabel && (
          <text transform={`translate(9 ${M.t + PH / 2}) rotate(-90)`} textAnchor="middle" className="fill-neutral-600 text-[9px]">
            {fit(spec.yLabel, 32)}
          </text>
        )}

        {/* event marker at day 0 */}
        {showZero && (
          <g data-mark="event-zero">
            <line x1={x.at(0)} x2={x.at(0)} y1={M.t} y2={M.t + PH} className="stroke-neutral-500" strokeDasharray="3 3" strokeWidth={1} />
            <text x={x.at(0) + 3} y={M.t + 8} className="fill-neutral-600 text-[9px]">event</text>
          </g>
        )}

        {spec.series.map((s, si) => {
          const c = color(si);
          if (spec.type === "bar") {
            return (
              <g key={s.name} data-series={s.name}>
                {s.points.map(([px, py]) => {
                  const cx = markX(si, px) - barW / 2;
                  const top = Math.min(y.at(py), base), h = Math.max(1, Math.abs(y.at(py) - base));
                  return (
                    <rect key={String(px)} x={cx} y={top} width={barW} height={h} rx={2} className={c.fill}>
                      <title>{`${s.name} · ${px}: ${fmtNumber(py)}`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          }
          if (spec.type === "scatter") {
            return (
              <g key={s.name} data-series={s.name}>
                {s.points.map(([px, py], i) => (
                  <circle key={i} cx={x.at(px)} cy={y.at(py)} r={3} className={c.fill} fillOpacity={0.7}>
                    <title>{`${s.name} · ${px}, ${fmtNumber(py)}`}</title>
                  </circle>
                ))}
              </g>
            );
          }
          const pts = s.points.slice().sort((a, b) => x.at(a[0]) - x.at(b[0]));
          return (
            <g key={s.name} data-series={s.name}>
              <polyline
                points={pts.map(([px, py]) => `${x.at(px)},${y.at(py)}`).join(" ")}
                fill="none" strokeWidth={2} strokeLinejoin="round" className={c.stroke}
              />
              {pts.length <= 40 && pts.map(([px, py], i) => (
                <circle key={i} cx={x.at(px)} cy={y.at(py)} r={2.5} className={c.fill}>
                  <title>{`${s.name} · ${px}: ${fmtNumber(py)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {spec.ci && (
          <g data-mark="ci" className="stroke-neutral-800">
            {spec.series[0].points.map(([px]) => {
              const lo = ciAt(spec.ci!.lo, px), hi = ciAt(spec.ci!.hi, px);
              if (lo === undefined || hi === undefined) return null;
              const cx = markX(0, px);
              return (
                <g key={String(px)} strokeWidth={1.5}>
                  <line x1={cx} x2={cx} y1={y.at(lo)} y2={y.at(hi)} />
                  <line x1={cx - 3} x2={cx + 3} y1={y.at(lo)} y2={y.at(lo)} />
                  <line x1={cx - 3} x2={cx + 3} y1={y.at(hi)} y2={y.at(hi)} />
                  <title>{`95% CI ${fmtNumber(lo)} to ${fmtNumber(hi)}`}</title>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {nSeries >= 2 && (
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600" aria-label="Legend">
          {spec.series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-1">
              <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${color(i).swatch}`} />
              {s.name}
            </li>
          ))}
        </ul>
      )}

      <details className="mt-1 text-xs text-neutral-600">
        <summary className="cursor-pointer">Show data</summary>
        <table className="mt-1 w-full text-left">
          <caption className="sr-only">{describeChart(spec)}</caption>
          <thead>
            <tr>
              {nSeries >= 2 && <th scope="col" className="font-medium">Series</th>}
              <th scope="col" className="font-medium">{spec.xLabel || "x"}</th>
              <th scope="col" className="font-medium">{spec.yLabel || "y"}</th>
              {spec.ci && <th scope="col" className="font-medium">95% CI</th>}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(0, 50).map((r, i) => (
              <tr key={i}>
                {nSeries >= 2 && <td>{r.s}</td>}
                <td>{typeof r.x === "number" ? fmtNumber(r.x) : r.x}</td>
                <td>{fmtNumber(r.y)}</td>
                {spec.ci && <td>{r.lo !== undefined && r.hi !== undefined ? `${fmtNumber(r.lo)} to ${fmtNumber(r.hi)}` : "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {tableRows.length > 50 && <p>Showing 50 of {tableRows.length} points.</p>}
      </details>
    </figure>
  );
}
