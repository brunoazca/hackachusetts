# Design — <Feature Name>

> Fill in once requirements are approved. Design serves the requirements;
> keep it concrete enough that `tasks.md` can be derived from it.
> Everything in `<angle brackets>` is a blank to fill.

## Overview
A single-page guided flow: intake → evidence-backed guidance → review →
ready-to-use output. All data from a committed snapshot; no live calls on the
demo path.

## Architecture
- Frontend: <TBD — e.g. Vite + React + TypeScript>
- State: a small step-machine (current step, answers, validation).
- Data: `src/data/snapshot.json` — the authoritative facts/rules + source
  metadata (`source_name`, `source_url`, `retrieved_date`).
- No backend required for the demo.

## Components (sketch — rename to your flow)
- `AppShell` — layout, skip-to-content link, focus management.
- `StepFlow` — renders the current step, handles next/back, validation.
- `Question` — one labeled input with inline error.
- `EvidenceCard` — a stated fact plus its visible citation.
- `ReviewScreen` — summary + the single human confirm action.
- `ResultOutput` — the ready-to-use output.

## Data model (snapshot)
```json
{
  "service": "<slug>",
  "source": { "name": "<source name>", "url": "<source url>", "retrieved_date": "<YYYY-MM-DD>" },
  "steps": [
    { "id": "<id>", "question": "<text>", "type": "<input type>", "required": true, "help": "<hint>" }
  ],
  "facts": [
    { "id": "<id>", "text": "<stated fact>", "source_ref": "<source id>" }
  ]
}
```

## Accessibility plan
- Semantic landmarks (`header`/`main`/`nav`), one `h1`.
- Focus moves to the step heading on each step change.
- Errors use `aria-describedby`; focus order follows DOM order.
- Verify AA contrast on all text/controls.

## Error handling
- Empty required field → inline labeled error, advance blocked.
- Missing snapshot entry → safe fallback message, never a blank screen.
- A claim the data cannot support → shown as "not supported by the data".

## Testing strategy
- Unit: validation, step-machine transitions, any deterministic calculation.
- E2E: one full happy-path run (intake → confirm → output).
