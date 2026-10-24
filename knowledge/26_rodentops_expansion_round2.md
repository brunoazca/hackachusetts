# RodentOps expansion, round 2: new data, complaints and government signals

Research date: **October 24, 2026**. This doc adds **only material not already in**
[document 24 (data/research catalog)](24_rodentops_data_and_research_catalog.md) or
[document 25 (government and public voices)](25_rodentops_government_and_public_voices.md).
It does not restate the 311 yearly tables, RentSmart, Public Works violations, food
inspections, Cambridge sensors, NYC `p937-wjvj`, the NOAA Logan probe, the academic
set already catalogued, BRAP, the participatory-budgeting pilot, the 2026 Rat Summit,
or the Oct 23 2026 Council hearing. Those stand as written.

Verification levels follow doc 24: **direct-probe**, **source-read**, **lead**.
Nothing below was fetched into the repo; counts quoted from third parties are the
third party's, dated, and marked.

## 1. Three fronts, one line each

- **Data:** the real new seams are the **BWSC catch-basin/stormwater network** (harborage + flushing), **MA rodenticide law** (what an inspector may lawfully recommend), **Boston City Council dockets by number** (the live policy debate), and the **311 public ticket pages** (narrative + closure + inspector, per address).
- **Complaints:** the strongest net-new complaint source is not a new Reddit thread — it is **311.boston.gov/tickets**, a browsable per-ticket feed with named streets, resolution notes and the assigned inspector's email.
- **Government:** NYC now has a **quantified, district-level containerization outcome** (a method benchmark Boston can borrow honestly), and Boston's own debate is concrete in **named dockets** and a **statewide rodenticide amendment**.

## 2. Data sources not yet in doc 24

### A. Stormwater and catch basins — the harborage layer we were missing

Doc 24 lists the BWSC *rainfall* interface and flags it as unresolved. It does **not**
list the drainage network itself. Rats nest and travel in sewers and catch basins;
BRAP explicitly covers sewer work. This is a real driver layer.

