# Claude Code prompt for the Why Piper motion graphic

Copy the prompt below into Claude Code with the Piper repository open. It specifies a complete 24-second motion graphic explaining why Piper exists, using the current product positioning and visual identity. The animation should work as a standalone introduction or the opening of a product demo.

---

You are the motion designer, art director, and creative developer for Piper. Build the actual animation described below, inspect the rendered result, and refine it. Deliver editable source, a working browser preview, and a rendered video when the available environment supports it. Do not finish with only a treatment, storyboard, or implementation plan.

## Objective and audience

Create a **24-second, modern, sleek motion graphic explaining why Piper exists**. The audience is a hackathon judge or first-time viewer who has never seen the product. Within one viewing, they should understand the problem, Piper's contribution, and who uses it.

The central message is:

> A closed rodent case does not establish that the reported condition was resolved. Piper brings repeated reports, recorded responses, and nearby records together so Boston inspectors can decide where to investigate.

Use one continuous visual story: **a report → a recorded closure → another report at the same place → scattered records → a coherent place review → Piper**.

Make the piece feel precise, calm, contemporary, and carefully composed. Its quality should come from typography, spacing, visual continuity, and deliberate timing. The main visual transformation is the moment scattered records become useful context for an inspector.

## Repository context and source priority

Locate the Piper repository. In the current workspace it is the `hackachusetts` directory. Read applicable repository instructions before editing. Inspect these files when present:

1. `README.md`, `docs/submission/description.md`, and `docs/submission/demo-script.md` for the current product and completed workflow.
2. `web/src/styles/piper.css`, `web/src/app/layout.tsx`, and `docs/design/tokens/tokens.json` for current visual tokens and typography.
3. `web/src/components/brand/PiperLogo.tsx`, `PiperLogo.css`, and `LineRat.tsx` in that same directory for the actual logo geometry and lockup.
4. `docs/design/foundations/motion.md` for relevant motion principles.
5. `docs/submission/motion-graphics-from-scratch-claude.md` for additional production guidance.

The older brand document and long video script contain earlier art direction and proposed features. Use the current README and current-build demo script for product claims. Use the current CSS and logo implementation for appearance. Do not revive the old brass-and-bone palette or use Bodoni headlines because an earlier document specifies them.

Keep all new work in `docs/submission/why-piper/`. Preserve existing prompts, demo videos, application code, and unrelated local changes. Reuse resources without changing the product. This task is to create a separate animation; no deployment or database access is required.

## Product meaning and factual boundaries

Piper helps Boston rodent inspectors review a place and its supporting public records. Its completed workflow includes repeated reports, report and closure history, recorded responses, nearby context, and an inspection brief.

Use these meanings consistently:

- A dot represents a **report**, never a rat or an estimated population.
- A hollow marker represents a recorded closed case, never proof that a location is clear.
- A coral ring indicates another report at the same place after a closure in the illustrative sequence.
- A neutral connector groups records for review. It does not establish causation, rat movement, or treatment effectiveness.
- Piper organizes evidence. The inspector makes the decision.

Use a clearly illustrative sequence with no fabricated statistics, real addresses, case identifiers, or exact dates. Show the small, legible label **“Illustrative sequence”** during the diagram scenes. Do not present an abstract street diagram as a geographically accurate map.

Do not add claims about eliminating rats, finding their proven source, preventing outbreaks, saving a measured amount of money, or outperforming a city response. Do not invent a live feed, automated dispatch, completed work-order approval, or AI recommendation. A return report alone does not prove that treatment failed. Nearby records provide context rather than a proven cause.

## Format and composition

- Duration: exactly **24 seconds**.
- Design canvas: **1920 × 1080**, 16:9.
- Master delivery: **30 fps**, 720 frames.
- Default version: silent, fully understandable through visuals and on-screen copy.
- Optional narration: supply the script below as text; do not make audio generation a prerequisite.
- Browser preview: scale the entire stage uniformly with letterboxing. Preserve designed line breaks.
- Important-content margins: at least 120 px horizontally and 80 px vertically.
- Keep the lower 100 px available for the illustrative label and optional captions; avoid conflicts with the diagram.

