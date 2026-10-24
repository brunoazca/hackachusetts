"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchSiteDetail, type SiteDetail } from "@/lib/queries";
import { formatDate, formatTimestamp } from "@/lib/dates";
import { INSPECTION_QUESTIONS, sourceUrl, type SourceEvidence } from "@/lib/evidence";
import categories from "@/lib/categories.json";
import { BRIEF_CSS, standaloneBrief } from "@/lib/inspection-brief";

const CATS = categories.incident_categories as Record<string, { label: string }>;

/** City of Boston seal, inline so the downloaded/printed brief carries it with no external asset. */
function BostonSeal() {
  return (
    <svg className="brief-seal" viewBox="0 0 100 100" role="img" aria-label="City of Boston seal" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="49" fill="#1a4ba8" />
      <circle cx="50" cy="50" r="49" fill="none" stroke="#12377d" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#ffffff" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="30" fill="#ffffff" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <circle key={i} cx={50 + 43.5 * Math.cos(a)} cy={50 + 43.5 * Math.sin(a)} r="0.9" fill="#ffffff" />;
      })}
      <path d="M50 28 L30 44 V70 H42 V56 H58 V70 H70 V44 Z" fill="#1a4ba8" />
      <rect x="47" y="22" width="6" height="12" rx="1" fill="#1a4ba8" />
      <rect x="44" y="60" width="12" height="10" fill="#ffffff" />
      <text x="50" y="86" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ffffff" fontFamily="Georgia,serif">BOSTONIA</text>
    </svg>
  );
}

function Citations({ ids, sources }: { ids: string[] | undefined; sources: SourceEvidence[] }) {
  if (!ids?.length) return <p className="brief-muted">Source not listed.</p>;
  return <p className="brief-muted">Sources: {[...new Set(ids)].map((id, i) => {
    const index = sources.findIndex((s) => s.id === id);
    return <span key={id}>{i > 0 ? ", " : ""}{index < 0 ? "another source" : <a href={`#source-${index + 1}`}>{sources[index].name} [{index + 1}]</a>}</span>;
  })}</p>;
}