| Source | URL | Access | New signal | Caveat | Level |
|---|---|---|---|---|---|
| BWSC catch-basins map | [bwsc.org/.../catch-basins-map](https://www.bwsc.org/environment-education/maproom/catch-basins-map) | Web map (ArcGIS behind it); no documented open CSV/API | Location of **30,000+ catch basins** and **600 miles of storm drain / 250+ outfalls** — candidate harborage/travel nodes near a chronic address | Map viewer, not a confirmed bulk download. CRS, licence and an export path all unresolved. Ownership split: "storm drains owned and activities performed by others" | lead |
| BWSC combined-sewer map | [bwsc.org/.../maproom](https://www.bwsc.org/environment-education/maproom) | Web map | Combined-sewer segments that carry both waste and stormwater | Same export/licence gap | lead |
| BWSC Stormwater Management Report 2025 | [PDF](https://www.bwsc.org/sites/default/files/2026-02/BWSC%20Stormwater%20Management%20Report%202025.pdf) | PDF | Illicit-discharge investigations, subcatchment prioritisation — where the system is already being worked | Prose/tables, not a dataset; annual | source-read |

**Use:** show nearby catch basins / combined-sewer segments as *context and an
inspection question* ("is there a basin within X m that should be checked/flushed?"),
never as a claimed rat path. **Do not** invent basin condition — BWSC condition and
cleaning logs are not established as public (this is the doc-24 §9 "current
sewer/catch-basin condition" gap, now with a concrete owner to ask: BWSC).

### B. Massachusetts rodenticide law — the legal envelope around any recommendation

Entirely absent from docs 24/25. It bounds what RodentOps may lawfully *suggest* and
why prevention (not poison) is the defensible frame.

- **SGARs** (brodifacoum, bromadiolone, difenacoum, difethialone): personal use already
  barred statewide; **licensed applicators only**, tracing to the EPA 2008 risk-mitigation
  decision, not a standalone state ban. ([Mass.gov wildlife & rodenticide](https://www.mass.gov/info-details/wildlife-and-rodenticide); secondary explainer [animalofthings.com, Oct 15 2026](https://animalofthings.com/rat-poison-laws-in-massachusetts/) — secondary, verify against MDAR.) **source-read / secondary**
- **333 CMR 13.08:** indoor bait in accessible areas must be in a tamper-resistant,
  secured station; applicator name, phone and date must be on the station. **source-read**
- **Home-rule wave:** ~18 cities/towns have filed or plan to file petitions to restrict
  rodenticides on private property. Verifiable examples in the 194th General Court:
  Salem [H4091/H5217](https://malegislature.gov/Bills/194/H5217.pdf), Bedford
  [H4917](https://malegislature.gov/Bills/194/H4917.pdf), Chelmsford
  [H4972](https://malegislature.gov/Bills/194/H4972.pdf), Nahant
  [H5570](https://malegislature.gov/Bills/194/H5570.pdf). **source-read**
- **Statewide:** the Senate unanimously adopted an **April 2026** amendment to an
  environmental bond bill letting any city/town restrict anticoagulants; **still needed
  House approval** as of mid-2026. Related: **S.2721/H.965** would end AR registration
  absent a public-health emergency. **source-read / status-pending**
- **Why it is pitch-relevant:** 6 MA bald eagles killed by rodenticide 2021–Jul 2026
  ([MassLive via MSN](https://www.msn.com/en-us/news/us/6-bald-eagles-dead-from-rodenticide-mass-advocates-demand-statewide-rat-poison-ban/ar-AA290CYJ)) is the political engine behind the bans. **secondary**

**Design consequence:** RodentOps should never draft a poison recommendation. Its lawful
lane is prevention, exclusion, sanitation and *referral to a licensed applicator* — which
is exactly the honest, human-in-the-loop framing already chosen.

### C. 311 public ticket pages — per-address narrative + closure + inspector

Doc 24 has the 311 *datastore* tables. It does **not** note that Boston also serves a
**human-readable ticket feed** with the free-text story, the closure note, and the
assigned inspector's email.

- Search: [`311.boston.gov/tickets?filter[search]=rats`](https://311.boston.gov/tickets?filter[search]=rats) — also `rat <street>`.
- Per-ticket pages, e.g. [`/tickets/101006749506`](https://311.boston.gov/tickets/101006749506).
- **New signal:** the exact evidence-card content RodentOps wants — reported condition,
  action text, resolution, and an accountable role — already rendered per case.
- **Caveat:** these pages carry **PII** (addresses, sometimes caller detail, staff emails).
  This is the doc-24/25 redaction rule made concrete: keep source IDs and links for
  provenance; strip names, phones and staff emails before any public screen or model call.
- **Level:** direct-probe (search surfaced live 2025–2026 tickets).

### D. BRAP Photographic Overview — the City's own site-selection method

New vs. doc 25's BRAP references. [BRAP Photo Overview PDF (Jul 2024)](https://www.boston.gov/sites/default/files/file/2024/07/BRAP%20Photo%20Final_2.pdf)
states the project "statistically select[ed] and assess[ed] those areas... representative
of the neighborhoods that have filed multiple rat complaints." **Use:** a defensible,
City-authored precedent for *representative-site sampling* — supports RodentOps' "pick a
few chronic sites" scope over a citywide predictive map. **source-read**

## 3. Government / mayor — concrete policy objects

### Boston City Council: the debate has docket numbers

Docs 25 mention the Oct 23 hearing but not the standing containerization record. These
are the live legislative objects (search Boston Legistar / boston.gov):

| Docket | What it is | Named sponsors (as surfaced) | Status |
|---|---|---|---|
| **2025-1448** | Hearing order: **same-day pickup of non-containerized residential waste + commercial-trash containerization**; notes state sanitary law bars non-containerized street waste but the City "does not enforce" it | — (2025) | hearing order (plan, not law) |
| **2025-0316** | **Waste Containerization Hearing Order** | Louijeune, Coletta Zapata, Fitzgerald, Flynn, Murphy, Santana, Weber, Worrell, Fernandes Anderson | hearing order |
| **2022-1328** | Downtown household **containerization pilot** hearing; invites PWD, New Urban Mechanics, ISD | Bok, Louijeune, Flynn, Flaherty (et al.) | hearing order |
| **2023-0443** | **Trash Contracts** | — | hearing order |

Sources: [2025-1448 PDF](https://boston.gov/sites/default/files/file/2025/08/2025%20Hearing%20Order%20Same-Day%20Pickup%20Non-Containerized%20Residential%20Waste%20and%20Containerization%20For%20Commercial%20Trash.pdf),
[2025-0316 Legistar](http://boston.legistar.com/View.ashx?GUID=DAC69A8B-65B3-44E7-830B-9EB14FC703C9&ID=13699300&M=F),
[2022-1328 Legistar](http://boston.legistar.com/View.ashx?GUID=1D55CD2B-E1C8-43B1-BC9B-65285F4E496D&ID=11355068&M=F).
A hearing **order** schedules a hearing; it is not an enacted ordinance. Do not present
any of these as settled law. **source-read.** Boston Legistar is itself a net-new,
queryable source for every future rodent/trash docket.

### The enforcement gap, stated by the City itself

Docket 2025-1448's own text: state sanitary law prohibits non-containerized street
waste, "the City does not enforce this ban, meaning bins are not effectively required
throughout Boston." That is an official admission of a containerization/enforcement gap —
the strongest single policy hook for a trash↔rat tool. **source-read**

### NYC: a quantified method benchmark (not Boston ground truth)

Doc 24 has NYC's inspection schema; it lacks the **outcome**. Reported figures:

- NYC rat **sightings down ~22%** in the first 7 months of 2026 vs. 2025, attributed to
  **containerization + narrowed trash set-out window** ([Guardian, Aug 8 2026](https://www.theguardian.com/us-news/2026/aug/08/new-york-city-rats-trash-bins), citing Bloomberg).
- **Not uniform:** West Harlem (fully containerized since Jun 2025) **−34%**; parts of
  Dumbo/Brooklyn Heights **−48%**; but East Village/LES/Chinatown **+37%** (a few problem
  addresses on E 5th St and Broome St drove it). ([Guardian](https://www.theguardian.com/us-news/2026/aug/08/new-york-city-rats-trash-bins);
  [NY Post via MSN](https://www.msn.com/en-us/money/general/trendy-nyc-nabe-sees-37-surge-in-rat-sightings-in-2026-even-as-reports-dip-citywide/ar-AA27Skcn))
- Commercial + low-density residential (~70% of trash) required to containerize in 2024;
  full containerization targeted **2031**. NYC DOHMH publishes a **statutory semiannual
  Rat Mitigation Zone report** (NYC Admin Code §17-133.3) — [portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/data-features/rat-report/), [example PDF](https://www.nyc.gov/assets/doh/downloads/pdf/rats/rmz-annual-report-jan-june-2023.pdf).

**Use honestly:** NYC shows that *containerization + set-out timing* moves the reported
numbers, and that **a few addresses can reverse a whole district's trend** — which is the
exact chronic-address thesis behind RodentOps. **Do not** port NYC's percentages to Boston
or imply RodentOps would reproduce them. **secondary, dated.**

## 4. Complaints — net-new, with named locations

The richest net-new complaint source is the **311 ticket feed** (§2C). Real 2025–2026
examples it surfaced (quote, do not treat as representative; **PII present — redact**):

| Location | Grievance (short quote / paraphrase) | Closure signal |
|---|---|---|
| **5–7 Pratt St, Allston** | "has had a rat problem for years... holes borrowed through dirt... see rats within a period of 1 to 3 hours" | "Will issue abatement for pest control as needed" (inspector) |
| **25 Range Rd, Dorchester** | dead rodent "crawling slowly on the sidewalk" | Resolved |
| **125 Boylston St (Boston Common)** | "Sick bloody rat... near the water fountain next to the rangers station" | — |
| rear alley near **Speedwell St** | third-floor window trash-bag dumping "left on the side for rodents" | — |
| (address withheld) | "reported to PWD CE several times and been cited **but rodent issue persists**" | shows closure≠resolution directly |
| near a **city-owned park** | "excessive amount of rats... due to long term presence of trash within 10–15 feet of city-owned park" | — |

These are individual public tickets, not a survey. They are **demo gold**: each is a real
"closed but came back" or "cited but persists" card with a named block and an accountable
role — exactly RodentOps' evidence timeline. **direct-probe.**

**Channel gaps this pass:** no new verifiable Reddit/Universal Hub thread beyond those in
doc 25 was confirmed; TikTok/X remain unverified. A gap is not evidence of no complaints.

## 5. What to actually add to the build

Ranked, all honest and in-scope:

1. **311 ticket evidence cards (redacted):** pull the human ticket page per chronic
   address for the demo timeline; strip PII, keep the link. *Biggest, cheapest win.*
2. **Legal lane guard:** RodentOps only proposes prevention/exclusion/sanitation/referral;
   it **cannot** draft a rodenticide recommendation (MA SGAR law, 333 CMR 13.08). Encode
   this as a hard rule beside the existing honesty guards.
3. **Policy context panel:** show the relevant Council docket (2025-1448 / 2025-0316) and
   the "City does not enforce containerization" admission next to a trash-driven case.
4. **Catch-basin context (optional, labelled lead):** nearest BWSC basin/combined-sewer
   segment as an inspection question, never a claimed path; condition unknown → ask BWSC.
5. **Benchmark framing for the pitch:** cite NYC's containerization result as *why the
   trash lever matters* and *why chronic addresses dominate* — explicitly as NYC, not Boston.

## 6. Honesty carries over

Every doc-24 §10 correction still holds. Added for this round:

- A hearing **order** is a scheduled debate, not an ordinance; the rodenticide amendment
  **passed the Senate only** and awaited the House. Do not present either as law.
- NYC percentages are **NYC's**, dated, third-party-reported, and uneven by district.
  They motivate the design; they are not a Boston projection.
- 311 ticket pages contain PII. Provenance link + source ID yes; names, phones, staff
  emails no. Never send an unredacted ticket narrative to an external model.
- Catch-basin locations are harborage *candidates*; basin condition/cleaning data is not
  established as public. Ask BWSC; do not invent it.

## 7. Sources added this round

Boston: [311 ticket search](https://311.boston.gov/tickets?filter[search]=rats),
[BWSC catch-basin map](https://www.bwsc.org/environment-education/maproom/catch-basins-map),
[BWSC maproom](https://www.bwsc.org/environment-education/maproom),
[BWSC Stormwater Report 2025](https://www.bwsc.org/sites/default/files/2026-02/BWSC%20Stormwater%20Management%20Report%202025.pdf),
[BRAP Photo Overview](https://www.boston.gov/sites/default/files/file/2024/07/BRAP%20Photo%20Final_2.pdf),
Council dockets 2025-1448 / 2025-0316 / 2022-1328 / 2023-0443 (links in §3), Boston Legistar.
MA law: [Mass.gov rodenticide](https://www.mass.gov/info-details/wildlife-and-rodenticide),
bills [H5217](https://malegislature.gov/Bills/194/H5217.pdf) /
[H4917](https://malegislature.gov/Bills/194/H4917.pdf) /
[H4972](https://malegislature.gov/Bills/194/H4972.pdf) /
[H5570](https://malegislature.gov/Bills/194/H5570.pdf).
NYC benchmark: [Guardian Aug 8 2026](https://www.theguardian.com/us-news/2026/aug/08/new-york-city-rats-trash-bins),
[RMZ portal](https://a816-dohbesp.nyc.gov/IndicatorPublic/data-features/rat-report/),
[RMZ report PDF](https://www.nyc.gov/assets/doh/downloads/pdf/rats/rmz-annual-report-jan-june-2023.pdf).

All counts are dated third-party observations unless marked direct-probe. No raw records,
full PDFs or ticket narratives are redistributed by this document.