Use a stable composition: headline in the upper-left region, the diagram occupying the center and lower-right, and one persistent place marker carried through the first four scenes. Reserve a centered composition for the final logo.

Keep about a third of the frame as quiet space. Show one dominant sentence at a time. Avoid dashboards, toolbars, dense tables, decorative badges, and clusters of equally weighted cards.

## Visual identity

Use the current Piper night palette, centralized as named tokens:

| Role | Color |
|---|---|
| Background | `#111315` |
| Record surface | `#181B1E` |
| Primary text and report marks | `#F2F3F1` |
| Secondary text | `#AEB5BC` |
| Quiet structural lines | `#2F353B` |
| Essential diagram outlines | `#68717A` |
| Recurrence accent and logo pipe | `#FF5A4E` |

Keep recurrence coral distinct from neutral document organization. Do not introduce green success checks or blue forecast elements into this story. Use the low-contrast structural token only for decoration; meaningful boundaries need the stronger outline token.

Typography:

- Headlines: **Atkinson Hyperlegible Next**, weight 600–700, approximately 92–112 px, line-height 1.05–1.12, restrained negative tracking.
- Supporting copy: the same family, 42–48 px.
- Diagram labels: the same family, 36–40 px, sentence case.
- Use Atkinson Hyperlegible Mono only where an actual data label benefits from it.
- The current Piper wordmark uses **Fraunces italic, weight 600**. Preserve that exception in the logo only.

Reuse locally available fonts where possible. For the final portable artifact, bundle permitted local font files and preserve their licensing. If the brand fonts are unavailable, use a deliberate system fallback for the working draft and identify the substitution in the README. Do not silently depend on a font CDN at playback time.

Reproduce the current logo from its editable SVG geometry, CSS transforms, and wordmark placement. Do not substitute a generic rat icon or redraw a different mascot. If reimplementing the lockup outside React, preserve the rat, pipe, three holes, proportions, and optical positioning.

Use crisp vector lines, compact 6–8 px record corners, and restrained depth. Avoid gradients, glow, grain, glass blur, 3D mockups, stock footage, photographs, imported illustrations, confetti, and decorative particles.

## Exact storyboard and copy

Treat these as five connected beats, not five independent slides. Preserve the same place and report identities through transitions. Use half-open time intervals so no frame belongs ambiguously to two scenes.

| Time | Frames | On-screen headline | Main visual | Settled reading interval |
|---|---|---|---|---|
| 0.0–4.0 s | 0–119 | **A case can close.** | A report appears at one place, then its record becomes closed. | Approximately 2.0–3.8 s |
| 4.0–8.0 s | 120–239 | **Reports can return.** | A new report appears at the same place while the earlier closure remains visible. | Approximately 5.8–7.8 s |
| 8.0–13.0 s | 240–389 | **The history is scattered.** | Related records separate into three clearly labeled groups. | Approximately 10.3–12.8 s |
| 13.0–20.0 s | 390–599 | **Piper brings it together.** | The same records align into one place review with a readable history and nearby context. | Approximately 16.8–19.8 s |
| 20.0–24.0 s | 600–719 | **Piper** in its existing logo lockup | A shared line leads into the logo; the closing tagline settles. | 21.8–24.0 s |

### Scene 1 from 0 to 4 seconds

Start directly on the dark stage; do not spend a second fading up from black. Reveal the small context label **“Boston · Rodent reports”**, then the headline. The headline should be fully legible by 0.6 seconds.

Draw a very simple block outline with one fixed place marker. Introduce a report symbol with the label **“Report received”**. Extend a short timeline and add a distinct hollow marker labeled **“Case closed”**.

Do not make the place disappear, turn green, or receive a success tick. Closing a record changes its administrative state; the place stays on screen.

### Scene 2 from 4 to 8 seconds

Keep the place marker fixed. Extend the timeline rightward. A second report appears beside the same place, and one thin coral ring draws around the place marker. Reveal **“New report”** at the new timeline point.

Keep the earlier **“Case closed”** marker visible so the viewer understands the sequence without narration. Do not imply that the later report is necessarily the same animal or the same unresolved condition.

