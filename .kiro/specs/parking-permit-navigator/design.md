# Design — Parking Permit Navigator

> Fill in once requirements are approved. Design serves the requirements above;
> keep it concrete enough that tasks.md can be derived from it.

## Overview
A single-page guided flow: intake → evidence-backed guidance → review →
ready-to-use output. All data from a committed snapshot; no live calls on the
demo path.

## Architecture
- Frontend: _TBD (e.g. Vite + React + TypeScript)_
- State: a small step-machine (current step, answers, validation).
- Data: `src/data/snapshot.json` — the authoritative rules + source metadata
  (`source_url`, `source_name`, `retrieved_date`).
- No backend required for the demo.

## Components (sketch)
- `AppShell` — layout, skip-to-content link, focus management.
- `StepFlow` — renders the current step, handles next/back, validation.
- `Question` — one labeled input with inline error.
- `EvidenceCard` — a stated rule plus its visible citation.
- `ReviewScreen` — summary + the single human confirm action.
- `ResultOutput` — the ready-to-use checklist / draft.

## Data model (snapshot)
```json
{
  "service": "boston-moving-truck-parking",
  "source": { "name": "", "url": "", "retrieved_date": "" },
  "steps": [
    { "id": "", "question": "", "type": "", "required": true, "help": "" }
  ],
  "rules": [
    { "id": "", "text": "", "source_ref": "" }
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

## Testing strategy
- Unit: validation, step-machine transitions.
- E2E: one full happy-path run (intake → confirm → output).
