import FindingChart from "./FindingChart";
import ActionSamples from "./ActionSamples";
import Sources from "./Sources";
import { fmtDateTime } from "./format";
import type { Finding, Strength } from "./types";

// Null results get the same card, size and prominence as positive ones (R5.4).
// Answer first: question as subtitle, result in large type, chart, then how we know.
const STRENGTH: Record<Strength, { label: string; level: number }> = {
  strong: { label: "Strong link", level: 3 },
  moderate: { label: "Some link", level: 2 },
  weak: { label: "Weak link", level: 1 },
  none: { label: "No link found", level: 0 },
};

export function Caveat({ text }: { text: string }) {
  return (
    <p className="mt-2 flex gap-1.5 text-[11px] leading-4 text-fg-3">
      <span aria-hidden className="mt-px flex-none text-warn">⚠</span>
      <span><span className="font-semibold text-fg-2">Keep in mind: </span>{text}</span>
    </p>
  );
}

function StrengthMeter({ label, level }: { label: string; level: number | null }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-fg-2">
      {level !== null && (
        <span aria-hidden className="flex gap-0.5">
          {[1, 2, 3].map((i) => <span key={i} className={`h-2.5 w-1.5 rounded-sm ${i <= level ? "bg-fg" : "bg-card-hover"}`} />)}
        </span>
      )}
      {label}
    </span>
  );
}

export default function FindingCard({ finding: f }: { finding: Finding }) {
  const headingId = `finding-${f.id}`;
  const s = f.insufficient
    ? { label: "Not enough data", level: null }
    : f.strength ? STRENGTH[f.strength] : { label: "Link unclear", level: null };
  return (
    <article aria-labelledby={headingId} data-finding={f.id} data-strength={f.insufficient ? "insufficient" : f.strength ?? "unknown"}
      className="rounded-xl border border-line bg-card p-3 text-fg">
      <div className="flex items-start justify-between gap-2">
        <h3 id={headingId} className="text-small font-semibold text-fg">{f.title}</h3>
        <StrengthMeter label={s.label} level={s.level} />
      </div>

      <dl className="mt-1 flex flex-wrap gap-x-3 text-xs">
        <div className="basis-full"><dt className="sr-only">Question</dt><dd className="text-fg-2">{f.question}</dd></div>
        <div className="mt-2 basis-full">
          <dt className="sr-only">Result</dt>
          <dd className="font-mono text-small tabular-nums text-fg-2">
            {f.statText ?? (f.moreStats.length ? "See the chart below" : "No number yet")}
          </dd>
        </div>
        <div className="mt-1 flex gap-1 text-[11px] text-fg-3"><dt>How we checked</dt><dd className="text-fg-2">{f.method}</dd></div>
        <div className="mt-1 flex gap-1 text-[11px] text-fg-3"><dt>Based on</dt><dd className="text-fg-2">{f.sampleText ?? (f.unit ? `Size unknown (${f.unit})` : "Size unknown")}</dd></div>
      </dl>

      {f.chart
        ? <FindingChart spec={f.chart} id={headingId} />
        : <p className="mt-2 rounded-lg border border-dashed border-line p-2 text-xs text-fg-3" role="note" title={f.chartProblem ?? undefined}>No chart for this one.</p>}

      {f.moreStats.length > 0 && (
        <details className="mt-2 text-xs text-fg-3" data-more-stats>
          <summary className="cursor-pointer hover:text-fg">More numbers</summary>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2">
            {f.moreStats.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-fg-3">{k}</dt><dd className="tabular-nums text-fg-2">{v}</dd></div>
            ))}
          </dl>
        </details>
      )}

      <ActionSamples samples={f.actionSamples} />

      <Caveat text={f.caveat} />

      <div className="mt-2 border-t border-line pt-2 text-[11px] text-fg-3">
        Source: <Sources ids={f.sources} details={f.sourceDetails} /> · Updated{" "}
        <time dateTime={f.computedAt}>{fmtDateTime(f.computedAt)}</time>
      </div>
    </article>
  );
}
