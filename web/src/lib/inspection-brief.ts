/** Included in the document itself so a downloaded brief works offline. */
export const BRIEF_CSS = `
.inspection-brief {
  --ink:#16181c; --ink-soft:#5b626b; --line:#e6e7e2; --line-soft:#eeefe9;
  --accent:#1a4ba8; --accent-soft:#eef3fb; --surface:#fbfbf9; --paper:#ffffff;
  --radius:14px; --shadow:0 1px 2px rgba(16,18,22,.04), 0 10px 30px -18px rgba(16,18,22,.25);
  box-sizing:border-box; max-width:860px; margin:0 auto; padding:0 0 48px;
  background:var(--paper); color:var(--ink); color-scheme:light; overflow-wrap:anywhere;
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-feature-settings:"kern" 1,"liga" 1; -webkit-font-smoothing:antialiased;
}
.inspection-brief * { box-sizing:border-box; }
.inspection-brief h1 { font-size:40px; line-height:1.1; margin:10px 0 18px; letter-spacing:-.025em; font-weight:800; }
.inspection-brief h2 { font-size:17px; line-height:1.3; margin:0 0 14px; letter-spacing:-.01em; font-weight:700; }
.inspection-brief p { margin:8px 0; }
.inspection-brief a { color:var(--accent); text-decoration:none; border-bottom:1px solid rgba(26,75,168,.28); transition:border-color .15s; }
.inspection-brief a:hover { border-bottom-color:var(--accent); }

/* Header */
.brief-header {
  position:relative; margin-bottom:8px; padding:38px 44px 34px;
  background:linear-gradient(180deg,var(--surface),var(--paper));
  border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow);
}
.brief-brand { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
.brief-seal { flex:0 0 auto; width:48px; height:48px; border-radius:50%; display:block; }
.brief-brand-text { display:flex; flex-direction:column; gap:2px; line-height:1.15; }
.brief-brand-city { font-size:13px; font-weight:700; letter-spacing:-.01em; color:var(--ink); }
.brief-brand-sub { font-size:11px; color:var(--ink-soft); }
.brief-eyebrow {
  display:inline-block; text-transform:uppercase; font-size:10.5px; letter-spacing:.16em; font-weight:700;
  color:var(--accent); background:var(--accent-soft); padding:5px 10px; border-radius:999px;
}
.brief-header h2 { font-size:22px; font-weight:700; margin:6px 0 2px; letter-spacing:-.02em; }
.brief-place { font-size:15px; color:var(--ink-soft); font-weight:500; margin:2px 0 14px; }
.brief-meta { display:flex; flex-wrap:wrap; gap:8px; margin:0; }
.brief-chip {
  font-size:12px; color:var(--ink-soft); background:var(--surface);
  border:1px solid var(--line); border-radius:999px; padding:4px 11px;
}

/* Sections */
.inspection-brief section { margin:30px 44px 0; padding-top:28px; border-top:1px solid var(--line-soft); }
.brief-muted { font-size:12.5px; color:var(--ink-soft); line-height:1.55; }

/* Stat cards */
.brief-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin:22px 0; }
.brief-stats div {
  padding:16px 16px 14px; background:var(--surface); border:1px solid var(--line);
  border-radius:12px; display:flex; flex-direction:column; gap:6px;
}
.brief-stats dt { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-soft); }
.brief-stats dd { margin:0; font-size:32px; font-weight:800; line-height:1; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }

/* Tables */
.inspection-brief table { border-collapse:separate; border-spacing:0; width:100%; margin:16px 0; font-size:13.5px; table-layout:fixed; border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.inspection-brief thead th { background:var(--surface); font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--ink-soft); font-weight:700; }
.inspection-brief th, .inspection-brief td { text-align:left; padding:12px 14px; border-bottom:1px solid var(--line-soft); vertical-align:top; }
.inspection-brief tbody tr:last-child th, .inspection-brief tbody tr:last-child td { border-bottom:0; }
.inspection-brief tbody tr:hover { background:rgba(26,75,168,.025); }
.inspection-brief th:nth-child(2), .inspection-brief td:nth-child(2) { width:84px; font-variant-numeric:tabular-nums; font-weight:700; }
.inspection-brief tbody th { font-weight:600; }

/* Questions + notes */
.brief-questions { padding-left:22px; list-style:decimal; margin:12px 0; }
.brief-questions li { margin:9px 0; padding-left:4px; }
.brief-notes { margin-top:22px; font-size:12px; color:var(--ink-soft); }
.brief-notes div { height:30px; border-bottom:1px solid var(--line); margin-top:10px; }

/* History records */
.brief-records { list-style:none; padding:0; margin:14px 0 0; display:flex; flex-direction:column; gap:12px; }
.brief-records li { padding:16px 18px; border:1px solid var(--line); border-radius:12px; background:var(--paper); }
.brief-record-heading { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; align-items:baseline; margin-bottom:4px; }
.brief-record-heading strong { font-size:14.5px; }
.brief-record-heading span { font-size:12px; color:var(--ink-soft); background:var(--surface); border:1px solid var(--line); border-radius:999px; padding:2px 10px; }
.brief-note { white-space:pre-wrap; background:var(--surface); border-left:3px solid var(--line); padding:10px 12px; border-radius:0 8px 8px 0; margin:10px 0 6px; font-size:13.5px; }

/* Sources */
.brief-sources ol { padding-left:22px; list-style:decimal; margin:12px 0; }
.brief-sources li { padding:10px 0; font-size:12.5px; }
.brief-sources li strong { font-size:13px; }
.brief-source-url { overflow-wrap:anywhere; }
.brief-footer { margin:32px 44px 0; padding:18px 20px; background:var(--surface); border:1px solid var(--line); border-radius:12px; font-size:12px; color:var(--ink-soft); line-height:1.55; }

@media (max-width:640px) {
  .brief-header { padding:26px 22px; border-radius:0; }
  .inspection-brief section, .brief-footer { margin-left:22px; margin-right:22px; }
  .inspection-brief h1 { font-size:30px; }
  .brief-stats { grid-template-columns:repeat(2,1fr); }
}
@media (prefers-color-scheme:dark) { .inspection-brief { color-scheme:light; } }

@media print {
  @page { size:auto; margin:14mm; }
  html, body { height:auto !important; margin:0 !important; background:#fff !important; color:#16181c !important; }
  main { padding:0 !important; background:#fff !important; }
  .brief-toolbar, nextjs-portal { display:none !important; }
  .inspection-brief { max-width:none; padding:0; font-size:10pt; --shadow:none; }
  .inspection-brief, .inspection-brief * { visibility:visible; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .brief-header { box-shadow:none; border-radius:0; border:0; border-bottom:2px solid #16181c; padding:0 0 14pt; margin:0 0 6pt; background:#fff; }
  .inspection-brief section, .brief-footer { margin-left:0; margin-right:0; }
  .brief-footer { border-radius:0; background:#fff; }
  .inspection-brief h1 { font-size:24pt; }
  .inspection-brief h2 { font-size:13pt; break-after:avoid; }
  .inspection-brief p { orphans:3; widows:3; }
  .inspection-brief thead { display:table-header-group; }
  .inspection-brief table { border-radius:0; }
  .inspection-brief tr, .brief-stats, .brief-stats div, .brief-questions li, .brief-sources li, .brief-records li, .brief-footer { break-inside:avoid; }
  .brief-stats { grid-template-columns:repeat(4,1fr); }
  .brief-history { break-before:page; }
  .brief-muted, .brief-sources li, .brief-footer { font-size:9pt; }
}
`;

/** The input is React-rendered DOM, never raw source notes or user-provided HTML. */
export function standaloneBrief(renderedArticle: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Piper inspection brief</title></head><body>${renderedArticle}</body></html>`;
}
