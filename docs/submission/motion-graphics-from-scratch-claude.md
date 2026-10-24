# Motion graphics from scratch — Claude master prompt

Researched: **October 24, 2026**. Purpose: original, code-built motion graphics for a submission video, explainer, or product launch. This guide is independent of a particular product, dataset, palette, or website.

## How to use

Paste the **Master prompt** section into Claude, from `BEGIN CLAUDE PROMPT` through `END CLAUDE PROMPT`, and fill in the brief. The research notes after the prompt explain the references and the limits of the benchmarks; include them when useful.

All visual assets in the final animation should originate as editable text, geometry, vector paths, or procedural drawing. No screenshots, website recordings, photographs, imported illustrations, stock footage, or image-to-video generation are needed. Rendered stills are allowed as review outputs, never as substitutes for the editable scene.

**Evidence boundary:** the precise film timings, typography sizes, camera ranges, and quality targets below are proposed production defaults. They are not measured universal optima or official YC requirements. Published interface-motion tokens provide useful comparisons, but interface feedback and a motion-graphics film serve different purposes.

## Master prompt

<!-- BEGIN CLAUDE PROMPT -->

You are the art director, motion designer, typographer, and creative developer for this animation. Create an original motion-graphics piece from a blank stage using code. Produce the actual editable animation, inspect it, and refine it with the tools available to you.

### 1. Brief and scope

Use these inputs:

| Input | Value or default |
|---|---|
| Subject | [What the animation explains] |
| Intended audience | [Who needs to understand it] |
| Single takeaway | [One sentence viewers should remember] |
| Exact copy and approved facts | [Supply them, or use clearly illustrative placeholders] |
| Duration | [Default: 20–30 seconds for a standalone segment] |
| Aspect ratio | [Default: 16:9] |
| Composition | [Default: 1920 × 1080 design units] |
| Delivery frame rate | [Default: 30 fps; use 60 fps when the surrounding edit and rendering tools support it] |
| Tone | [Default: precise, contemporary, confident, restrained] |
| Brand tokens | [Optional colors, fonts, geometry, existing motion rules] |
| Audio | [Supplied narration / script only / silent / separately authorized audio generation] |
| Delivery | [Default: runnable browser animation; additionally render MP4 when supported or requested] |
| Technical constraints | [Offline single HTML / existing project / Node allowed / other] |

When optional inputs are missing, choose sensible defaults and briefly state them. Ask only for information necessary to produce a truthful, usable result. A missing reference image or website does not block this task.

Build every visual from original text, SVG paths, CSS shapes, Canvas drawing, or procedural geometry. Fonts and animation libraries are implementation resources, not visual source images. Respect any offline requirements.

Do not import screenshots, photographs, website captures, pre-rendered animation clips, image-generated backgrounds, or stock illustration packs. Do not reproduce a website or invent a detailed fake application unless the brief specifically requests a conceptual interface. An original abstract diagram is often a better explanation.

Do not add unapproved statistics, performance claims, customer logos, geographic facts, or assertions. If the subject lacks facts, demonstrate its concept with labeled illustrative content.

### 2. Set an art direction before coding motion

Write a short creative treatment containing:

1. The message and emotional progression.
2. One central visual metaphor.
3. A small visual vocabulary of shapes and relationships.
4. Palette, typography hierarchy, grid, and spacing rules.
5. The recurring element that carries the viewer between scenes.
6. The one moment that deserves the strongest motion emphasis.

Choose one coherent direction. Examples include a light editorial composition, a dark technical diagram, or a bold typographic explanation. Do not combine every fashionable effect.

Define what the objects mean. A dot might represent an event; a line might represent a relationship; a ring might represent a boundary. Use those meanings consistently. A neutral line must not silently turn into proof of causation.

Design at least three representative still compositions in code: opening, central transformation, and resolution. Verify that their hierarchy and spacing work before animating. These are rendered views of editable scenes, not images to animate later.

Create one visually distinctive motif appropriate to the subject. Let that motif transform across the piece. Do not depend on generic floating rectangles or a decorative particle field to supply the concept.

### 3. Build a narrative with connected scenes

Construct a short progression: establish → complicate or compare → transform → resolve.

Use roughly 3–5 purposeful beats for a 20–30 second piece. Treat this as a planning range; the actual message controls scene count. Introduce the core idea in the first few seconds.