Use one controlled ring expansion, then stop. No persistent alarm pulse. Let the word **“return”** carry a coral accent if it improves emphasis; the remaining headline stays neutral.

### Scene 3 from 8 to 13 seconds

Retain the place marker as the visual anchor. The timeline expands into three separated evidence groups labeled:

- **Reports**
- **Recorded responses**
- **Nearby records**

Use original vector document strips and short lines. Preserve the recognizable report and closure marks in their appropriate groups. Add nearby-record geometry as contextual material, without addresses or invented factual content.

The separation should communicate the effort required to assemble context. Use deliberate alignment and spatial separation rather than chaos, spinning cards, or a tangled network. Keep every label readable.

### Scene 4 from 13 to 20 seconds

This is the signature transformation. With the place marker still recognizable, the three groups travel along clear paths into a single organized composition. Reports and responses share a timeline; nearby records occupy an adjacent context area. Retain their category labels and distinct meanings.

The resulting composition is an explanatory diagram, not a fabricated screenshot of a shipped interface. It should show one place and the records relevant to reviewing it. Keep the report after closure visible; organization does not make it vanish.

Sequence attention: place anchor → report and response alignment → nearby context → supporting line.

Once the composition settles, show **“Evidence for the next inspection.”** under the headline. By 16.8 seconds, all essential labels and the supporting line should be settled. Hold them through 19.8 seconds.

No automated decision, recommended treatment, resolved badge, or dispatch confirmation appears. The benefit is clearer evidence for human investigation.

### Scene 5 from 20 to 24 seconds

Let the diagram's neutral baseline continue into the pipe baseline of the existing logo through a precise alignment or match cut. Fade the evidence marks before introducing the logo's coral accent so data symbols do not become implied outcome claims.

Reveal the existing rat mark and wordmark. Keep the logo large enough for the rat and pipe holes to remain clear at smaller playback sizes. If drawing the mark produces tangled intermediate geometry, use a restrained mask reveal instead.

Closing copy:

**Piper** — existing logo lockup

**Follow the rats.**

Optional small descriptor, only if the layout remains clean: **“Rodent report intelligence for Boston.”**

Settle the full lockup by 21.8 seconds and hold it through the final frame. End on the logo, without a fade to black. Do not add a sign-up button, invented URL, or extra slogan.

## Optional voiceover script

The silent graphic is the required version. Save this narration as an optional companion script, with the scene timings above:

> A closed rodent case doesn't tell the whole story.
>
> Reports can return to the same place.
>
> Reports, responses, and nearby records sit in different places.
>
> Piper brings them together, so inspectors can review the evidence and decide where to investigate.
>
> Piper. Follow the rats.

Use a calm, conversational delivery with natural pauses. If narration is supplied later, synchronize captions to the actual audio. Do not fabricate a finished voiceover or claim audio was rendered when only a script exists.

## Motion system

Use one controlled motion vocabulary. Values below are production settings for this film:

| Action | Duration | Behavior |
|---|---|---|
| Headline entrance | 450–550 ms | Phrase-level mask or opacity plus 20–28 px vertical movement |
| Label entrance | 250–350 ms | Opacity plus 8–16 px movement |
| Report arrival | 300–400 ms | Small scale from 0.94 to 1 and opacity |
| Timeline or ring draw | 650–900 ms | Path-length-aware stroke reveal |
| Record organization | 850–1100 ms per related move | Smooth travel, no overshoot |
| Related-item stagger | 60–90 ms | Reading order, total stagger under 400 ms |
| Exit | 200–350 ms | Faster than entrance |

Use `cubic-bezier(0.16, 1, 0.3, 1)` for arrivals, `cubic-bezier(0.65, 0, 0.35, 1)` for travel, and `cubic-bezier(0.4, 0, 1, 1)` for exits. Use a proper easing implementation; evaluating the Bézier y polynomial at raw time is not equivalent to solving the easing curve.

Animate transform and opacity on DOM elements and stroke reveal on SVG paths. Keep layout dimensions fixed. No typewriter effects, per-letter spinning, bouncing, elastic text, blur animation, camera shake, or continuous drifting.

Keep the camera fixed by default. A single restrained reframing may help scene 4, but it must finish before the reading hold. Keep headlines outside any moving diagram container.

