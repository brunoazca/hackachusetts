---
inclusion: always
---

# Structure — repo layout and where things live

```
hackachusetts/
├── .kiro/
│   ├── steering/      # Always-on guidance for Kiro (this folder)
│   ├── specs/         # One folder per feature: requirements, design, tasks
│   ├── hooks/         # Agent hooks (automation on file events / manual)
│   ├── agents/        # Custom agent configs
│   └── settings/      # CLI + MCP settings
├── knowledge/         # Research briefs (rules, strategy, past winners)
├── src/               # Application code (create when stack is chosen)
├── docs/
│   └── submission/    # Description, Kiro usage write-up, demo script
└── README.md          # Public-facing: what it is, how to run, Kiro usage
```

## Conventions
- Specs drive features. New feature => new folder in `.kiro/specs/<feature>/`.
- Steering docs are short and current. Stale guidance misleads the agent.
- `knowledge/` is read-only research context, not code.
- `docs/submission/` is the source of truth for everything the judges read.

## Naming
- Spec folders: kebab-case, named by outcome (e.g. `block-brief`, `notice-to-action`).
- Branches: `feat/<short>`, `fix/<short>`.