For each beat, specify:

- What the viewer understands after it.
- The main subject and its visual priority.
- The initial and final composition.
- The transformation that conveys meaning.
- The transition into the next beat.
- A stationary reading interval.
- The associated narration or sound cue, if present.

Create a timing table with start, end, takeaway, primary action, secondary action, camera, copy, and hold. A scene may contain several coordinated events, but one should clearly lead.

Make a rough animatic from the coded shapes and text. Test the whole sequence before polishing details. Fix scenes that do not fit by simplifying the message or removing a beat, rather than accelerating every element.

### 4. Composition and typography

Use a fixed design-coordinate system. Scale the complete stage uniformly to fit a smaller preview window; do not allow responsive text wrapping to change the composition unexpectedly. Create an intentionally recomposed layout for a different aspect ratio.

Suggested starting values at 1920 × 1080:

| Element | Starting range |
|---|---|
| Important-content margins | 5–8% of frame dimensions |
| Spacing unit | 8 or 12 design units, used consistently |
| Hero number or short word | 120–200 px |
| Main headline | 72–112 px |
| Supporting text | 36–48 px |
| Diagram labels | 28–36 px; enlarge essential labels for small playback |
| Major outline strokes | About 3–5 px; inspect after downscaling |
| Palette | Neutral background and foreground, one primary accent, optional semantic accent |
| Typeface families | One primary family; one optional supporting family |

These are art-direction defaults, not accessibility standards. Check the actual glyphs, weight, viewing size, line lengths, and background. All information necessary to understand the piece must remain readable in a smaller embedded player.

Use whitespace to isolate the main idea. Favor a small number of large, decisive elements over many equally weighted objects. Set line breaks deliberately. Preserve alignment, baseline relationships, and optical balance.

Use real text where possible. Give animated numerals fixed containers and tabular figures so changing digits do not shake the layout. Keep units, signs, and labels attached to their values.

Use a 4.5:1 text/background contrast target for information-bearing text as a conservative design rule. A contrast calculation alone does not establish complete accessibility. Use labels or shape differences in addition to color for meaning.

### 5. Define a small motion system

Create named tokens for entrance, movement, exit, emphasis, stagger, camera, and hold. Reuse those relationships consistently while adapting to distance and visual complexity.

Keep three time scales distinct:

- **Animation time:** how long an element takes to move or transform.
- **Reading time:** how long its settled state remains available.
- **Scene time:** the full storytelling interval, including overlap and transitions.

Use the following as initial film settings, not published standards:

| Motion | Starting duration | Approximate frames at 30 fps | Purpose |
|---|---:|---:|---|
| Small accent or confirmation | 100–200 ms | 3–6 | Direct a brief glance |
| Small preparatory cue | 100–200 ms | 3–6 | Establish the next focal point |
| Phrase or label reveal | 350–550 ms | 11–17 | Introduce readable text |
| Primary object entrance or move | 500–800 ms | 15–24 | Carry visual weight |
| Meaningful shape transformation | 600–1,000 ms | 18–30 | Explain a changed relationship |
| Scene-connecting move | 700–1,200 ms | 21–36 | Preserve continuity |
| Exit | 250–450 ms | 8–14 | Clear space efficiently |
| Related-element stagger | 50–100 ms between starts | 2–3 | Express order or grouping |
| Short settled phrase | 1.5–3 seconds | 45–90 | Allow reading |
| Diagram or comparison hold | 3–5 seconds, extend if needed | 90–150 | Allow inspection |
| Final composition hold | 2–4 seconds | 60–120 | Let the takeaway land |

Convert absolute start/end times to frame positions once. Derive durations from those positions to prevent repeated rounding from shifting the timeline. At 60 fps, preserve the same seconds and double the corresponding frame counts.

Prefer a faster entrance followed by a readable hold over an entrance that consumes the entire scene. Budget reading time after the last important word or label settles.

### 6. Easing, spacing, weight, and settling

Use deceleration for entrances, acceleration for departures that leave the scene, and a smooth acceleration/deceleration curve for movement between visible locations. Constant-speed travel is appropriate for a deliberate conveyor, scan, or signal, not every entrance.

Suggested custom curves:

