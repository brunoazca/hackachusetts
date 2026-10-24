# Overlays and feedback

Part of the [Piper design standards](../README.md).

## Work order sheet
- Always Bone theme. 640 w (desktop) / full width (phone), radius 20 top, padding
  32, `shadow-sheet`, rises from bottom over a scrim.
- Header: Line Rat mark + `Piper` wordmark (brass-deep), right: mono
  `WO-2026-1024-003`.
- Title `text-headline-sm`: *Work order — Normandy St, 02121*.
- Fields grid (2 col), label eyebrow + value mono: Site · Action · Owner agency ·
  Evidence (3 bullets with sources) · Follow-up date · Inspector note (editable
  textarea).
- Rules: 1 px `line` between rows (ledger feel).
- **Seal**: 72 px circle, `seal` fill, bone mono 9 text on a circular path
  `DRAFT · FOR INSPECTOR USE ·`, Line Rat at center. Bottom-right, rotated −8°.
- Footer: Print (primary), Copy text (secondary), Close (ghost). Print CSS: hides
  app, prints sheet only, black on white with seal outline.

## Live pill
Height 28, pill, `card` bg, 1 px `line`, padding 0 10, mono 12 `fg-2`.
Dot 6 px `return` with Live pulse. Text `Live · updated 4 min ago`; seeded data:
`Seeded · CSV snapshot Oct 24` with mink dot (R1.1). Click = Refresh popover
(last run, rows, button). `aria-live="polite"` on the time text, updates once
per minute.

## Toast
Bottom-center above timeline, 40 h, pill, `card`, `shadow-pop`, `text-ui`, 4 s,
pausable on hover/focus, `role="status"`.

## Empty, loading, error
- Empty: small Line Rat (bone line 40 px), `text-body` line, optional action. Copy:
  "No reports here in 90 days. That can also mean nobody reported."
- Loading: skeleton blocks in `card` with shimmer; map shows last data with a
  thin brass progress line under TopBar.
- Error: `danger` icon + plain sentence + Retry. DB down: map keeps basemap,
  banner "Can't reach the data. Showing nothing rather than old numbers." (R1.12)
- 404: the Beak silhouette, *"The doctor couldn't find this page."*

## Tooltip
`card`, radius 8, padding 6 10, `text-small`, `shadow-pop`, max 240 w. 300 ms
delay on hover, immediate on focus. `role="tooltip"`.
