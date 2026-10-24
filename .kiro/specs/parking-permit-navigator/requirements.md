# Requirements — Parking Permit Navigator

> Rename/adapt this spec to the service you commit to. One spec folder per feature.
> Format: EARS (Easy Approach to Requirements Syntax). Keep each requirement testable.

## Problem
A Massachusetts resident needs to complete one concrete public service task
(default: preparing a Boston moving-truck / moving-van temporary parking
application) and today has to piece together scattered, authoritative-but-hard
information with no guided path and no clear point where they decide and act.

## Goal
Walk the resident from "I need to do this" to "I have everything ready to
submit," with cited evidence at each step and one human decision point before
any action.

## User stories & acceptance criteria

### 1. Guided intake
As a resident, I want to answer a few plain questions so the tool knows my
situation.
- WHEN the user opens the app THE SYSTEM SHALL present the first intake question with no prior setup.
- WHEN the user answers a question THE SYSTEM SHALL advance to the next relevant step and allow going back.
- IF a required field is empty WHEN the user advances THEN THE SYSTEM SHALL block advance and show an inline, labeled error.

### 2. Authoritative evidence
As a resident, I want to trust what the tool tells me.
- WHEN the system states a rule or requirement THE SYSTEM SHALL show the source it came from, visible in-product.
- THE SYSTEM SHALL use a committed data snapshot with a documented source and date.

### 3. Human decision point
As a resident, I want to decide and act myself.
- WHEN the system has gathered enough input THE SYSTEM SHALL present a review screen summarizing what will be submitted.
- THE SYSTEM SHALL NOT submit, pay, or take any binding civic action on the user's behalf automatically.
- WHEN the user confirms on the review screen THE SYSTEM SHALL produce the ready-to-use output (e.g. a filled checklist / draft application).

### 4. Accessibility
As any user, I want to use this with a keyboard and a screen reader.
- THE SYSTEM SHALL be fully operable by keyboard with a visible focus order.
- THE SYSTEM SHALL label every interactive control for assistive tech.
- THE SYSTEM SHALL meet WCAG AA contrast for text and UI.

## Out of scope
- Multiple services at once.
- Real payment or real submission to a government system.
- Storing real personal data beyond the current session.

## Non-functional
- Demo happy path works offline from the committed snapshot.
- Loads and is interactive in under ~2s on a laptop.