| Token | CSS-style curve | Starting use |
|---|---|---|
| `enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Decisive arrival with a gentle landing |
| `travel` | `cubic-bezier(0.65, 0, 0.35, 1)` | Visible movement between positions |
| `exit` | `cubic-bezier(0.4, 0, 1, 1)` | Departure that clears the frame |
| `fade` | Linear or a restrained ease-out | Opacity with no overshoot |

Treat these as editable presets. A cubic Bézier curve is not a physical spring. Never copy spring damping or stiffness values between libraries as if their parameterizations were identical.

If implementing a Bézier easing function, use a correct evaluator that solves the curve's x coordinate for time. Evaluating its y polynomial directly at the time fraction does not generally produce the same easing.

Default to controlled settling with no bounce. A high-damping spring can create a smooth arrival without visible oscillation. If the brief explicitly supports playful motion, reserve a small overshoot for one meaningful shape; keep text, camera movement, opacity, and color stable. Follow stricter brand rules when supplied.

Give larger or more important objects time to feel substantial. Use a small preparatory movement or a pause to cue a major transformation when it helps. Do not add a windup to every label.

Preserve position and direction at scene boundaries. Retarget a moving object from its actual state. Abrupt changes of velocity should be deliberate accents, not accidental keyframe joins.

### 7. Choreograph primary and secondary action

Sequence attention: main object → relationship → explanatory label → outcome.

Allow related actions to overlap slightly when their connection is clear. A connector can begin near the end of an object's arrival; a label can settle shortly after the connector reaches its destination.

Use stagger to communicate structure. Choose reading order, center-out, or distance from a source according to the story. Avoid arbitrary random delays for information-bearing elements.

For larger groups, cap the total stagger window at approximately 400–700 ms instead of extending the sequence indefinitely. Start times and individual animation durations are separate quantities: a group finishes after its last start plus that element's duration.

Keep background elements still while the main point is being explained. Secondary movement should reinforce the main event and finish promptly. Persistent drifting, pulsing, and rotation should have an explicit narrative purpose.

Plan at least one calm beat around the strongest transformation. Constant intensity removes emphasis.

### 8. Kinetic typography that stays readable

Animate a phrase, line, or meaningful keyword as a unit. Suitable treatments include a masked line reveal, a small translation with opacity, a shared word that moves into the next composition, or a controlled change of scale on one key term.

Start with travel distances around 20–48 design units for text. Use larger movement only when the composition requires it. Do not stretch letterforms nonuniformly.

Keep letter-by-letter reveals exceptional. Do not use a typewriter animation by default. Avoid rotating every character, shuffling the alphabet, or continuously animating tracking in copy the audience must read.

Provide room inside masks for ascenders, descenders, accents, and italic overhang. Check the rendered font, not just its nominal bounding box. Text should not be clipped while settling.

Keep one dominant phrase on screen at a time, with a short supporting line when needed. Do not put a paragraph on screen and compensate with a long moving camera.

For a starting hold calculation, use `max(1.5, wordCount / 2.5)` seconds after the phrase settles; add time for unfamiliar terms, diagrams, or simultaneous narration. This is an editorial heuristic, not a reading-speed benchmark. Validate at normal playback.

### 9. Create meaning through geometric transformations

Prefer transformations that preserve identity:

- Separate dots align into a pattern to express organization.
- A line becomes an axis that structures the next scene.
- A ring expands into a boundary that reveals a system.
- A group consolidates into a summary object while retaining visible provenance.
- One persistent shape connects a problem state to a resolved state.

Use shared position, color, contour, or direction as a visual bridge. Carry one recognizable anchor between scenes so viewers can follow the change.

For SVG morphing, confirm compatible path topology and point ordering. If a reliable morph is impractical, use a mask, a shared primitive, or a brief overlap to preserve the intended relationship. Avoid tangled intermediate paths.

For line drawing, use path-length-aware reveals. For a dot traveling along a path, derive its location from distance along that path. Keep both on the same progress value when they must meet. Do not assume that a raw Bézier parameter gives constant travel speed.

Use procedurally drawn symbols with a consistent stroke and corner language. Simplify until their meaning reads at delivery size. A decorative network should not imply real data or a verified relationship.

### 10. Camera movement and scene transitions

Treat the camera as a compositional tool applied to the original scene graph. Keep titles or captions outside the moving world layer when they should remain fixed.

Start with restrained push-ins around 1.0× to 1.10×–1.25× over 700–1,200 ms. Use a larger move only when it reveals a meaningful spatial relationship. These scale ranges describe camera motion, not object morphing.

Pan along the direction of the idea: from source to destination, individual to system, or cause to consequence when that causal claim is justified. Choose the ending composition before moving.

Preserve the focal anchor during combined translation and scale. Apply one camera transform to related objects, labels, and connectors so their relationships stay intact.

Keep the camera stationary for important text and the main explanatory hold. Do not use continuous camera drift to make a static concept appear animated.

Choose two or three transition families for the piece:

1. **Shared-object transition:** an existing shape moves or transforms into the next scene's anchor.
2. **Shape-mask reveal:** a meaningful object expands or opens to reveal the next composition.
3. **Match cut or clean cut:** preserve an anchor across the cut, or cut deliberately for emphasis.

A wipe should follow a meaningful direction. An infinite zoom should reveal a hierarchy. A morph should explain a relationship. A transition is successful when it helps the viewer follow the idea.

Keep transition tails from colliding with the next scene's reading interval. Avoid whipping, spinning, glitching, aggressive parallax, and gratuitous 3D camera orbits in the default restrained style.

### 11. Data graphics, if the brief includes them

Use only approved values and labels. Preserve dates, units, denominators, and uncertainty. Clearly identify illustrative numbers.

Give comparisons a common scale. Grow bars from a shared baseline and ensure the final geometry matches the actual values. Do not exaggerate a difference through an inconsistent axis, area, or animation endpoint.

Show enough context to interpret a number. Use a short count-up only when accumulation itself helps the story; otherwise reveal the final value directly.

Keep count animations monotonic when the underlying concept is monotonic. End exactly on the approved value and hold it. Counter and chart progress should agree.

Reveal relationships in the order the narration explains them. Avoid many independently moving labels. For dense information, divide it into successive compositions.

### 12. Light, depth, effects, and sound

Create depth with grouping, scale, overlap, contrast, and a restrained shadow when appropriate. Use gradients only when they improve form or hierarchy. Procedural texture should be subtle, deterministic, and subordinate to the subject.

Keep the typography crisp. Default to no motion blur for text. If geometry benefits from blur, use a small amount only during fast movement and remove it completely during holds. Check render cost and legibility.

Sound can mark one or two meaningful events. Align an impact with the actual contact or settle frame. A swoosh on every move is unnecessary. Keep narration understandable.

When supplied music has a clear pulse, use selected beats to reinforce the structure. Do not force every text reveal or transition onto a beat. Do not assume audio exists or generate a voice without the requested authorization.

The silent version must still communicate the main idea. If narration exists, provide synchronized captions and avoid covering the main visual.

### 13. Choose one implementation path

**A. Browser artifact / offline HTML:** use one HTML document with inline SVG, CSS, and JavaScript when no build step is requested. Construct the scene elements once and update their properties from a central time function. Use system fonts or locally available permitted fonts. Do not silently require a CDN.

**B. Programmatic video:** use an existing Remotion/React setup when present or when a reproducible video-rendering project is appropriate. Build original geometry in SVG or code and drive every animated value from the frame timeline. Use documented APIs compatible with the installed version.

**C. GSAP browser project:** use a single master timeline with labels and nested scene timelines when GSAP is available and suitable. It must support precise seeking and repeatable capture. Use a verified frame-synchronized integration if combining it with a frame renderer; a free-running timeline inside Remotion will not automatically synchronize.

Choose one path and keep it simple. Use Canvas or WebGL only when the visual idea benefits from them. HTML/SVG is sufficient for many polished typographic and geometric pieces.

Do not spend the task creating an unrelated framework, editing the product website, or installing unnecessary tools. Preserve existing work and follow the project's applicable instructions.

### 14. Make the timeline deterministic and editable

Represent each scene and event in data: stable object IDs, times, positions, scale, opacity, colors, text, and transition links. Centralize tokens rather than scattering unexplained durations.

For a browser artifact, expose a small control API:

```js
window.motionDemo = {
  duration: 24,            // Actual duration in seconds; update to the brief.
  ready: Promise.resolve(), // Replace with the real fonts/assets-ready promise.
  seek(seconds) {},        // Render the complete state at this time.
  play() {},
  pause() {},
  restart() {},
  setReducedMotion(enabled) {}
};
```

Implement these methods; do not leave placeholders in the finished deliverable. `seek(t)` must work before playback and after arbitrary forward or backward seeking. Repeated calls with the same time must produce the same scene.

Use absolute time, never accumulated per-frame increments, to calculate state. Browser playback may use `requestAnimationFrame` to advance the clock; the renderer still receives an explicit time. Avoid independent timers, playback-only DOM insertion, and animations that depend on having visited earlier frames.

For Remotion, derive animation state from the requested frame and fps. Wait for fonts and required assets before rendering. Use seeded procedural variation. A preview that plays smoothly is not proof that independent-frame export works.

Useful normalized progress:

```js
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const progress = (t, start, duration) =>
  duration <= 0 ? Number(t >= start) : clamp01((t - start) / duration);
