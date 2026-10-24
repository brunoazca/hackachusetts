# Piper — complete Claude Code motion prompts

Paste **Prompt 1** into Claude Code with the workspace open. It creates all three clips as one visual system. After the first render, paste **Prompt 2** for a focused finishing pass. No placeholders need filling in.

These prompts adapt `motion-graphics-from-scratch-claude.md` to the final 2:58 shooting script. The user now explicitly requests fast pacing and spring animation. That overrides the older default against visible bounce for these standalone video graphics; the product UI is not being changed.

## Prompt 1 — create and render the complete motion package

```text
Act as the motion director, typographer, animation engineer, and editor for Piper's final hackathon film. BUILD THE ACTUAL ANIMATIONS. Deliver editable source, working previews, and rendered MP4 clips. Do not finish with a plan, storyboard, or code listing.

CREATIVE DIRECTION

The film should open like a sharp contemporary product title sequence: immediate, confident, fast, and expressive. Use physical spring arrivals, short anticipation, brisk exits, purposeful stagger, and transformations that carry the story. Give it an epic folklore moment through scale and composition, then resolve into precise civic-data design.

Fast pacing means decisive movement followed by readable holds. Do not make the viewer chase moving text. Shapes may overshoot slightly; important words settle cleanly. Every movement must finish.

THE TASK

Create THREE separate clips for an existing 2:58 film:

1. 01-opening.mp4: exactly 14.000 seconds, 420 frames at 30 fps. Insert at film time 0:00–0:14.
2. 02-context-bridge.mp4: exactly 5.000 seconds, 150 frames at 30 fps. Insert at film time 1:08–1:13.
3. 03-closing.mp4: exactly 8.000 seconds, 240 frames at 30 fps. Insert at film time 2:50–2:58.

All clips: 1920 × 1080, 16:9, 30 fps, H.264 MP4, yuv420p, opaque background, silent masters, no controls or watermarks in the export. Use a consistent frame rate across all deliverables. These are 27 seconds of animation placed in three parts of the longer film, not a 27-second opening.

News screenshots, product recordings, Kiro footage, and the narrator's audio are separate editorial assets. Do not fabricate or generate those. Supply a sound-cue sheet; audio generation is not needed to complete this task.

FIND THE PROJECT AND READ THE PREVIOUS GUIDE

The workspace may open above the repository. Use the directory containing web/src and docs/submission; in this workspace it is hackachusetts. Resolve all following paths from that repository root.

Read applicable AGENTS.md/CLAUDE.md instructions and these sources:

- docs/submission/motion-graphics-from-scratch-claude.md
- docs/submission/video-script-final.md
- docs/submission/why-piper-claude-prompt.md
- docs/submission/why-piper/README.md
- docs/submission/why-piper/film.js, film.css, index.html, render.mjs
- web/src/styles/piper.css
- web/src/components/brand/PiperLogo.tsx, PiperLogo.css, LineRat.tsx
- docs/design/foundations/motion.md
- docs/rat-audit/inspection-brief.md and docs/submission/kiro-usage.md for factual context if needed

Follow the previous master guide's original geometry, strong typography, shared anchors, deterministic time, seeking, reading holds, and render-inspect-refine process. This brief supersedes its generic duration and the old 24-second and 10-second opening briefs.

The human explicitly requests spring animation and fast pacing. For these VIDEO GRAPHICS, controlled geometric overshoot is authorized even though the older product motion guide defaults to no bounce. Keep this choice isolated to the film. Do not modify application motion or ask for approval to follow this supplied creative direction.

Write all new work inside docs/submission/final-film-motion/. Preserve existing application code, prompts, old motion exports, and unrelated local changes. Existing animation code is a reference and potential utility source, not a finished scene to stretch or speed up. Recompose these new clips for their specified timing.

ONE IMPLEMENTATION PATH

Use standalone HTML/SVG/CSS/JavaScript with explicit frame-time rendering. Reuse the existing local font assets and adapt the existing why-piper browser/Playwright/ffmpeg capture approach where available. Do not create a Next.js app, add a second animation framework, or depend on a CDN. Prefer the smallest working local implementation.

If the reference renderer or a dependency is unavailable, inspect the available local tooling and use a compatible equivalent. Complete the editable browser animations regardless. Report a specific export blocker only after completing everything that does not depend on it. Do not claim an MP4 exists unless it was rendered and inspected.

CENTRAL VISUAL IDEA

ONE LINE carries the entire story:

- In the hook it organizes a report, a recorded closure, and a later report.
- In the folklore passage it becomes the Piper's musical pipe.
- It then organizes an abstract modern street grid and resolves into Piper's actual identity.
- In the middle bridge it brings three types of evidence around one place.
- In the closing it becomes the actual pipe in the Piper logo again.

Use transformations of the same visible objects rather than disconnected slides. Reuse the same off-white line, coral accent, marker language, and text hierarchy across all three clips.

PRODUCT MEANING

Piper helps Boston inspectors review repeated rodent reports, recorded city responses, nearby context, and a downloadable inspection brief. An inspector decides what to investigate.

Data-diagram semantics:
- Filled off-white dot: a report.
- Hollow circle: a recorded closed case.
- Coral ring around a report mark: a later report in an illustrative sequence.
- Neutral connector: evidence grouped for review.
- Place marker: the location being reviewed.

These symbols are not a rat-population estimate, proof of treatment failure, proven cause, or measured rat movement. Show a legible “Illustrative sequence” label during abstract data diagrams. The folklore sequence is a clearly labeled legend with decorative animal silhouettes; keep that visual distinction clear.

No invented statistics, case numbers, dates, addresses, city endorsement, elimination claims, automated dispatch, approval/work-order UI, or simulated product screens. An abstract street grid is not a geographic map of Boston.

EXACT VISUAL IDENTITY

Match the current product rather than the superseded brass-and-bone identity:
- Background: #111315.
- Primary text / report marks: #F2F3F1.
- Secondary text: #AEB5BC.
- Structural lines: #2F353B, decorative use only.
- Meaningful diagram outlines: #68717A or brighter when needed.
- Recurrence accent and logo pipe: #FF5A4E.

Use Atkinson Hyperlegible Next, weight 600–700, for the film's main text. Use Fraunces italic 600 only for the actual Piper wordmark. Inspect and reuse the real SVG paths and CSS transforms in the brand components. Preserve the rat's proportions, its tail/pipe, the three holes, the wordmark's tracking and optical placement. Do not substitute a generic rat icon or redraw the brand from memory.

Use locally bundled fonts from the existing why-piper assets when suitable. Include their existing licenses. Wait for fonts before measuring text, drawing initial frames, or capturing anything.

Composition at 1920 × 1080:
- Safe margins: 120 px left/right, 80 px top.
- Reserve y=920–1060 for editorial captions. Do not put essential artwork there.
- Large hook: 132–160 px, deliberately broken lines if needed.
- Main scene phrases: 92–112 px.
- Supporting copy: 38–44 px.
- Evidence labels: 36–40 px.
- Illustrative/legend label: 28–32 px, readable contrast.
- Diagram strokes: generally 4–6 px at final resolution; preserve the actual logo's proportions.
- Fixed design-coordinate system, uniformly scaled in previews. No responsive rewrapping of the composition.

Use crisp vector forms, generous negative space, and one dominant focal point. No grain, glow, lens flare, floating particles, spinning globes, stock medieval illustrations, 3D device mockups, soft-focus text, or generic dashboard tiles. Make the animation distinctive through the line/pipe transformation and typography.

SPRING AND PACING SYSTEM

Implement actual deterministic damped spring motion, not a cubic-bezier renamed “spring.” Use a closed-form damped oscillator or an already available frame-deterministic spring implementation. Use zero initial velocity for a stationary entrance. If retargeting an object mid-motion, preserve its current position and velocity, or finish its current move before starting the next.

Define tokens centrally. These are starting settings for a second-order model expressed as natural frequency omega in radians/second and damping ratio zeta; they are NOT interchangeable library stiffness/damping values:

- shapeSnap: omega 22, zeta 0.72; controlled geometric arrival; roughly 4% maximum overshoot of travel distance; settle over approximately 0.55–0.70 s.
- smallPop: omega 28, zeta 0.68; report accents/pipe holes only; roughly 5–6% overshoot of travel distance; settle within approximately 0.45–0.55 s.
- heavyResolve: omega 18, zeta 0.86; major regrouping; almost no visible bounce; settle within approximately 0.65–0.80 s.
- textSettle: critically damped, omega 26; 24–40 px vertical travel; settle in approximately 0.40 s. No visible text bounce.

Measure the actual response and adjust to fit each shot. If using a mass/stiffness/damping engine, document conversion k=m*omega^2 and c=2*zeta*m*omega, and verify the engine's units. Do not paste values into an incompatible API.

Animate geometric scale from about 0.90–0.94 to 1.0. Any overshoot is relative to that small change, not permission to inflate the final object by another 6%. Keep positional overshoot under about 8 px for large readable marks. No rubbery repeated oscillation.

Other motion tokens:
- Anticipation: 2–3 frames, 4–8 px, reserved for the main transformation.
- Text arrival: about 12 frames, whole phrases or lines, masked with generous glyph clearance.
- Exits: 6–8 frames, accelerated departure, roughly 70% of equivalent entrance duration.
- Ordered stagger: 2 frames between related marks; 3 frames between the three pipe holes.
- Group stagger budget: no more than 12 frames before the last related object begins.
- Connector reveal: 10–18 frames, monotonic path-length-aware progress.
- Major identity transformation: 18–27 frames.
- Opacity: clamped monotonic 0–1; never spring opacity or color.
- Camera: non-bouncing, at most one intentional 1.0→1.08 or 1.10 push in a scene, then locked. No camera shake.

Use correctly evaluated ease-out/acceleration curves for effects that should not overshoot. For path reveals, synchronize a traveling endpoint to getPointAtLength(progress * length). Do not spring a path distance outside its valid range. Apply a spring to the arriving shape when appropriate, while the connector itself remains monotonic.

Clamp an animation to its exact endpoint only after position and velocity are sufficiently settled. Do not cut off a visible spring tail or normalize a large error into an endpoint snap. During designated holds, all meaning-bearing geometry and text must be completely stable.

There should be a clear focal change about every 1–2 seconds in the opening's active passages. That does not mean every element moves continuously. Exits, drawing, and arrivals can overlap by 2–4 frames when the relationship is clear. Let important phrases remain settled for roughly 1.5–3 seconds, with longer holds where specified.

CLIP 1: OPENING — 14 SECONDS / 420 FRAMES

Narration reference, supplied only as text:
0:00–0:04: “A closed case. The same place reported again.”
0:04–0:14: “Hamelin’s legend had a piper who led the rats away. We named ours Piper. For Boston, the way forward starts with evidence.”

The first frame must contain visible content. No fade from an empty black screen.

0.00–1.50 s / frames 0–44 — CLOSED
- Fixed headline at the upper-left, x=160, y≈170: “Closed.” Make the word immediately readable.
- In the lower central area, a filled report mark at approximately (560,610) and a hollow closure marker at (960,610) belong to the same horizontal record line.
- Start with the first mark visible. During the first 12–18 frames, finish the connecting line and give the hollow closure marker one small spring arrival.
- Small diagram labels: “Report” and “Closed”. Do not add a green success check.
- Place “Illustrative sequence” at x=160, y≈875, away from future subtitles.
- By about 0.55 seconds the composition is settled. Hold it.

1.50–3.80 s / frames 45–113 — REPORTED AGAIN
- A new report mark appears at about (1360,610), with a single coral ring settling around it.
- Continue the same line; do not reset the composition. This is later in the same illustrative history.
- Replace the hero phrase with “Reported again.” using a fast old-line exit and whole-phrase masked arrival. Keep the headline's left edge fixed.
- The coral ring makes one small spring settle; no endless expanding sonar rings.
- Label the third mark “New report”. Keep earlier marks visible so the relationship can be understood.
- Finish all important motion by approximately 2.15 seconds. Hold through 3.80 seconds.

3.80–4.30 s / frames 114–128 — TURN THE LINE INTO THE STORY
- Brief 2–3 frame anticipation on the shared line, then move that line toward a pipe silhouette.
- Fade data labels and the illustrative label as the data scene ends.
- Keep the line recognizable through the transition; use matching endpoints and mask reveals if path topology differs.
- Introduce a small “THE LEGEND” label. Do not imply real data marks have turned into rats.

4.30–7.20 s / frames 129–215 — A LEGEND
- Hero phrase: “A legend.”
- Draw an abstract storybook town from a few rooflines and a gate; about 5–7 structural lines, not a detailed medieval painting.
- Reuse the rat outline from the actual brand as up to three decorative silhouettes. Group them beneath the town outline.
- The pipe line leads toward the right. The silhouettes follow in a brisk, restrained stagger, with one gentle spring settle at their destination. No hopping, walking-cycle comedy, or multiplying rats.
- Keep most of the motion within the first 1.3 seconds of this scene. Let the resulting silhouette read for the remainder.
- A subtle non-bouncing camera push may increase scale from 1.0 to 1.08, stopping before the hold. Preserve the main focal point.
- This is the epic moment: large silhouette, clean negative space, decisive direction. Do not add fire, plague imagery, distressed textures, or horror effects.

7.20–10.60 s / frames 216–317 — A NEW PURPOSE
- Hero phrase becomes “A new purpose.” A small “BOSTON” label establishes the modern setting.
- The town roofline rearranges into an abstract modern street grid. Preserve several line segments so the transformation reads as connected rather than a scene replacement.
- Remove the decorative silhouettes. Introduce three clearly neutral evidence marks around one place marker.
- The pipe line becomes the organizing line of the evidence composition. It groups records; it does not depict rats moving through Boston.
- Add “Illustrative sequence” again when the abstract data diagram becomes visible.
- Use heavyResolve for the regrouping, followed by a completely still diagram.
- By approximately 8.70 seconds, the phrase and diagram should be settled. Hold until the next transition.

10.60–14.00 s / frames 318–419 — PIPER
- Resolve the organizing line into the actual pipe within Piper's logo. Match the pipe endpoint and direction, then draw the connected tail and rat outline.
- Reveal the three pipe holes in a 3-frame stagger using very small scale arrivals. Preserve their final circular geometry.
- Reveal the real Fraunces italic Piper wordmark without deforming the letters.
- The final lockup occupies about 620–700 px of width, optically centered rather than aligned solely by its bounding box.
- Supporting line: “Evidence for the next inspection.” in 40–44 px Atkinson, centered below the lockup.
- Remove the illustrative label as the diagram becomes a brand card.
- All main text should be settled by 11.50 seconds; all geometry should be settled by 11.70 seconds. Hold to the last frame at 13.9667 seconds.
- Leave the final composition clean for the editor's cut into the six-second news segment. Do not add a fade to black or a fake news card.

CLIP 2: CONTEXT BRIDGE — 5 SECONDS / 150 FRAMES

Film insertion: 1:08–1:13. Narration: “The useful question is what surrounds this repeated pattern.”

Purpose: explain why Piper brings different records around ONE selected place. This is the only full-screen motion interruption inside the product demo.

Expose anchorX and anchorY in config, defaulting to (960,560). These represent the selected place marker's editorial match position. Do not require a screenshot to build the clip. The editor can later align the real product crop to this anchor.

0.00–0.45 s / frames 0–13 — KEEP THE PLACE
- Frame zero contains the place marker, at the configured anchor, already fully visible.
- Use a neutral outlined location mark, not a new rat icon.
- Label “One place” near it, outside the marker.
- Camera remains locked throughout the entire clip.

0.45–1.20 s / frames 14–35 — THREE KINDS OF EVIDENCE
- Bring three compact, unboxed evidence groups into position: “Reports”, “Responses”, “Nearby records”.
- Default positions approximately (550,370), (1370,370), and (960,770), adjusted as a group if the anchor changes.
- Each group has one small neutral symbol and a 36–40 px label. Use a 2-frame stagger and shapeSnap on symbols; text uses textSettle.
- Draw neutral connectors toward the central place. Synchronize each connector endpoint with its reveal. No directional arrows implying a cause.
- Do not move the selected place marker.

1.20–2.10 s / frames 36–62 — ONE ORGANIZED VIEW
- Let the outer groups settle slightly inward, about 24–40 px, with heavyResolve; keep their labels separated.
- Use one subtle enclosing arc or open bracket to make the grouping legible. Avoid a fake app window or a large dashboard card.
- Reveal the main phrase at the upper-left: “One place. More context.”
- Keep “Illustrative sequence” visible at y≈875.
- Complete every important move by 2.10 seconds.

2.10–5.00 s / frames 63–149 — READABLE HOLD
- Hold the phrase, three labels, connectors, and place marker completely still for the remaining 2.9 seconds.
- The final frame must preserve the place marker's position for a clean match cut back to the product.
- No departing animation that steals the last reading interval. The film editor makes the cut.

CLIP 3: CLOSING — 8 SECONDS / 240 FRAMES

Film insertion: 2:50–2:58. Narration: “Piper. Follow the rats. Give Boston a clearer place to start.”

0.00–0.55 s / frames 0–16 — CONTINUE THE THREAD
- Begin with the same place-marker language and a short horizontal organizing line on the brand background.
- Use configurable anchor coordinates with the same defaults as the bridge. No screenshot is required.
- The line starts extending toward the final logo-pipe position. The marker diminishes as the brand transition begins.
- Keep this as a brief graphic transition, not a new explanatory data scene.

0.55–1.80 s / frames 17–53 — THE LINE BECOMES THE PIPE
- Transform the horizontal line into the exact pipe segment of the brand mark.
- Draw the connected tail and rat outline, preserving the actual logo geometry.
- The three pipe holes appear in a 3-frame stagger. Their tiny pop supplies the expressive spring detail.
- Keep the wordmark position reserved so nothing shifts when its glyphs appear.

1.80–3.20 s / frames 54–95 — THE NAME AND LINE
- Reveal the actual Piper wordmark using a masked 24 px upward arrival and monotonic opacity. No letter-by-letter typing.
- Reveal “Follow the rats.” beneath the lockup, whole phrase, 56–64 px, semibold.
- The lockup should feel substantial, about 700–780 px wide, with enough breathing room for the rat and italic overhang.
- A very slight shape spring may settle the graphic lockup; keep the wordmark readable and optically stable.

3.20–4.00 s / frames 96–119 — THE PURPOSE
- Reveal the smaller final line: “Evidence for the next inspection.” in 38–42 px.
- Finish every spring, fade, and stroke reveal before frame 120.
- Do not add a URL by default. Expose an optional empty footer field only for a later verified short URL. It must not consume space or show placeholder text when empty.

4.00–8.00 s / frames 120–239 — FOUR SECONDS OF STILLNESS
- Hold the complete final card pixel-still for exactly the last four seconds.
- No pulsing pipe, drifting camera, blinking cursor, shimmering letters, fade out, or music-dependent movement.
- The last encoded frame must contain the complete settled logo and both lines.

ENGINEERING CONTRACT

Construct the scene elements once. Derive every visible property from absolute clip-local time. Do not use playback-only insertion, independent timers, unseeded randomness, accumulated physics integration, or free-running CSS animations.

Centralize the timeline, copy, coordinates, spring tokens, anchor coordinates, and colors in editable files. Specify each event's start/end in integer frames. The storyboard lists inclusive visible frame ranges; implement each as [firstFrame, lastFrame + 1). Where a nominal beat time falls between frames, the listed integer frame range is authoritative. Render frame f at t=f/30; never export an extra frame at t=duration.

Expose a real API, for example window.piperMotion:
- ready: a promise that resolves only after fonts/assets/path measurements and first render are ready.
- clip: the active clip identifier.
- duration and fps.
- selectClip(id).
- seek(seconds): pause and render a complete state, forward or backward, in any order.
- play(), pause(), restart().
- setReducedMotion(boolean).

Provide a gallery/index with clip selector, play/pause, restart, scrubber, time/frame readout, and reduced-motion toggle. Keep controls outside the 1920 × 1080 stage. Stop playback at the final composition; do not loop by default.

Support ?clip=opening&t=4.2 for paused inspection and ?clip=opening&capture=1&t=4.2 for a clean capture. Use corresponding bridge/closing identifiers. Capture mode must explicitly select the full-motion film and not accidentally inherit the OS reduced-motion setting. Normal previews should respect that setting and provide a static-story alternative. Reserve keyboard shortcuts so they do not interfere with focused controls.

Measure SVG path lengths after initialization. For morphs, match topology and point ordering or use a shared primitive, mask, and brief overlap. Inspect intermediate geometry; never accept a tangle because the endpoints are correct. Keep mask padding generous for ascenders, descenders, and Fraunces italic overhang.

Reuse the current logo's SVG viewBox and wrapper arithmetic. Do not crop the rat, tail, or wordmark during anticipation or overshoot. Avoid changing DOM width/height/top/left every frame when a transform can achieve the movement. Render consistently at deviceScaleFactor=1 for the final 1920 × 1080 masters.

WORKFLOW: COMPLETE THE ARTIFACT

1. Inspect the sources and available renderer. Write a short treatment and exact event timeline to files, then proceed without waiting for approval.
2. Build three representative STILL COMPOSITIONS from editable code: opening recurrence, the three-record context bridge, and final brand card. Inspect at full size and 960 × 540 before polishing.
3. Build a rough animatic of all three clips. Check the narrative and timing. If a section is crowded, remove a decorative action rather than making text unreadably fast.
4. Polish the opening's first 8 seconds as the motion sample; tune the spring response and typography. Carry the same tokens into all clips.
5. Render all final clips and inspect the actual encoded MP4s, not just the HTML preview.
6. Repair concrete issues and rerender affected clips. Deliver the finished files and concise verification notes.

REQUIRED CHECKS

- Exact durations/frame counts: opening 420, bridge 150, closing 240 at 30 fps.
- Zero page errors and failed local asset requests; actual brand fonts loaded.
- Out-of-order seeks: late → early → middle → same middle. Compare rendered frames at the repeated timestamp for equality in the same environment.
- Direct seek into the middle of each transformation works without playing earlier scenes.
- Main copy is readable at 960 × 540 without pausing.
- No clipped glyphs, detached connectors, stretched circles, changing line weights, unexpected scene flashes, or endpoint snaps.
- First frame contains meaningful content; last frame contains the complete intended composition.
- Context bridge holds from frame 63; closing is pixel-still from frame 120 through frame 239.
- Inspect representative frames immediately before, during, and after each transition.
- Use ffprobe or equivalent to report codec, dimensions, fps, counted frames, duration, pixel format, and audio presence for actual outputs.
- Do not invent human-review feedback or claim perfect quality without describing what was checked.

DELIVERABLES INSIDE docs/submission/final-film-motion/

- index.html: preview gallery and controls.
- Editable scene code, styles, shared motion helpers, and configuration.
- assets/fonts/ with required font files and licenses.
- render.mjs or equivalent documented renderer.
- exports/01-opening.mp4.
- exports/02-context-bridge.mp4.
- exports/03-closing.mp4.
- review/: representative PNG frames and a labeled contact sheet, kept separate from exports.
- timeline.json: clip duration, film insertion time, fps, events, text, settling/hold windows.
- voiceover-reference.txt: the supplied narration text and timing only.
- sound-cues.md: sparse suggested cues with local timestamps, no claim that audio was produced.
- README.md: preview/render commands, edit points, actual output metadata, checks, and any unresolved limits.

Finish with direct paths to the THREE MP4 files, the preview, and a short factual verification summary. A clean, readable, fast spring-driven film is the deliverable. Continue through implementation, rendering, inspection, and corrections.
```

