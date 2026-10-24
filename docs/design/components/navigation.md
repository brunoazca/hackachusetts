# Navigation

Part of the [Piper design standards](../README.md).

### Command bar (⌘K)
- Trigger in TopBar: 560 × 40, `panel` glass, radius 12, placeholder
  "Search a street, ZIP, or ask Piper…", `kbd` ⌘K at right (mono 11, 20 h, radius
  6, 1 px edge).
- Open: centered at top 96, 640 w, max-h 480, scrim. Input 52 h, `text-body`.
- Sections: **Places** (rows 40 h: glyph, name, mono meta), **Sites**,
  **Ask Piper** (row "Ask: <query>" with Line Rat icon). Arrow keys move, Enter
  runs, Esc closes. `role="combobox"` + `listbox`.

### Lens rail
- Panel 264 w. Header: "Lenses" `text-title` + collapse button.
- Groups (eyebrow labels): RAT SIGNALS · DRIVERS · FORECAST · CONTEXT · FILTERS.
- Row 40 h: glyph/swatch 16 · label `text-ui` · count mono 12 `fg-3` right ·
  switch. Whole row toggles; switch is the visual.
- Filters: date segmented (30d · 90d · 1y · All · Custom), status segmented (Open ·
  Closed · All), city segmented (Boston · Cambridge · Somerville · All).
- Legend lives inline: each row's swatch *is* the legend.
- Collapsed 56 w: glyphs only, tooltips with label + count.

### Timeline scrubber
Panel 112 h, padding 12 16.
- Left: Play/Pause icon button 36 · week label mono 13 (`Wk 38 · Sep 15–21`).
- Chart: weekly bars (`fg-3` @ 60%, returns stacked in `return`), temperature
  hairline `ash` 1 px, event ticks (`move-out` mono 10 + 1 px `accent` line).
- Window: brass 1 px brackets with 12 × 24 handles; selected range bg `accent` @ 8%.
- Buttons ◀ ▶ step a week; date inputs in a popover (drag alternative, 2.5.7).
- `role="slider"` per handle with `aria-valuetext` = dates.

### Keyboard

| Key | Action |
|---|---|
| ⌘K / Ctrl K, `/` | Command bar |
| `L` | Jump to features-in-view list |
| `[` / `]` | Collapse rail / right panel |
| `J` / `K` | Next / previous site in top 10 |
| `I` `A` `F` | Inspect / Ask / Findings tab |
| Space | Play / pause timeline |
| ← / → | Step a week (timeline focused) / pan (map focused) |
| `+` / `−` | Zoom |
| `T` | Toggle Night / Bone |
| `Esc` | Close top-most (⌘K → sheet → selection) |
| `?` | Shortcut sheet |

Single-key shortcuts are off while typing and can be turned off (WCAG 2.1.4).
