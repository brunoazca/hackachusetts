// Recorded research, not a live query. Keep its date and limitations visible.
const REPORT = "https://github.com/brunoazca/hackachusetts/blob/cf4389b/docs/submission/data-report.md";
const sourceClass = "block text-small text-fg-3 underline underline-offset-2";

export default function HistoricalFindings({ onReviewPlaces }: { onReviewPlaces?: () => void }) {
  return (
    <section aria-label="Historical research, October 24, 2026" className="space-y-3" data-research-snapshot>
      <p className="text-small text-fg-3">Team research · Oct 24, 2026 · Historical results, not recalculated with the map.</p>

      <article className="space-y-3 rounded-lg border border-line bg-card p-4">
        <p className="eyebrow">Repeat reports</p>
        <h2 className="text-title font-semibold text-fg">A closure is not evidence of a lasting fix.</h2>
        <p className="text-small text-fg-2">In the team’s historical analysis, places with a longer report history were much more likely to be reported again within 60 days.</p>
        <dl className="grid grid-cols-2 gap-3 border-y border-line py-3">
          <div><dt className="text-small text-fg-3">No prior reports</dt><dd className="font-mono text-data-lg text-fg">8–12%</dd></div>
          <div><dt className="text-small text-fg-3">5+ prior reports</dt><dd className="font-mono text-data-lg text-return">56–75%</dd></div>
        </dl>
        <p className="text-small text-fg-2"><strong className="text-fg">What to review:</strong> repeated reports and earlier closure notes before treating a closed case as resolved. Another report does not establish treatment failure.</p>
        {onReviewPlaces && <button type="button" onClick={onReviewPlaces} className="min-h-10 rounded-md border border-edge px-3 text-ui text-fg hover:bg-card-hover">Review places with repeat reports</button>}
        <a className={sourceClass} href={`${REPORT}#5-the-key-result-these-records-do-not-establish-which-response-lasts`} target="_blank" rel="noreferrer">Research record and sources ↗</a>
      </article>

      <article className="space-y-3 rounded-lg border border-line bg-card p-4">
        <p className="eyebrow">Which response works?</p>
        <h2 className="text-title font-semibold text-fg">These records do not identify a better response.</h2>
        <p className="text-small text-fg-2">Matching on prior reports, neighborhood and month did not reveal a clear difference between citation or abatement and monitoring.</p>
        <p className="font-mono text-data text-fg">Risk ratio 1.03 · 95% CI 0.89–1.20</p>
        <p className="text-small text-fg-2">The interval includes 1, so this analysis cannot distinguish an increase from a decrease in return risk. It does not prove the responses are equally effective.</p>
        <p className="text-small text-fg-3">Historical study: 19,496 Boston cases, 2023–2026. Observational, not a trial. Closure notes do not confirm field actions.</p>
        <a className={sourceClass} href={`${REPORT}#5-the-key-result-these-records-do-not-establish-which-response-lasts`} target="_blank" rel="noreferrer">Matched-study evidence ↗</a>
      </article>

      <details className="rounded-lg border border-line p-3 text-small text-fg-2">
        <summary className="cursor-pointer font-medium text-fg">What the research did not establish</summary>
        <p className="mt-2">No rain association was detected in the tested windows. This does not establish that rain has no effect on rats. Reports measure reporting, not the rat population.</p>
        <a className={sourceClass} href={`${REPORT}#7-findings-we-should-not-overstate`} target="_blank" rel="noreferrer">Tested ideas and limitations ↗</a>
      </details>
    </section>
  );
}
