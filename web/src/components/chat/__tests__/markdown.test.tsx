import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { UIMessage } from "ai";
import Markdown from "../Markdown";
import Message from "../Message";

const render = (text: string) => renderToStaticMarkup(<Markdown text={text} />);
const table = `| Rank | Site | Neighborhood | Returns (12 mo) | Total reports | Latest report |
|---|---|---|---:|---:|---|
| 1 | W Fourth St, 02127 | South Boston / South Boston Waterfront | 162 | 448 | 2026-10-16 |
| 2 | Charles St, 02114 | Beacon Hill | 145 | 336 | 2026-10-23 |`;

test("the reported six-column table renders as an accessible, scrollable table", () => {
  const html = render(`## Places to review\n\n${table}\n\n- All five are flagged **Due**.\n- These counts are 311 reports, not rat populations.`);
  assert.match(html, /<h3>Places to review<\/h3>/);
  assert.match(html, /role="region"[^>]+tabindex="0"/);
  assert.equal((html.match(/<th scope="col"/g) ?? []).length, 6);
  assert.equal((html.match(/<tr>/g) ?? []).length, 3);
  assert.match(html, /text-align:right">162<\/td>/);
  assert.match(html, /<ul>\s*<li>All five are flagged <strong>Due<\/strong>/);
  assert.doesNotMatch(html, /\|---|\| Rank/);
});

test("paragraphs, nested lists, quotes, code and task lists preserve their structure", () => {
  const html = render("First paragraph.\n\nSecond with *emphasis* and `code`.\n\n1. Review reports\n   - Compare dates\n2. Visit\n\n> Not a population estimate.\n\n```text\nA | B\n```\n\n- [x] Reviewed\n- [ ] Pending");
  assert.match(html, /<p>First paragraph.<\/p>\s*<p>Second/);
  assert.match(html, /<em>emphasis<\/em>/);
  assert.match(html, /<ol>[\s\S]*<ul>[\s\S]*Compare dates/);
  assert.match(html, /<blockquote>/);
  assert.match(html, /<pre tabindex="0"[^>]*><code[^>]*>A \| B/);
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 2);
  assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
});

test("model text cannot execute HTML or unsafe URLs or load remote images", () => {
  const html = render('<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[Unsafe](javascript:alert%281%29)\n\n![Map](https://example.org/tracker.png)\n\n[City data](https://data.boston.gov/)');
  assert.doesNotMatch(html, /<script|<img|onerror=|href="javascript:|src="/i);
  assert.match(html, /<span>Unsafe<\/span>/);
  assert.match(html, /href="https:\/\/data.boston.gov\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
});

test("incomplete streamed Markdown stays renderable and resolves when finished", () => {
  for (const text of ["**Review", "[City data](https://data.", "```json\n{", table.slice(0, 70), table]) {
    assert.doesNotThrow(() => render(text));
  }
  assert.match(render(table), /<table>/);
});

test("footnote links retain their targets in both directions", () => {
  const html = render("A report[^1].\n\n[^1]: Boston 311.");
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const link of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(link[1]), `Missing footnote target: ${link[1]}`);
});

test("assistant messages use Markdown and keep source/record disclosure closed", () => {
  const message = {
    id: "answer", role: "assistant", parts: [
      { type: "text", text: table },
      { type: "tool-top_sites", toolCallId: "lookup", state: "output-available", input: {}, output: {
        ok: true, data: { total: 1 }, caveats: [],
        sources: [{ id: "boston-311", name: "Boston 311", url: "https://data.boston.gov/" }],
        features: [{ kind: "site", id: "site-1", label: "W Fourth St" }],
      } },
    ],
  } as UIMessage;
  const html = renderToStaticMarkup(<Message message={message} />);
  assert.match(html, /<table>/);
  assert.match(html, /<details[^>]*>[\s\S]*Sources &amp; records/);
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|\s|>)/);
  assert.match(html, /Select W Fourth St on the map/);
  const user = renderToStaticMarkup(<Message message={{ id: "user", role: "user", parts: [{ type: "text", text: "**literal question**" }] }} />);
  assert.match(user, /\*\*literal question\*\*/);
  assert.doesNotMatch(user, /<strong>/);
});