export function BriefDocument({ detail: d, generatedAt }: { detail: SiteDetail; generatedAt: string }) {
  const s = d.site;
  const sources = d.evidence?.sources ?? d.report_sources ?? [];
  const reportSourceIds = d.evidence?.report_source_ids ?? d.report_sources?.map((source) => source.id);
  const reports = [...d.reports].sort((a, b) => b.opened.localeCompare(a.opened) || a.id.localeCompare(b.id));
  const reportMetadata = new Map(d.evidence?.reports.map((r) => [r.id, r]));
  const nearby = Object.entries(d.drivers_100m_12mo).sort((a, b) => b[1] - a[1]);

  return <article className="inspection-brief" data-theme="bone">
    <style>{BRIEF_CSS}</style>
    <header className="brief-header">
      <div className="brief-brand">
        <BostonSeal />
        <span className="brief-brand-text">
          <span className="brief-brand-city">City of Boston</span>
          <span className="brief-brand-sub">Inspectional Services</span>
        </span>
      </div>
      <p className="brief-eyebrow">Piper · Field review</p>
      <h1>Inspection brief</h1>
      <h2>{s.address_block ?? "Unnamed block"}</h2>
      <p className="brief-place">{[s.neighborhood, s.city].filter(Boolean).join(" · ")}</p>
      <div className="brief-meta">
        <span className="brief-chip">Prepared {formatTimestamp(generatedAt)}</span>
        <span className="brief-chip">Address shown by block — confirm the exact spot before you go</span>
      </div>
    </header>

    <section>
      <h2>Why review this place</h2>
      <p>{s.due ? "Recheck now: the city closed a case here in the last 60 days, and reports have come back after an earlier closure." : "This place has repeat rodent reports. It is not on the recheck-now list right now."}</p>
      <dl className="brief-stats">
        <div><dt>Reports</dt><dd>{d.reports.length}</dd></div>
        <div><dt>Days reported</dt><dd>{s.reports}</dd></div>
        <div><dt>Days closed</dt><dd>{s.closures}</dd></div>
        <div><dt>Comebacks</dt><dd>{s.returns}</dd></div>
      </dl>
      <p>Reports from {formatDate(s.first_at)} to {formatDate(s.last_at)}. Last closed by the city: {formatDate(s.last_closed)}.</p>
      <p className="brief-muted">We count days, so several reports on one day count once. A comeback is a day with a new report 2 to 60 days after a closure. History starts January 2024.</p>
      <Citations ids={reportSourceIds} sources={sources} />
    </section>

    <section>
      <h2>Nearby problems to check</h2>
      <p>Other reports within 100 m of this place in the past year{d.evidence ? ` (${formatDate(d.evidence.nearby_since)}–${formatDate(d.evidence.as_of)})` : ""}.</p>
      {nearby.length ? <table>
        <thead><tr><th scope="col">Problem</th><th scope="col">Reports</th><th scope="col">Sources</th></tr></thead>
        <tbody>{nearby.map(([category, count]) => <tr key={category}>
          <th scope="row">{CATS[category]?.label ?? category}</th><td>{count}</td>
          <td><Citations ids={d.evidence?.nearby.find((r) => r.category === category)?.source_ids} sources={sources} /></td>
        </tr>)}</tbody>
      </table> : <p>No other reports nearby. That does not mean there are no problems.</p>}
      <p>Empty lots within 40 m: <strong>{d.adjacent_vacant_parcels}</strong>.</p>
      {d.adjacent_vacant_parcels > 0 && <Citations ids={d.evidence?.vacant.source_ids} sources={sources} />}
      <p className="brief-muted">Being nearby does not prove these cause the problem. Each city shares different data.</p>
    </section>

    <section>
      <h2>Questions for the visit</h2>
      <ol className="brief-questions">{INSPECTION_QUESTIONS.map((question) => <li key={question}>{question}</li>)}</ol>
      <div className="brief-notes"><p>Notes · inspector · date · next step</p><div /><div /><div /></div>
    </section>

    <section className="brief-history">
      <h2>Every report and what the city did</h2>
      <p>{d.reports.length} reports, newest first, with the city&apos;s full closing notes.</p>
      <Citations ids={reportSourceIds} sources={sources} />
      <ol className="brief-records">{reports.map((r) => {
        const meta = reportMetadata.get(r.id);
        const sourceIndex = meta ? sources.findIndex((source) => source.id === meta.source_id) : -1;
        return <li key={r.id}>
          <div className="brief-record-heading"><strong>Reported {formatDate(r.opened)}</strong><span>{r.closed ? `Closed ${formatDate(r.closed)}` : "Not closed"}</span></div>
          <p>Status: {r.status}. What the city did: {r.action?.replace(/_/g, " ") ?? "not noted"}.</p>
          {meta?.after_closure && <p className="brief-muted">This report came back within 60 days of an earlier closure.</p>}
          <p className="brief-note">{r.note?.trim() || "No note from the city."}</p>
          <p className="brief-muted">{sourceIndex >= 0 && <><a href={`#source-${sourceIndex + 1}`}>Source [{sourceIndex + 1}]</a></>}</p>
        </li>;
      })}</ol>
    </section>

    <section className="brief-sources">
      <h2>Where this comes from</h2>
      <p className="brief-muted">“Updated” is when we last got the data, not when things happened on the street.</p>
      {d.evidence_unavailable && <p>We could not load every source, so some nearby counts may not show where they came from.</p>}
      {sources.length ? <ol>{sources.map((source, i) => {
        const url = sourceUrl(source.url);
        return <li key={source.id} id={`source-${i + 1}`}>
          <strong>{source.name}</strong>
          <p>{url ? <a className="brief-source-url" href={url}>{url}</a> : "No link"}</p>
          <p>Updated {formatTimestamp(source.last_success_at ?? source.retrieved_at)}</p>
          {source.update_note && <p>{source.update_note}</p>}
        </li>;
      })}</ol> : <p>We could not load the source list.</p>}
    </section>
    <footer className="brief-footer">For a person to review. Reports come from people, not rat counts. A closed case does not mean the problem is gone. This brief is not an inspection result or an approved work order.</footer>
  </article>;
}

export default function InspectionBrief({ id }: { id: string }) {
  const [result, setResult] = useState<{ detail?: SiteDetail | null; generatedAt: string; error?: string } | null>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    fetchSiteDetail(id).then((detail) => {
      if (live) setResult({ detail, generatedAt: new Date().toISOString() });
    }).catch(() => { if (live) setResult({ error: "The inspection brief could not be loaded. Please return to the map and try again.", generatedAt: "" }); });
    return () => { live = false; };
  }, [id]);

  function download() {
    if (!content.current) return;
    const blob = new Blob([standaloneBrief(content.current.innerHTML)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `piper-inspection-${id.replace(/[^a-zA-Z0-9_-]/g, "")}.html`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className="min-h-full bg-bg px-4 py-6 text-fg" data-theme="bone">
    <nav aria-label="Inspection brief actions" className="brief-toolbar mx-auto mb-5 flex max-w-4xl flex-wrap items-center gap-3">
      <Link href="/" className="mr-auto text-sm font-semibold underline underline-offset-4">← Back to map</Link>
      <button type="button" disabled={!result?.detail} onClick={download} className="rounded-md border border-edge px-4 py-2 text-sm font-semibold disabled:opacity-40">Download brief</button>
      <button type="button" disabled={!result?.detail} onClick={() => window.print()} className="rounded-md bg-fg px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40">Print / Save PDF</button>
    </nav>
    {!result && <p role="status" className="mx-auto max-w-4xl">Loading inspection brief…</p>}
    {result?.error && <p role="alert" className="mx-auto max-w-4xl">{result.error}</p>}
    {result?.detail === null && <p className="mx-auto max-w-4xl">This place is no longer available.</p>}
    {result?.detail && <div ref={content}><BriefDocument detail={result.detail} generatedAt={result.generatedAt} /></div>}
  </main>;
}
