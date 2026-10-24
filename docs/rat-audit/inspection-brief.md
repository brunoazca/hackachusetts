# Place evidence and inspection briefs

Select a place, then **Open inspection brief**. The brief includes the public block label, distinct-day counts, individual record history with full available closure notes, nearby counts, source citations, retrieval/import times, and questions for a field visit. **Download brief** saves a self-contained HTML snapshot; **Print / Save PDF** uses the browser's print dialog. The history starts on a new printed page. The HTML download includes its own CSS and has no scripts or external stylesheet dependencies.

## Count and date semantics

- Report days count distinct opened dates; closure days count distinct closed dates. The history retains every individual record, including multiple records on the same date.
- Return days count distinct opened dates containing a report more than 1 day and no more than 60 days after an earlier closure. The existing queue ranking and SQL window are unchanged.
- Timeline ticks group records by opened date. Return highlights use the database's timestamp-based rule, so truncated dates do not invent borderline return classifications.
- SQL date-only values are displayed as calendar labels, independent of the viewer's timezone. Actual timestamps are displayed in America/New_York, with EDT/EST on source freshness.
- Retrieval time and latest successful import are distinct facts. Failed or unfinished imports do not replace the last successful import. A source's live/daily/static label describes its schedule, not proof of current conditions.

## Database rollout

Apply `supabase/migrations/20261024202722_site_evidence_provenance.sql` to the **Piper / rat-audit** database before enabling complete provenance in production. This migration adds only a read-only `site_evidence(text)` function. It uses SECURITY INVOKER and honors the caller's existing RLS policies; it does not alter tables or write any records. Public execution is revoked and granted to the existing anon/authenticated roles. The migration deliberately does not depend on the later-sorting historical draft API migration, so it also works in a fresh migration sequence.

The function returns actual contributing source IDs for rodent history, each nearby category within 100 m during the preceding 12 months, and vacant parcels within 40 m. Its source list includes the corresponding source metadata and latest successful import. Counts and source IDs for nearby evidence come from the same query snapshot.

On an older database, the UI resolves report source IDs from the actual incident rows instead of using the draft API's hard-coded Boston list. Nearby provenance is explicitly unavailable until the migration is applied. It never substitutes a global import time or fabricates nearby citations.

**Rollout status on October 24, 5:22 PM EDT:** the migration file exists in local `main` and `origin/main`. Its function passed isolated PostGIS tests. The live project still returned HTTP 404 / PGRST202 for `site_evidence(site_id)`: the function is unavailable in the API schema cache. This proves it is unavailable to the app, but does not distinguish an unapplied migration from a stale PostgREST cache. SQL catalog access is needed to settle that distinction. Public read configuration was restored locally from the existing deployed client; no database administration credential was available.

## Verification

- `cd web && pnpm test`: five regression tests covering timezone/DST/leap-day date display, timestamp display, duplicate-day grouping, source selection/unsafe URLs, and standalone export preservation.
- `cd web && pnpm exec tsc --noEmit`: passed.
- Full `pnpm lint`: passed with no errors or warnings. Parcel data is keyed to the requested bounds instead of resetting state synchronously in an effect. The generated MapLibre worker is excluded from lint; application code remains checked.
- Production build: `node node_modules/next/dist/bin/next build` passed under Node 24. The environment's `pnpm build` script launcher failed with a Turbopack port-permission error; direct Node completed compilation, TypeScript, prerendering, and optimization.
- `supabase/tests/site_evidence.sql`: passed in a disposable Supabase Postgres 17/PostGIS container against the real migration, core schema, and draft place functions. Assertions cover six records on three dates, duplicate return days, exact 1-/60-day boundaries, 99/101 m and 39/41 m distances, historical exclusion, actual Cambridge/Somerville source attribution, failed/unfinished imports, missing places, and caller RLS. Fixtures roll back. Run only in an isolated test database with the prerequisite schema and SELECT grants for anon/authenticated.
- Earlier browser check against live data: Geneva St showed 31 records across 26 report days, the August 5 date stayed August 5, and three report sources displayed their individual retrieval/import times. Queue → place → brief navigation passed. The downloaded HTML contained all 31 records, citations, and inline print rules without scripts/external CSS.
- Print regression: the global work-order-only stylesheet initially produced eight blank Letter pages. The brief now explicitly restores print visibility. Record blocks also avoid page breaks so their closure notes and identifiers stay together. Actual Chromium Letter and A4 PDF rendering is checked separately from the button's `window.print()` invocation; this does not automate the operating system's native save dialog.
- Responsive/keyboard regression: header controls fit at widths 320, 390, 640, 768, 1024, and 1280. Small screens put the view switch below the brand/actions, with shared panel offsets. Details panels fit the viewport and hide the covered queue from the tab order. Radio/tab groups support arrows and Home/End; opening details moves focus inside, and Escape restores the opener.

For a repeatable browser regression, start the production build locally, create `/tmp/piper-quality`, open that local URL with a named `playwright-cli` session, then run `.kiro/scripts/check_ui_quality.playwright.js` through `playwright-cli run-code --filename=...`. It checks the live queue → details → brief path, keyboard behavior, viewport bounds, Letter/A4 PDFs, the print button, and HTML download. Outputs go to `/tmp/piper-quality`; inspect the rendered PDF pages before release. Live database RPC failures remain independent of these UI checks.

**October 24, 5:19 PM EDT:** the complete browser regression passed against a local production build with live public data. Both PDF sizes contain eight pages and all 31 individual Geneva St records. Rendered pages were visually reviewed; every page's record-opening count matches its record-identifier count, confirming that these record blocks stayed intact. Sources and freshness remain visible, and the print toolbar is excluded. Proof files are in `docs/rat-audit/quality-proof/`. Full lint, TypeScript, the five evidence regressions, secret scan, and Node production build passed. The overclaim scanner flags an existing sentence that explicitly says the score does **not** count rats; that warning was reviewed in context.

Screenshots: `docs/submission/screenshots/place-counts-sources.jpg` and `docs/submission/screenshots/inspection-brief.jpg`.

The brief is a review aid, not an approved work order. A public block label is not an exact visit location; reports are not rat counts, closure does not establish resolution, and proximity does not establish causation.
