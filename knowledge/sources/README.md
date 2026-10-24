# Research verification artifacts

Checked October 24, 2026. These files support the Markdown research, not application runtime behavior.

- `civic_dataset_audit.json` records direct inspection of all 22 CSVs in the organizer's Civic starter ZIP. Source URLs are copied from the included READMEs; availability and semantic correctness are separate questions.
- `audit_civic_kit.py` reproduces those checks using Python's standard library. It never executes the downloaded kit's scripts.
- `link_audit.json` records HTTP HEAD status, redirects, timestamp, referring documents and request failures for public links in `knowledge/*.md`.
- `check_research_links.py` performs bounded requests with ordinary TLS verification and no credentials. Some publishers reject automated HEAD requests even when browser access works.

## Evidence reviewed beyond the link check

The deep research brief records three YouTube caption sources with timestamped notes: a government-AI evaluation workshop, selected State of the Schools passages, and the full short Innovation Expo promo. These were text-caption reviews, not independently verified audio transcriptions. The City's official speech and award pages were used to check names and claims.

The City Expo's 34-page poster collection was text-extracted. BidBot, disability access, and mattress-collection posters were also rendered and visually inspected. Their quantitative results remain source-reported, with evaluation limits recorded in document 06.

The October 1 WBUR audio was not independently transcribed. The October 23 rodent hearing's official notice was checked; its third-party AI summary remains a lead requiring verification against the official recording. Neither is presented as a fully verified transcript.

## HTTP status interpretation

- **2xx:** endpoint answered the request; this does not validate a claim, API schema, access from the app, or freshness.
- **3xx:** inspect the redirect target; access may lead to a login or generic page.
- **403/429:** access restriction or throttling; use the cited primary page/browser if available, and do not call the source deleted.
- **404/410:** check the canonical source or publisher navigation before relying on the URL.
- **000 / curl error:** this environment did not obtain an HTTP response; timeout/TLS/network failure is not a factual refutation.

Files are dated observations. Re-run only when needed for the chosen product or a source changes. Do not interpret a public URL as permission to access private systems or submit requests.

## Results of this pass

The first pass checked **135 unique URLs**: 130 returned HTTP 200, two returned 403, one 406, one 429, and one encountered a TLS error. There were no 404/410 responses. These are reachability results, not 130 independently validated claims.

- The Founder Collective `www` address failed TLS; its [canonical homepage](https://foundercollective.com/) was successfully read with the web research tool, and the document link was corrected.
- WBZ returned 406 to HEAD, but its permitting article was successfully read with the web research tool; its February 2, 2026 date and beta description were confirmed.
- BLS and the MassDOT/MS2 dashboard returned 403. Their availability through an end-user browser or application remains to be checked if selected.
- Catchwind returned 429. Its incomplete preview is retained only as a verification-gap note, not evidence for new interview claims.

The audit JSON retains the original request results and records manual follow-up on the corrected/alternately accessed sources. Source access can differ by method and environment.
