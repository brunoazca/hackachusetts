# How We Used Kiro

> Required by the rules. Be specific — generic claims read as weak. Point at
> actual files in `.kiro/` and name concrete moments Kiro did the work.

## Spec-driven development
- `.kiro/specs/parking-permit-navigator/requirements.md` — EARS requirements.
- `.kiro/specs/parking-permit-navigator/design.md` — architecture + a11y plan.
- `.kiro/specs/parking-permit-navigator/tasks.md` — the task checklist Kiro executed.
- _<Add: which tasks Kiro implemented, with commit links.>_

## Steering
- `.kiro/steering/product.md`, `tech.md`, `structure.md` kept Kiro on-rubric on
  every change (community value, accessibility, human-in-the-loop, cited evidence).

## Agent hooks
- `.kiro/hooks/accessibility-check.kiro.hook` — reviews each saved UI file for
  the scored accessibility requirements automatically.
- `.kiro/hooks/demo-path-green.kiro.hook` — guards the demo happy path after edits.

## Custom agent
- `.kiro/agents/civic-judge.json` — a judge-style reviewer we ran against the
  build to find the biggest submission risk before it was too late.

## Concrete examples
- _<Prompt → what Kiro produced → how it shipped. 2–3 real moments.>_

## Honest limits
- _<Where we steered or corrected Kiro, and why. Honesty reads as rigor.>_
