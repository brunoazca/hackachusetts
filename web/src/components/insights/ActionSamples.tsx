import { fmtNumber } from "./format";
import type { Finding } from "./types";

// Keep per-action denominators beside their rates; a total sample alone hides small groups.
export default function ActionSamples({ samples }: { samples: Finding["actionSamples"] }) {
  if (!samples.length) return null;
  const pct = (value: number) => `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
  return (
    <details className="mt-2 text-xs text-neutral-700" data-action-samples>
      <summary className="cursor-pointer">What happened after each response</summary>
      <p className="mt-1 text-neutral-600">Places: ones we could follow for 60 days. Not counted: ones we could not follow long enough.</p>
      <div className="mt-1 overflow-x-auto" role="region" aria-label="What happened after each response" tabIndex={0}>
        <table className="w-full text-left">
          <caption className="sr-only">How often reports came back within 60 days, with the number of places and a likely range</caption>
          <thead>
            <tr>
              {["Response", "Places", "Not counted", "Came back", "Likely range"].map((h) => (
                <th key={h} scope="col" className="pr-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {samples.map((s) => (
              <tr key={s.tag} data-action={s.tag} className="border-t border-neutral-100">
                <th scope="row" className="py-1 pr-2 font-normal">{s.label}</th>
                <td className="pr-2 tabular-nums">{fmtNumber(s.n)}</td>
                <td className="pr-2 tabular-nums">{s.censored === null ? "—" : fmtNumber(s.censored)}</td>
                <td className="pr-2 tabular-nums">{s.ratePct === null ? "—" : pct(s.ratePct)}</td>
                <td className="tabular-nums">{s.intervalPct ? `${pct(s.intervalPct[0])} to ${pct(s.intervalPct[1])}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
