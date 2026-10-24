# Research verification artifacts

Checked October 24, 2026. These files support the Markdown research, not application runtime behavior.

```
knowledge/sources/
├── scripts/      # repeatable probe/audit code (run these)
└── artifacts/    # the JSON/CSV outputs those scripts produced (dated evidence)
```

Each `scripts/*.py` writes its output into `artifacts/`. Run a script from anywhere; paths resolve from the script's own location.

## scripts/

- `audit_civic_kit.py` reproduces the starter-ZIP CSV checks using Python's standard library. It never executes the downloaded kit's scripts. Writes `artifacts/civic_dataset_audit.json`.
- `check_research_links.py` performs bounded HEAD requests with ordinary TLS verification and no credentials over `knowledge/*.md`. Some publishers reject automated HEAD requests even when browser access works. Writes `artifacts/<--output>` (default `link_audit.json`).
- `audit_public_resources.py` reproduces the public-resource inventory. It does not execute downloaded code, create accounts, submit forms or save individual data rows. It retains failed probes and follows the GBFS discovery document for station feeds. Writes `artifacts/public_resource_audit.json` and `artifacts/public_resource_inventory.csv`.
- `audit_rodent_resources.py` records/reproduces exact Boston rodent-category queries, Cambridge metadata/counts, parsed workshop CSV aggregates and repository license signals. No complaint text or addresses are retained. Writes `artifacts/rodent_resource_audit.json`.
- `inventory_civic_portal.py` / `build_civic_inventory.py` build the `data/civic/inventory/` catalog and regenerate `knowledge/20_civic_source_inventory.md`.
- `rats_zip.py`, `rats_econ.py`, `storm_analysis.py` are the Boston-rat-audit analysis scripts (ZIP-level driver correlations, Airbnb/Zillow comparison, the blizzard 311→tract join). They read external data dirs passed in, not repo paths.

## artifacts/

- `civic_dataset_audit.json` records direct inspection of all 22 CSVs in the organizer's Civic starter ZIP. Source URLs are copied from the included READMEs; availability and semantic correctness are separate questions.
- `link_audit.json` records HTTP HEAD status, redirects, timestamp, referring documents and request failures for public links in `knowledge/*.md`.
- `public_resource_audit.json` records the deeper expansion's bounded GETs: **25 data/discovery/schema probes** (21 HTTP 200, three HTTP 400, one redirect followed by timeout) and **22 repository metadata probes** (21 existing repositories, one incorrect InVEST path corrected to `natcap/invest`). Six actual license files were also inspected.
- `public_resource_inventory.csv` is a **catalog CSV** with 47 data/repository probe rows, not the underlying municipal datasets. GitHub license metadata can say `NOASSERTION` even when the inspected license file is clear; document 22 records the distinction.
- `creative_link_audit.json` is the separate reachability check for the creative documents (now 13–17, originally 09–11). The original link audit is retained.
- `rodent_resource_audit.json` records the rodent-resource probe output described above.
- `rodent_hearing_caption_audit.json` records public recording metadata, hashes of two supplied caption tracks and four inspected windows. Full caption files remain outside the repo; notes are paraphrases and were not checked against the audio.
- `rodent_link_audit.json` is the bounded URL reachability check for the rodent playbook (document 16).

> Historical note: the per-document numbers in the audit JSON files (e.g. "09_*", "document 11") record the filenames as they existed when the audit ran on 2026-10-24. The docs were later renumbered (see `knowledge/README.md`); the audits are dated evidence and are not rewritten. Re-run any script to regenerate against current filenames.

The rodent pass checked **26 unique URLs** after replacing an obsolete trash-guide PDF with the current City collection page: 25 returned HTTP 200; Universal Hub returned 403 to HEAD, although its report was readable through the web research service. The final cited set has no 404/410 responses. The machine-readable audit is a reachability check, not proof of the claims on each page.

## Deeper expansion: concrete checks and remaining limits

The Cambridge ramp GeoJSON contained 4,605 features with longitude/latitude coordinates. Bluebikes' August station CSV contained 613 data rows after its date preamble/header, whereas the checked live feed contained 628 station records. The O*NET Essential Skills CSV contained 18,200 rows. These are dated observations, not promises that future downloads match.

Full MassGIS queries restore geography/GEOID omitted from the starter. Boston permit/violation **schemas** expose additional property/address fields; no property-level join was validated. The MBTA Swagger definition resolved unsupported query attempts; an empty successful facility-alert response is not evidence of accessibility. The Census request did not establish usable keyless access.

The Massachusetts youth-employment report was downloaded and text-extracted. Its cover distinguishes the February 2026 report date from publication in June 2026. Relevant executive-summary/barrier/policy passages were read, not every footnote independently verified. The file remains at its official source rather than copied into the repository.

Documents 09–11 distinguish original proposals, direct observations, institutional claims, reported testimony and self-selected resident accounts. No interviews were conducted by the team. TikTok access was blocked; no TikTok video/transcript or X post was accepted as verified evidence in this expansion. See document 11 for channel-specific limits and positive counterexamples.

The separate HEAD pass checked **73 unique URLs** in documents 09–11: 68 returned HTTP 200, two 429, two 403 and one 406; none returned 404/410. Bluebikes and Lemontree restricted HEAD despite successful content/data reads by other methods; CivicPlus, DOL and WBZ also restricted that check. The source text used in the briefs was available through the web research service. These statuses are reachability observations, not claim-validation counts.

Reproduce just this pass with `python3 knowledge/sources/scripts/check_research_links.py --glob '09_*.md' --glob '10_*.md' --glob '11_*.md' --output creative_link_audit.json`. The default command still checks all knowledge Markdown and writes the original `link_audit.json` filename.

## Evidence reviewed beyond the link check

The deep research brief records three YouTube caption sources with timestamped notes: a government-AI evaluation workshop, selected State of the Schools passages, and the full short Innovation Expo promo. These were text-caption reviews, not independently verified audio transcriptions. The City's official speech and award pages were used to check names and claims.

The City Expo's 34-page poster collection was text-extracted. BidBot, disability access, and mattress-collection posters were also rendered and visually inspected. Their quantitative results remain source-reported, with evaluation limits recorded in document 06.

The October 1 WBUR audio was not independently transcribed. A subsequent rodent-specific pass identified the official October 23 hearing recording and read four caption windows; see document 12 and `rodent_hearing_caption_audit.json`. This does not validate the complete third-party AI summary or amount to a fully verified transcript.

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