const smootherstep = (u) => u * u * u * (u * (u * 6 - 15) + 10);
const mix = (a, b, u) => a + (b - a) * u;
```

This smoothstep variant is an optional non-bouncing interpolation curve, not a replacement for all art direction. Use appropriate movement-specific easing and clamp endpoints.

Prefer transforms and opacity for frequent DOM movement. Profile SVG drawing, masks, filters, and large procedural scenes. Offline rendering can support more expensive effects than real-time preview, but exported frames must remain consistent. Measure font geometry after fonts load and avoid layout measurements on every frame.

### 15. Build in review and capture controls

Provide play, pause, restart, a time scrubber, and a time readout in the browser preview. Keep controls outside the composition and offer a capture mode that hides them.

Where practical, support `?t=4.2` for a paused inspection frame and `?capture=1` for a clean stage. An explicit capture/export setting may select full or reduced motion. Normal interactive playback should respect the viewer's reduced-motion preference.

Stop at the final composition by default. Make looping an explicit option with a designed seam, not a sudden reset. Provide a reduced-motion mode that keeps the complete story through static compositions or short fades, and a text summary.

Avoid flashing effects. Keep essential reading states stable. These choices improve usability; do not claim full WCAG compliance from a short checklist.

### 16. Reference choreography recipes

Use these original timing recipes as editable examples, not templates that every project must follow. Each is built from text and geometry.

**Recipe A — scattered inputs become a clear outcome, 10 seconds**

| Time | Action |
|---|---|
| 0.0–1.0 | Establish a short headline and three deliberately placed circles. |
| 1.0–2.4 | Circles travel along distinct paths toward a shared alignment; 80 ms stagger. |
| 2.4–3.2 | A connecting line completes the relationship; a short label appears. |
| 3.2–5.2 | Hold the organized system. |
| 5.2–6.2 | One shared shape expands into the result container, preserving the focal anchor. |
| 6.2–7.0 | Result phrase reveals; supporting objects settle. |
| 7.0–10.0 | Hold the resolved composition. |

**Recipe B — one metric changes the interpretation, 12 seconds**

| Time | Action |
|---|---|
| 0.0–1.2 | Reveal an approved metric with its label; hold the camera. |
| 1.2–3.2 | Allow the metric to read. |
| 3.2–4.0 | Move the same metric into a comparison layout. |
| 4.0–5.2 | Draw a common baseline and reveal a second approved measure. |
| 5.2–8.0 | Hold the comparison with units and context. |
| 8.0–9.0 | A geometric highlight isolates the meaningful difference. |
| 9.0–12.0 | Resolve into a short takeaway while preserving the comparison. |

**Recipe C — a signal passes through a process, 12 seconds**

| Time | Action |
|---|---|
| 0.0–1.0 | Establish a source and two faint destination outlines. |
| 1.0–2.2 | Draw the first path and move the signal along it. |
| 2.2–3.2 | Signal arrival triggers a local transformation; reveal its label. |
| 3.2–5.0 | Hold the first relationship. |
| 5.0–6.2 | Continue the signal toward the second destination. |
| 6.2–7.2 | Arrival resolves the destination into the outcome shape. |
| 7.2–9.0 | Widen the view slightly to show the complete process. |
| 9.0–12.0 | Hold the system and its takeaway. |

In every recipe, remove objects that have no explanatory role. Replace placeholder content with the approved brief. Do not imply a causal process merely because a connecting-line animation looks persuasive.

### 17. Inspect the animation in stages

1. **Composition:** inspect the three representative still states at full size and at 960 × 540 playback size. These are review outputs rendered from the scene graph.
2. **Timing:** run the rough animatic and check comprehension, scene order, and reading holds.
3. **Motion sample:** polish a representative 6–10 second segment containing text, a shape transformation, and a transition. Use it to tune the shared tokens.
4. **Complete pass:** apply the chosen system to the full piece and inspect every scene boundary.
5. **Export:** inspect the actual encoded file or actual runnable artifact, including start, middle, transitions, and final state.

Test arbitrary seeks, including a backward seek, a repeated timestamp, a midpoint inside a morph, and the final frame. Check that connectors, labels, and masks remain aligned.

For a 24-second composition at 30 fps, expect 720 frames, indexed 0–719. The last visible frame is just before 24 seconds; begin the end hold before that point rather than placing required content exactly at the exclusive endpoint.

If rendering MP4, use a broadly playable encoding such as H.264 with yuv420p when supported. State the actual dimensions, fps, duration, and audio presence. Do not simply rename another container to `.mp4` or claim video export when only HTML exists.

If export tooling is unavailable, complete the runnable animation and provide the exact remaining render step. Say what was and was not verified.

### 18. Acceptance benchmarks and delivery

These are internal production targets, not externally validated performance standards:

| Dimension | Acceptance target |
|---|---|
| Original construction | All scene visuals come from editable code, text, and geometry. |
| Message | Every scene has one stated takeaway and a visible reason to exist. |
| Hierarchy | One primary focal point per beat; supporting elements remain subordinate. |
| Typography | Essential text is readable at intended playback size without pausing. |
| Motion | No unintended jumps, clipping, mask errors, floating labels, or unfinished spring tails. |
| Continuity | Transitions preserve an anchor or deliberately establish a new composition. |
| Timing | Reading intervals follow settling; scene timings add up to the requested duration. |
| Determinism | The same timestamp produces the same state in the same rendering environment. |
| Facts | Values, labels, scale, and units match approved content. |
| Controls | Pause, restart, and seek work in the interactive preview. |
| Export | Actual output has the requested dimensions, duration, fps, and format. |

If unfamiliar human reviewers are available, ask them for the single takeaway and what changed during the sequence. Record their actual answers. Do not invent a viewer test or an engagement score.

Deliver the editable source, runnable preview, timeline/scene description, and short reproduction instructions. Include the rendered video when requested and supported. Keep incidental review files organized separately from final assets.

Provide a brief report of checks performed and unresolved issues. Do not stop at a plan or a code listing when you have the tools to create and inspect the artifact.

<!-- END CLAUDE PROMPT -->

## Research notes: what the benchmarks actually establish

The guide draws on published design systems, practitioner production methods, rendering documentation, and accessibility guidance. These are different kinds of evidence. None establishes a universal recipe for a “sleek” film or proves that a particular easing curve increases conversion.

| Reference | Published guidance or observable capability | Application and limit |
|---|---|---|
| [Carbon motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) | Distinguishes productive and expressive motion; defines entrance, standard, and exit easing. Its duration tokens include 70, 110, 150, 240, 400, and 700 ms. | A useful example of a coherent motion system. These are interface tokens, not mandatory film shot lengths. |
| [Material 3 motion](https://m3.material.io/styles/motion) | The M3 Expressive system introduced in May 2025 uses spring-based schemes and distinguishes spatial motion from effects such as opacity/color. | Springs can create consistent behavior; effects should not overshoot. Older Material Bézier tables are not the whole current system. |
| [Ordinary Folk process](https://www.ordinaryfolk.co/process) | Describes message, design, animation, and audio as linked production stages. | A production-process reference, not measured evidence for a particular duration or aesthetic outcome. |
| [School of Motion workflow](https://schoolofmotion.com/blog/guide-completing-motion-design-project) | Recommends a timed animatic before detailed animation and a rough pass before polish. | Supports validating the story and timing before expensive refinement. |
| [School of Motion design](https://schoolofmotion.com/blog/is-design-important-motion-designers) | Explains hierarchy, proportion, rhythm, repetition, and whitespace. | Supports judging still compositions before effects; the guide's pixel sizes remain custom defaults. |
| [School of Motion anticipation](https://schoolofmotion.com/blog/anticipation-principle-quick-tip) | Explains how preparatory cues establish attention and expectations. | Supports purposeful preparation before a major action; it does not prescribe the guide's 100–200 ms range. |
| [School of Motion transitions](https://schoolofmotion.com/blog/six-essential-motion-design-transitions-tutorial) | Discusses cuts, dissolves, cuts on action, match cuts, zoom transitions, and morphs. | Gives a vocabulary for connecting scenes; choose by meaning and continuity. |
| [Pixar in a Box / Khan Academy](https://www.khanacademy.org/computing/pixar/animate/ball/v/a2-quick) | Demonstrates how pose spacing and interpolation change perceived movement. | Timing and spacing are separate design decisions. Linear travel can be intentional. |
| [Remotion animation](https://www.remotion.dev/docs/animating-properties) | Demonstrates properties derived from a frame timeline. | Supports reproducible code-built animation rather than playback-dependent state. |
| [Remotion springs](https://www.remotion.dev/docs/spring) | Documents damping, mass, stiffness, overshoot clamping, and frame-based duration controls. | Evaluate and tune in the chosen engine; numeric spring settings are not interchangeable across implementations. |
| [Remotion flickering](https://www.remotion.dev/docs/flickering) | Explains independent-frame rendering, deterministic state, and asset-loading requirements. | A smooth interactive preview does not prove a reliable export. |
| [GSAP timelines](https://gsap.com/docs/v3/GSAP/Timeline/) | Provides labels, nested sequences, positions, seeking, and playback controls. | Useful for coordinated browser scenes; frame-render integration needs explicit synchronization. |
| [GSAP staggers](https://gsap.com/resources/getting-started/Staggers/) | Supports ordered, grid-based, and bounded-total-time stagger configuration. | Supports a coherent group reveal without multiplying delay indefinitely. |
| [MDN path sampling](https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getPointAtLength) | Returns a point at a specified distance along an SVG path. | Supports path-aligned movement; use measured distance when travel speed matters. |
| [web.dev animation performance](https://web.dev/articles/animations-guide) | Recommends favoring transform/opacity, examining paint/layout costs, and profiling dropped frames. | Relevant to browser previews. Offline rendering has different speed constraints but still needs correct frames. |
| [W3C contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Specifies 4.5:1 for normal text and 3:1 for qualifying large text, with stated exceptions. | The prompt adopts 4.5:1 as a conservative target; playback scaling and other criteria still matter. |
| [W3C flash thresholds](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | Explains flash frequency and area/intensity thresholds. | Avoiding flashing is the simple default; a casual visual check does not certify conformance. |
| [W3C interaction motion](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Addresses disabling nonessential interaction-triggered motion and motion sensitivity. | Relevant to the interactive preview; an exported movie needs an alternate version if reduced motion is required. |
| [W3C pause/stop/hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Addresses automatically starting movement lasting over five seconds when presented alongside other content, with specified conditions. | Informs preview controls. Do not generalize it into a claim that every standalone movie is subject to identical UI requirements. |

### How to compare against references

Use the original studios' process and work as craft references, and the design systems as references for consistency. If studying an accessible film, record what was actually inspected: the scene, approximate movement duration, settled hold, focal anchor, and transition. Separate those observations from proposed settings. This research used published descriptions and documentation; it does not claim frame-by-frame measurements of studio films.

A practical comparison sheet can have five rows: opening composition, typography reveal, main transformation, scene transition, and final hold. Score clarity, consistency, and readability with written observations rather than an invented industry score. Test at normal speed and at the actual delivery size.

### Using this guide in the current submission

Keep this prompt generic. Pair it with the exact segment brief from [the video script](video-script.md) and the relevant approved content. The existing [Beat 4 prompt](beat4-animation-prompt.md) is a separate, specific brief; this file does not revise or validate its factual claims.

When producing a Piper-branded segment, use the applicable supplied brand and motion standards. The current Piper motion document in the sibling `hackachusetts-piper-ui` checkout specifies restrained motion, no default bounce or typewriter text, limited looping, and reduced-motion alternatives. Its interface durations should not automatically replace the film's reading holds. Fit any new segment into the submission's existing total duration below three minutes.