Budget the reading hold after the last important label has settled. Preserve object identity and location at scene boundaries. Inspect intermediate frames, not just the five finished compositions.

## Implementation and playback

Prefer a standalone HTML, SVG, CSS, and JavaScript artifact with local assets. If an existing rendering setup is already available and appropriate, reuse it. Choose one implementation path and avoid adding a framework solely for this clip.

Create every graphic from editable text, vector paths, or procedural geometry. Build the scene once and derive its complete visible state from absolute time. Keep copy, visual tokens, scene boundaries, and keyframes centralized and easy to edit.

Expose a working browser control interface:

```js
window.piperFilm = {
  duration: 24,
  fps: 30,
  ready: /* Promise that resolves after fonts, assets, and scene setup */,
  seek(seconds) { /* pause and render the complete state at this time */ },
  play() { /* continue from the current position */ },
  pause() { /* stop the playback clock */ },
  restart() { /* return to zero and play */ },
  setReducedMotion(enabled) { /* select the accessible preview mode */ }
};
```

Implement every method; the comments above are specifications, not finished code. Seeking backward, forward, or repeatedly to the same time must give the correct scene without depending on earlier playback. Avoid independent timers and accumulated animation state. If randomness is necessary, seed it.

Provide play/pause, restart, a scrubber, and a reduced-motion toggle outside the capture area, with keyboard labels and visible focus. Do not intercept arrow keys while an input is focused. Stop at the end rather than looping automatically.

Support:

- `?t=13.5` to load and pause at a specific time.
- `?capture=1&t=13.5` to render a clean frame with playback controls hidden.
- `?static=1` to show a legible static summary with the core message and organized diagram.
- `prefers-reduced-motion: reduce`, defaulting to the static summary or manually selected still scenes; explicit user action may start playback.

The static mode must communicate the problem and Piper's role, not merely display an isolated logo. Include a plain-text transcript outside the visual stage for accessibility.

## Deliverables

Create the following within `docs/submission/why-piper/`:

1. `index.html` with the editable animation and browser preview; use small adjacent source files if needed.
2. `assets/` for any local fonts and their licenses.
3. `README.md` with exact preview and rendering commands, scene timings, source locations, and any remaining limitation.
4. `voiceover.txt` containing the optional script.
5. `stills/` containing representative rendered frames from each beat and at least two intermediate transition frames.
6. `why-piper.mp4` when a working renderer is available: 1920 × 1080, 30 fps, 24 seconds, H.264, broadly compatible pixel format, and no playback chrome.
7. A reproducible render script when exporting video.

For deterministic frame capture, await `window.piperFilm.ready`, pause playback, and render frame `f` at `f / 30` seconds for `f = 0…719`. Do not approximate timing through arbitrary delays between screenshots. Confirm the actual output dimensions, frame count, frame rate, and duration.

If an exporter is unavailable, complete the browser artifact, stills, and documented rendering path, then state the precise export limitation. Do not create an empty video file or claim the MP4 exists.

## Build and review workflow

Proceed autonomously through these steps:

1. Read the source files and identify the current logo, fonts, and available rendering tools.
2. Build representative still compositions for the opening, the organized review, and the closing lockup. Inspect spacing, hierarchy, and readability.
3. Implement the complete 24-second sequence and verify object continuity before adding polish.
4. Render and inspect frames around 2.8, 6.5, 10.8, 13.5, 15.5, 18.0, 20.7, and 23.0 seconds.
5. Watch the entire animation at normal speed, both at full size and approximately 960 × 540. Simplify anything that feels rushed or illegible.
6. Check arbitrary backward and forward seeks, restart, pause, static mode, local font loading, and capture mode. Check for console errors and missing assets.
7. Correct the largest visual weaknesses, then export and inspect the actual video if supported.

The result is ready when a viewer can explain the sequence without narration: a case closed, another report appeared, related records were scattered, and Piper brought them together for an inspector's review. All essential copy must remain readable, all transitions must preserve meaning, and the final logo must have a quiet hold.

When finished, report the preview location, editable source, video export status, and checks actually performed. Keep the completion message short. Start building now.
