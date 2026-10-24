// Historical findings from docs/submission/data-report.md, not a live query.
// The matched comparison supersedes the earlier unadjusted before/after chart.

export default function InsightsPanel() {
  return (
    <div className="space-y-3 px-5 pb-5 pt-4">
      <article className="space-y-3 rounded-lg border border-line bg-card p-5">
        <span className="eyebrow">Historical research snapshot · Responses</span>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-fg">These records do not establish which response works better.</h2>
        <p className="text-[13px] leading-[18px] text-fg-2">The team&apos;s matched analysis of 19,496 Boston cases from 2023–2026 found no clear difference in reports within 60 days of closure for citation or abatement compared with monitoring.</p>
        <dl className="grid grid-cols-2 gap-3 border-y border-line py-3">
          <div><dt className="text-xs text-fg-3">Risk ratio</dt><dd className="font-mono text-xl text-fg">1.03</dd></div>
          <div><dt className="text-xs text-fg-3">95% confidence interval</dt><dd className="font-mono text-xl text-fg">0.89–1.20</dd></div>
        </dl>
        <p className="text-xs leading-5 text-fg-2">This observational comparison does not prove that the responses are equally effective. Reports are not rat counts, and closure notes do not confirm what happened in the field.</p>
        <p className="text-xs leading-5 text-fg-3">Research snapshot: October 24, 2026. Source: <a className="underline" href="https://data.boston.gov/dataset/311-service-requests" target="_blank" rel="noreferrer">Boston 311 records</a>; analysis documented in the repository&apos;s submission data report. This card does not update with the map.</p>
      </article>
      <article className="space-y-2 rounded-lg border border-line bg-card p-5">
        <span className="eyebrow">Historical research snapshot · Weather</span>
        <h2 className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-fg">Rain: no association detected in the tested windows.</h2>
        <p className="text-xs leading-5 text-fg-3">The exploratory analysis did not detect a clear relationship with reported rodent activity. That does not establish that rain has no effect on rats.</p>
      </article>
    </div>
  );
}
