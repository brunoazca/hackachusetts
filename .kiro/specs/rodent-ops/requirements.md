# Requirements — <Feature Name>

> This is the clean starting spec. One spec folder per feature.
> Rename this folder from `civic-service` to your outcome (kebab-case) once the
> idea is chosen — e.g. `block-brief`, `notice-to-action`.
> Format: EARS (Easy Approach to Requirements Syntax). Keep each requirement testable.
> Everything in `<angle brackets>` is a blank to fill. Delete this note when done.

## Problem
<One short paragraph: which Massachusetts resident is stuck on which single
public-service task today, and why the current path is hard.>

## Goal
Walk the user from "<I need to do this>" to "<I have what I need>", with cited
evidence at each step and one human decision point before any action.

## Non-negotiables (from the track rules — keep these for any idea)
- Authoritative data, cited in-product. Every stated fact points to a source.
- A visible human decision point. Nothing binding is automated.
- Accessible: keyboard operable, screen-reader labels, WCAG AA contrast.
- A committed data snapshot on the demo path. No live API during the demo.

## User stories & acceptance criteria

### 1. Guided intake
As a <user>, I want to <answer a few plain questions> so the tool knows my situation.
- WHEN the user opens the app THE SYSTEM SHALL present the first step with no prior setup.
- WHEN the user completes a step THE SYSTEM SHALL advance to the next relevant step and allow going back.
- IF a required field is empty WHEN the user advances THEN THE SYSTEM SHALL block advance and show an inline, labeled error.

### 2. Authoritative evidence
As a <user>, I want to trust what the tool tells me.
- WHEN the system states a fact or rule THE SYSTEM SHALL show the source it came from, visible in-product.
- THE SYSTEM SHALL use a committed data snapshot with a documented source name, URL, and retrieval date.
- IF the data cannot support a claim THEN THE SYSTEM SHALL show "not supported by the data" instead of inventing an answer.

### 3. Human decision point
As a <user>, I want to decide and act myself.
- WHEN the system has gathered enough input THE SYSTEM SHALL present a review screen summarizing the output.
- THE SYSTEM SHALL NOT submit, pay, or take any binding civic action automatically.
- WHEN the user confirms on the review screen THE SYSTEM SHALL produce the ready-to-use output (<e.g. one-page brief / checklist / draft>).

### 4. Accessibility
As any user, I want to use this with a keyboard and a screen reader.
- THE SYSTEM SHALL be fully operable by keyboard with a visible focus order.
- THE SYSTEM SHALL label every interactive control for assistive tech.
- THE SYSTEM SHALL meet WCAG AA contrast for text and UI.

## Out of scope
- <Second service / feature creep.>
- Real payment or real submission to a government system.
- Storing real personal data beyond the current session.

## Non-functional
- Demo happy path works offline from the committed snapshot.
- Loads and is interactive in under ~2s on a laptop.
