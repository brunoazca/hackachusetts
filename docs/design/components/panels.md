# Panels

Part of the [Piper design standards](../README.md).

## Dossier (InspectorPanel)
Panel 400 w, padding 20, scroll body, sticky header.

1. **Header (sticky)**: specimen label · close (Esc) · prev/next site (J/K).
2. **Headline**: `text-headline` display italic, max 2 lines. Pattern:
   *Monitored eleven times.* / *Quiet since June.* / *Next door is the source.*
3. **Stat row**: 3 cells, `text-data-lg` value + `text-small` label:
   `16` reports · `9` came back (`return`) · `<p>%` chance in 60 days (`forecast`).
4. **Return timeline** (below).
5. **Two voices** (below).
6. **What feeds it**: driver chips + building facts (mono list:
   `built 1910 · 3 units · not owner-occupied`) + vacant-lot flag with "Show the
   Tune" toggle.
7. **Next 60 days**: probability bar (below).
8. **Recommended** (below) — 1 to 3 action cards.
9. **Sources** footer: all source chips + `updated` line.

Nothing selected → **This week's 10**: rows 56 h: rank (mono 20 `fg-3`), street
(`text-ui` 600), meta (mono 12: `16 reports · 9 back`), mini ring glyph with ring
count; Within-neighborhood toggle at top.

## Return timeline
Height 72. Mono date axis (`text-eyebrow`, 3–5 ticks). Each report = 8 px dot
(open/closed style); return = vermilion dot + ring; under each closure a 9 px tall
action tick with tag in a tooltip (`monitoring`, `baiting`, `violation`…). A thin
`return` arc connects a closure to the report that came back after it. Keyboard:
the timeline is a list of buttons, ←/→ moves between reports.

## Two voices
Two columns (stack < 360 w). Left: eyebrow `RESIDENT`, quote in `text-body`
`fg`, 2 px `fg` left rule. Right: eyebrow `CITY · CLOSED <date>`, note in mono 13
`fg-2`, 2 px `fg-3` left rule. Max 3 lines each, "More" expands. Text is
scrubbed of names and house numbers; raw note behind Reveal.

## Probability bar
Height 8, radius pill, track `card`, fill `forecast` hatched; value mono 13 at
right; caption `text-small` `fg-3`: "Model estimate · backtested" (or "Baseline · mean of last 4 weeks", R6.6).

## Action card
`card`, radius 14, padding 16, 1 px `line`.
- Eyebrow: owner agency (`ISD · CODE ENFORCEMENT`).
- Title `text-title`: "Review nearby records before the next visit".
- Because: `text-small` `fg-2`: "Reports followed earlier closures. Nearby records warrant field review." + source chips.
- Actions row: **Approve** (primary md) · Edit (secondary md) · Reject (ghost md).
- Approved state: border `held`, check + "Approved · follow up Dec 23" mono,
  "View work order". Rejected: collapsed to one line, `fg-3`, Undo.
- Escalation actions show a 2 px `return` left rule.

## Private field (reveal)
Inline block, height matches text. Blurred placeholder (fake glyphs, `filter:
blur(6px)`, never the real value in DOM) + eye icon button 28 × 28 `aria-label="Reveal
owner name (logged)"`. After reveal: value + mono `revealed · logged 13:42`.

## Findings card (InsightsPanel)
`card`, radius 14, padding 20, gap 12.
Eyebrow (`FINDING 01 · WHAT WORKED`) · `text-headline` (*These records do not establish which response works better.*) · one-sentence question `text-body` `fg-2` · chart 160 ·
stat row mono (e.g. `Risk ratio 1.03 · 95% CI 0.89–1.20`) + strength chip · caveat `text-small`
`fg-3` · sources. Click "Show on map" sets lenses. Null findings same layout,
headline e.g. *Rain: no association detected.*

## Ask (ChatPanel)
- Replaces Dossier content (tab: Inspect · Ask · Findings at top of right panel,
  segmented, 32 h).
- User message: right-aligned bubble, `card`, radius 14 (4 on corner), `text-body`.
- Piper message: no bubble; Line Rat 16 px avatar; `text-body`; feature and
  source chips inline after paragraphs.
- Tool ticker: mono 12 `fg-3`, each step `→ looked up 16 reports on Normandy St`,
  collapses into `4 steps · 1.2 s` (click to expand).
- Composer: 48 h min, grows to 160, `card`, radius 12, 1 px `edge`, send button
  primary sm. Starter questions as feature-style chips above the composer.
- Not configured state: card with "Assistant not configured" + what still works.
- `aria-live="polite"` on the answer region; steps announced on completion.
