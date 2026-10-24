# Research: why Piper looked AI-made, and what we changed (v2.0.0)

Date: Oct 24, 2026. Asked by Guilherme after v1 read as "too AI-ish" and "not much color".

## What the sources say

| Source | Finding |
|---|---|
| [vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells/blob/main/skill/references/tells.md) (3.2M Reddit posts, 125 "why do AI sites look the same" threads) | The 2026 tell is the "tasteful default": **cream background + editorial serif + muted accent**. It reads as AI because "nobody chose it, the model did." |
| [frontend-craft slop tells](https://github.com/nattergabriel/frontend-craft/blob/main/skills/frontend-craft/references/slop-tells.md) | "The 2022 set (purple, glass, neon-on-black) gave way to the 2026 set (cream, editorial serif, restraint)." |
| [human-craft design slop taxonomy](https://github.com/sovit79/human-craft/blob/master/.claude/skills/humanize-design/references/design-slop-taxonomy.md) | "Timid, evenly-distributed palette with no dominant color" is a tell. Fix: pull color from a real source (print, culture, the brand's actual world). |
| [saasui.design, 7 tells](https://www.saasui.design/blog/saas-ui-looks-ai-generated) | Everything is a card and every card weighs the same; perfectly even spacing; default components untouched. Fix: one thing on the screen wins; tight inside groups, loose between them. |
| [visily, "less generic"](https://www.visily.ai/blog/how-to-make-ai-designs-less-generic) | Rounded cards, soft shadows, a stat row on top, one accent color: the generic shape. |

## Piper v1 against those tells

| Tell | v1 had it? |
|---|---|
| Cream background + editorial serif (Bone + Bodoni) | Yes — exactly the 2026 tell |
| Dark + glass + glow | Partly (glass kept, glow removed in v1.1) |
| Muted, evenly spread palette | Yes — soot, bone, brass; almost no color |
| Everything a rounded card, equal weight | Yes — stat cards, callout cards, chips |
| Marketing copy inside a tool ("Follow the rats.") | Yes |
| Long walls of text (closure notes in mono) | Yes — the site panel |

## What v2 does instead

1. **Color from a real, local source: the MBTA map.** Red (rats, returns), Orange
   (trash, warnings), Green (held / what worked), Blue (forecast, water). Category
   icons keep their own colors. Boston already reads these colors every day.
2. **No editorial serif.** Headlines are Atkinson Hyperlegible Next bold. The
   accessibility font is the one typeface; Bodoni is gone.
3. **Neutral surfaces, not cream.** Night = cool charcoal, Bone = near-white gray.
   Water is blue, parks faintly green, roads white on light.
4. **Ink buttons.** The primary action is black-on-light / white-on-dark, like
   transit signage, not a brand-colored pill.
5. **Small radii (2–8 px), no soft shadows, fewer cards.** Numbers sit in one
   divided strip, not four boxes.
6. **The answer first, the detail on demand.** The site panel leads with "Came back
   20 times after 26 closures", shows a dot timeline, top 5 drivers, last 5 actions
   with notes cut to one line, and "Show all" for the rest.
7. **Panels collapse.** Layers, Site queue and the right panel fold into small tabs
   (`]` toggles the right panel) so the map gets the room.
8. **Glass stays, by decision.** Guilherme likes the frosted panels over the map.
   It is the one flourish we keep on purpose, with no glow and a hairline border.
9. **One theme engine for the whole app.** Tailwind's neutral / red / amber /
   emerald scales are mapped to Piper tokens in `web/src/styles/piper.css`, so the
   team's components follow Night/Bone without being rewritten.

The mockup in `docs/design/mockup/` still shows v1 visuals; the live app on
`feat/piper-ui` is the v2 reference until the mockup is regenerated.
