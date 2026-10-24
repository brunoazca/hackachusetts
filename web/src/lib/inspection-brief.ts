/** Included in the document itself so a downloaded brief works offline. */
export const BRIEF_CSS = `
.inspection-brief { box-sizing:border-box; max-width:900px; margin:0 auto; padding:40px; background:#fff; color:#111315; font:15px/1.5 Arial,sans-serif; color-scheme:light; overflow-wrap:anywhere; }
.inspection-brief * { box-sizing:border-box; }
.inspection-brief h1 { font-size:34px; line-height:1.15; margin:8px 0 20px; letter-spacing:-.04em; }
.inspection-brief h2 { font-size:20px; line-height:1.3; margin:0 0 12px; }
.inspection-brief p { margin:6px 0; }
.inspection-brief section { margin-top:28px; border-top:1px solid #dcddd9; padding-top:20px; }
.inspection-brief a { color:inherit; text-decoration:underline; text-underline-offset:2px; }
.brief-eyebrow { text-transform:uppercase; font-size:11px; letter-spacing:.14em; font-weight:700; }
.brief-muted { font-size:12px; color:#4a4f55; }
.brief-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin:20px 0; }
.brief-stats dt { font-size:12px; }
.brief-stats dd { margin:0; font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; }
.inspection-brief table { border-collapse:collapse; width:100%; margin:12px 0; font-size:13px; table-layout:fixed; }
.inspection-brief th, .inspection-brief td { text-align:left; padding:8px; border-bottom:1px solid #dcddd9; vertical-align:top; }
.inspection-brief th:nth-child(2), .inspection-brief td:nth-child(2) { width:70px; }
.brief-questions { padding-left:24px; list-style:decimal; }
.brief-questions li { margin:8px 0; }
.brief-notes { margin-top:20px; font-size:12px; color:#4a4f55; }
.brief-notes div { height:28px; border-bottom:1px solid #dcddd9; }
.brief-records { list-style:none; padding:0; margin:12px 0 0; }
.brief-records li { padding:14px 0; border-bottom:1px solid #dcddd9; }
.brief-record-heading { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
.brief-note { white-space:pre-wrap; }
.brief-sources ol { padding-left:24px; list-style:decimal; }
.brief-sources li { padding:8px 0; font-size:12px; }
.brief-source-url { overflow-wrap:anywhere; }
.brief-footer { border-top:2px solid #111315; padding-top:16px; margin-top:28px; font-size:12px; }
@media (max-width:600px) { .inspection-brief { padding:20px; } .brief-stats { grid-template-columns:repeat(2,1fr); } }
@media print {
  @page { size:auto; margin:16mm; }
  html, body { height:auto !important; margin:0 !important; background:#fff !important; color:#111315 !important; }
  main { padding:0 !important; background:#fff !important; }
  .brief-toolbar, nextjs-portal { display:none !important; }
  .inspection-brief { max-width:none; padding:0; font-size:10pt; }
  .inspection-brief, .inspection-brief * { visibility:visible; }
  .inspection-brief h1 { font-size:26pt; }
  .inspection-brief h2 { font-size:14pt; break-after:avoid; }
  .inspection-brief p { orphans:3; widows:3; }
  .inspection-brief thead { display:table-header-group; }
  .inspection-brief tr, .brief-stats, .brief-questions li, .brief-sources li, .brief-records li, .brief-footer { break-inside:avoid; }
  .brief-stats { grid-template-columns:repeat(4,1fr); }
  .brief-history { break-before:page; }
  .brief-muted, .brief-sources li, .brief-footer { font-size:9pt; }
}
`;

/** The input is React-rendered DOM, never raw source notes or user-provided HTML. */
export function standaloneBrief(renderedArticle: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Piper inspection brief</title></head><body>${renderedArticle}</body></html>`;
}