## Prompt 2 — inspect and finish the first render

```text
Do a final editorial and motion-quality pass on docs/submission/final-film-motion/. Inspect the existing editable source, timeline, and ACTUAL rendered MP4s before changing anything. Keep the concept and exact durations: 14 seconds, 5 seconds, 8 seconds at 30 fps. Preserve the current Piper identity and the exact approved copy.

The requested style is FAST, PRECISE, SPRING-DRIVEN. Improve weak passages by editing their timing and composition, not by adding more effects.

FIRST, DIAGNOSE WHAT IS ACTUALLY THERE

Watch each complete clip at normal speed and inspect at 1920 × 1080 and 960 × 540. Record concise observations with clip-local timecodes. Do not claim to have watched video if your tooling only exposed still frames; use a supported playback method where possible and disclose the limit otherwise.

Inspect these opening moments especially: 0.00, 0.50, 1.50, 2.15, 3.80, 4.30, 5.50, 7.20, 8.70, 10.60, 11.70, 13.9667 seconds. Inspect bridge frames around 0.45, 1.20, 2.10 and 4.9667 seconds. Inspect closing around 0.55, 1.80, 3.20, 4.00 and 7.9667 seconds. Add nearby samples if an overshoot or transition falls between them.

FIX ONLY OBSERVED PROBLEMS, IN THIS PRIORITY

1. COMPREHENSION. The hook must instantly read “Closed” then “Reported again.” The folklore passage must explain the name without becoming a medieval slideshow. The bridge must show three kinds of records around one stable place. The ending must resolve into the real Piper brand.

2. READING TIME. Measure each hold from the final settling frame of the last meaningful label. If words are moving through most of their scene, shorten the entrance or remove secondary choreography. Do not shorten the final four-second closing hold. Keep evidence labels visible together long enough to read.

3. SPRING QUALITY. Look for sluggish starts, wobble after arrival, positional overshoot that pushes elements out of alignment, and abrupt stops. Use one small geometric overshoot followed by a quick settle. Keep text critically damped and the camera non-bouncing. Inspect velocity continuity where one move becomes another. Do not replace real spring motion with an ease-out and still call it spring.

4. FOCAL HIERARCHY. Only one event should command attention at a time. Hold background geometry while the main text or transformation lands. If the piece feels flat, enlarge and clarify the main action or shorten a dead gap before adding visual decoration. Keep the full-screen bridge's camera locked.

5. LOGO FIDELITY. Compare the final still to the actual PiperLogo.tsx, PiperLogo.css, and LineRat.tsx geometry. Verify the rat/tail connection, three holes, wordmark size, italic overhang, baseline, and optical balance. The lockup must not drift as the wordmark appears.

6. TRANSITIONS. Inspect each intermediate SVG/mask state. Remove tangled morphs, fading duplicates, dislocated endpoints, and connector jumps. When a morph is unreliable, keep a shared line or contour and use a clean mask reveal. Preserve the intended anchor instead of forcing incompatible paths.

7. EXPORT. Check the encoded video itself for font substitution, missing assets, frame duplication caused by capture timing, clipped first/last frames, wrong fps, and unwanted controls. Fix actual causes and rerender only affected clips.

DO NOT

- Add new claims, metrics, dates, addresses, screens, or feature promises.
- Add a fake news page, product recording, or Kiro conversation.
- Add a looping pulse, particle field, glitch, camera shake, typing effect, or visual noise to make a quiet hold seem active.
- Alter application code, old exports, or unrelated files.
- Compress a clip to fix timing after rendering; correct the source timeline and render at its intended frame times.

FINAL VERIFICATION

Run deterministic backward/repeated-seek checks. Confirm all frames in the closing's last four seconds are visually identical in the source render. Confirm 420 / 150 / 240 encoded frames, 1920 × 1080, 30 fps, H.264, yuv420p, and silent audio state. Check the bridge's place anchor at the beginning and end. Review final master playback after any repair.

Update README.md with actual findings and fixes, and leave a short before/after note with timecodes. If there is no material problem, keep the good work and report that rather than changing it for the sake of change.

Deliver the final three MP4 paths and preview path. Do not stop after a critique; implement and verify necessary corrections.
```
