# Tokens

Part of the [Piper design standards](../README.md).

`tokens.json` is the single source of truth. Three copies serve three runtimes
and are checked against it:

| Copy | Runtime | Kept in sync by |
|---|---|---|
| `web/src/styles/piper.css` | Tailwind v4 / CSS | hand mirror + drift check |
| `web/src/lib/design-tokens.ts` | MapLibre, Recharts, JS motion | hand mirror + drift check |
| `docs/design/mockup/tokens.css` | the mockup | **generated** with `--write` |

```
python3 scripts/check-design-tokens.py          # drift + contrast; exit 1 on problems
python3 scripts/check-design-tokens.py --write  # regenerate mockup tokens first
```

## Naming

- **Palette** names describe the material (`soot`, `bone`, `brass`, `vermilion`,
  `delft`, `verdigris`, `oxblood`, `mink`). They live only in token files.
- **Semantic** names describe the job: `bg`, `panel`, `card`, `line`, `edge`,
  `fg`, `fg-2`, `fg-3`, `accent(-fg|-hover|-press)`, `return`, `forecast`, `held`,
  `seal`, `danger`, `scrim`, `water`. Components use only these.
- Tailwind: `bg-card`, `text-fg-2`, `border-edge`, `text-return`, `rounded-lg`,
  `shadow-panel`, `ease-spring`, `text-headline`.
- CSS: `var(--p-<semantic>)`. TS: `semantic.night.fg2`, `themes.night.returned`, `motion.base`.

## Adding a token

Only when no existing token does the job. Name it by job, define both themes, add
a contrast pair to the script if it carries text, mirror it, run the check.
