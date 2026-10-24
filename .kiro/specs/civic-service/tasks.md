# Tasks — <Feature Name>

> Derived from `design.md`. Check off as you go. Each task is small and verifiable.
> Keep the demo path working after every task.

- [ ] 1. Scaffold the app (chosen stack), running dev server, empty `AppShell`.
- [ ] 2. Add the committed snapshot `src/data/snapshot.json` with a real cited
      source (name, url, retrieved date). Pull from `data/civic/`.
- [ ] 3. Build `StepFlow` + `Question` with next/back and inline validation.
      - Unit tests for validation and transitions.
- [ ] 4. Build `EvidenceCard`; wire each stated fact to its visible citation.
- [ ] 5. Build `ReviewScreen` — the single human decision point (no auto-submit).
- [ ] 6. Build `ResultOutput` — ready-to-use output from the answers.
- [ ] 7. Accessibility pass: landmarks, focus management, labels, AA contrast.
- [ ] 8. E2E happy-path test (intake → confirm → output).
- [ ] 9. Write `docs/submission/` description + Kiro usage write-up; record demo.
- [ ] 10. Final check against `.kiro/specs/<this-folder>/requirements.md`.
