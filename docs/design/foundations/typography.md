# Typography

Part of the [Piper design standards](../README.md).

## The rules

1. **Three families, three jobs.** Bodoni Moda says the point. Atkinson
   Hyperlegible Next says everything else. Atkinson Hyperlegible Mono is the record.
2. **Bodoni is rationed.** One Bodoni line per panel, 28 px or larger, upright
   (italic only in the wordmark), never in a control, never for numbers in a table.
3. **Body is 16 px.** Readers include inspectors over 50 on a phone in the sun.
   14 px for controls and rows, 13 px for helper text, 11 px for eyebrows only.
4. **Numbers are mono and tabular** wherever they sit beside other numbers or
   change in place (count-ups, timelines, tables).
5. **Sentence case everywhere.** No all-caps labels, no letter-spaced eyebrows.
6. **Measure:** body ≤ 64ch; a 400 px panel holds about 44ch.

### Families

| Token | Family | Load (next/font/google) | Use |
|---|---|---|---|
| `font-display` | Bodoni Moda | `Bodoni_Moda({ subsets:["latin"], style:["italic","normal"], axes:["opsz"], variable:"--font-bodoni" })` | headlines ≥ 28 px only |
| `font-sans` | Atkinson Hyperlegible Next | `Atkinson_Hyperlegible_Next({ subsets:["latin","latin-ext"], variable:"--font-atkinson" })` | all UI and body |
| `font-mono` | Atkinson Hyperlegible Mono | `Atkinson_Hyperlegible_Mono({ subsets:["latin"], variable:"--font-atkinson-mono" })` | ids, dates, sources, counts, labels |

All three are variable fonts on Google Fonts (checked Oct 24). Fallbacks:
Didot/Georgia, system-ui, ui-monospace. Chinese text falls back to the OS CJK face.

### Scale

| Token | Family | Size / LH | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `text-hero` | display | 64 / 64 | 500 | −0.02em | intro, end card, big numbers |
| `text-headline` | display | 36 / 40 | 500 | −0.015em | Dossier headline, Findings headline |
| `text-headline-sm` | display | 28 / 32 | 500 | −0.01em | phone headline, work-order title |
| `text-title` | sans | 18 / 26 | 600 | −0.005em | panel titles, card titles |
| `text-body` | sans | 16 / 24 | 400 | 0 | default body |
| `text-ui` | sans | 14 / 20 | 500 | 0 | buttons, list rows, inputs |
| `text-small` | sans | 13 / 18 | 400 | 0 | helper text, captions |
| `text-eyebrow` | sans | 12 / 16 | 500 | 0 | section labels ("Return timeline", "Chronic site · 3 of 10") |
| `text-data` | mono | 13 / 20 | 400 | 0, `tabular-nums` | dates, ids, counts |
| `text-data-lg` | mono | 20 / 24 | 500 | −0.01em, tabular | stat values in cards |

Rules:
- Bodoni never below 28 px, never in controls, one Bodoni line per panel.
- Body copy max width 64ch. Panels hold ~44ch at 400 px.
- Numbers that are records → mono. Numbers that are the point → Bodoni (`9 came back` at hero size only on the intro; in the Dossier the 9 is `text-data-lg` in `return`).
- `font-optical-sizing: auto` on Bodoni.
- Text never all-caps outside `text-eyebrow`.

## Pairing examples

| Context | Eyebrow | Headline | Support | Record |
|---|---|---|---|---|
| Dossier | `SPECIMEN 03 · 02121` | *Monitored eleven times.* | `9 came back` (ui, `return`) | `16 · 9 · 58%` (data-lg) |
| Finding | `FINDING 01 · WHAT WORKED` | *These records do not establish which response works better.* | question (small, `fg-2`) | `Risk ratio 1.03 · 95% CI 0.89–1.20` (data) |
| Work order | `WO-2026-1024-003` | *Work order — Normandy St* (headline-sm) | labels (eyebrow) | values (data) |

## Writing headlines

Bodoni headlines are **claims about conditions, under 7 words, ending with a
period**: *Monitored eleven times.* / *Quiet since June.* / *Next door is the
source.* / *Rain: no association detected.* No questions, no puns, never about residents.
