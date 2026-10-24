# Beat 4 Animation Prompt (paste into Claude)

Paste everything inside the code fence below into Claude.

---

```
You are generating a single, self-contained animated visual that tells one true
civic-data story for a hackathon demo video. Read every instruction before you
write code. Output ONLY the finished artifact and a one-paragraph note on how to
run it.

## Assumptions (I am stating these because the target format was left open)
- Deliverable: a SINGLE self-contained HTML file. All CSS and JS inline, no build
  step, no external network requests, no CDN links, no image assets. It must open
  by double-clicking the file.
- Animation tech: hand-rolled CSS keyframe animations + inline SVG, orchestrated
  by the Web Animations API or a tiny vanilla-JS timeline. No React, no GSAP, no
  Lottie, no npm. (If you judge a <canvas> approach clearly better for one scene,
  you may use canvas for that scene only, still inside the one file.)
- It will be screen-recorded at 1920x1080 for a demo video, so design for that
  exact frame. It must also degrade gracefully if the window is smaller.
- Fonts: system font stack only (-apple-system, Segoe UI, Roboto, sans-serif).
  No web fonts.

## What this is
A 30–40 second looping-capable animation for the "data reveal" beat of a product
demo. The product is **Rat Audit Boston**: a live map of every rat-related signal
in Boston that helps a city rodent inspector see what is really driving rats at a
chronic site and decide the next action. This animation is the emotional climax —
it must make a viewer feel the futility of the city's current approach and the
"aha" of the real cause.

## PRIVACY — non-negotiable, enforce it in the output
- BLOCK LEVEL ONLY. The on-screen location label is exactly: **"Normandy St ·
  Dorchester 02121"**. Never show a house number. Never show any person's name,
  owner name, or staff name. Never invent one.
- This is an owner-occupied home; treat the data with civic seriousness, not mockery.
- The only text that may appear is from the approved data points listed below.

## The true story (source of every data point — do not add facts)
In 2025–2026 one block in Dorchester generated **18 separate rodent reports**.
The city responded and CLOSED each case within days — then it was reported again.
The city escalated through its entire enforcement ladder and the rats still came
back, because the real harborage is the **vacant lot next door** (a parcel classed
"RES LAND (Unusable)"), plus illegal dumping and dead-animal pickups within ~100 m.

Citywide frame (use as opening context, large numbers):
- 5,321 rodent reports in Boston in 2026 — already more than all of 2025.
- 99% of cases are marked "closed."
- Yet 407 addresses got a NEW report 30+ days after an earlier one.
- Across Boston's 46 chronic addresses (5+ reports), 237 of ~280 recorded actions
  were just "monitoring"; only 14 were violations. Monitoring does not reduce
  recurrence — escalation does.

The escalation ladder at THIS block, in order (each is a real 311 closure action):
1. Area inspector monitoring (2025-03)
2. Inspector asks landlord to clear overgrown foliage in rear (2025-08)
3. Citation issued for overgrown weeds (2025-08)
4. Violation issued by code enforcement (2025-08)
5. Ticket issued by code-enforcement officer (2025-09)
6. Inspector confirmed rodent activity → abatement order (2025-10)
7. Violation issued; placed in for collections (2025-10)
8. Referred to code enforcement for trash issues (2025-11)
9. Violation issued to owners of the ADJACENT LOT (2025-12)
10. Rodent activity reported AGAIN (2026-01) … and AGAIN (2026-06)

Nearby drivers within ~100 m (2025 311): Illegal Dumping ×6, Improper Trash
Storage (barrels) ×3, Pick up Dead Animal ×4, Poor Conditions of Property ×4,
Rodent Activity at neighboring addresses ×4, and the adjacent vacant lot ×1.

## Narrative arc & emotional beats (make the viewer FEEL this)
1. SCALE → the city number is huge and rising. (unease)
2. THE PROMISE → "99% closed." Looks like success. (false relief)
3. THE CATCH → "407 came back." The number cracks. (doubt)
4. ZOOM TO ONE BLOCK → 18 pins pile onto one spot over a year. (recognition)
5. THE LADDER → the city climbs every enforcement rung, each case closing… then
   reopening. Build rhythm: close, reopen, close, reopen, escalate. (mounting
   frustration / futility)
6. THE REVEAL → the camera/eye finally widens one parcel over: the vacant lot next
   door lights up as the true source, dumping and dead-animal markers around it.
   (the aha — "they were fixing the wrong parcel")
7. THE REFRAME → text resolves: "A block problem, not an address problem." The
   whole exploded card COLLAPSES smoothly back into a SINGLE map pin. (resolution,
   hands the baton to the live product)

## Visual style, pacing, tone
- Aesthetic: sleek, modern, YC-demo / data-journalism. Think NYT-graphics meets a
  dark product dashboard. Confident, minimal, purposeful motion — not cartoonish.
- Palette: dark slate background (#0e1116-ish). One restrained accent for "signal"
  (a warm amber/orange for rodent reports), a cooler tone for city actions
  (muted blue/teal), and a single alarming highlight (red) reserved ONLY for the
  recurrence and the vacant-lot reveal. Define everything as CSS custom properties.
- Typography: big, tight numeric counters for the stats; small-caps or uppercase
  mono-ish labels for the enforcement steps; generous whitespace.
- Motion: ease-in-out, nothing bounces gratuitously. Numbers count up. Pins drop
  with a soft stagger. The escalation ladder advances step-by-step with a steady,
  slightly quickening cadence to build tension. The final collapse is one smooth,
  satisfying transform.
- Respect `prefers-reduced-motion: reduce` — provide a near-static fallback that
  still reads as the full story (fade/opacity only, no large transforms).
- Include a subtle restart/replay control and auto-stop at the end (do not loop
  forever on its own unless replay is pressed); because it exceeds a few seconds,
  a visible pause/replay affordance is required.

## Scene-by-scene spec (map each data point to a moment)
Target ~32s total. Timings are a guide; tune for readability.
- Scene 1 (0.0–4.0s): Full-bleed counter animates 0 → "5,321 rodent reports ·
  2026." Subtitle fades in: "More than all of 2025." Dark, quiet.
- Scene 2 (4.0–7.0s): Big "99% closed" stamps in, reassuring green tick. Hold.
- Scene 3 (7.0–11.0s): The green cracks — "but 407 addresses came back" slides up
  in red; the 99% visually destabilizes (shake/desaturate).
- Scene 4 (11.0–16.0s): Transition to a stylized block tile labeled "Normandy St ·
  Dorchester 02121". 18 amber report pins drop one-by-one with a running counter
  "1…18", stamped with their month (2025-03 … 2026-06). They stack on ONE spot.
- Scene 5 (16.0–25.0s): The enforcement ladder — a vertical/edge list reveals the
  10 steps in order (monitoring → foliage → weeds citation → violation → ticket →
  abatement order → collections → trash referral → adjacent-lot violation). After
  each city action, show the case "CLOSED" then a beat later a new amber pin
  "REPORTED AGAIN." Cadence quickens. Convey: the city did everything.
- Scene 6 (25.0–29.0s): The frame widens by one parcel. The ADJACENT vacant lot
  ignites in red, labeled "Vacant lot · RES LAND (Unusable)." Small markers bloom
  around it: "Illegal dumping ×6", "Dead animal ×4", "Improper trash ×3". A line
  connects them to the chronic spot. Text: "The real driver was next door."
- Scene 7 (29.0–32.0s): Everything eases together and COLLAPSES into a single map
  pin on a minimal map silhouette. Caption resolves: "A block problem, not an
  address problem." Then a quiet tagline line: "Rat Audit Boston." Hold on the pin.

## Accessibility & correctness
- Every number and label on screen must match the data above EXACTLY. Do not round
  5,321 to 5,300, do not change 18, 407, 46, 237, 14. Do not invent dates beyond
  those listed.
- Provide an aria-live region announcing each scene's headline for screen readers,
  and a visually-hidden text summary of the full story at the end of the DOM.
- Ensure WCAG AA contrast for all text on the dark background.

## Output
Return ONE complete `.html` file in a single code block, then a 2–3 sentence note
on how to record it (open in a browser, hit replay, screen-record the 1920x1080
region). Nothing else.
```
