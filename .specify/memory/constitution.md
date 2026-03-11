<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0
Initial ratification — all placeholders replaced.

Modified principles:
  (new) I. Radical Simplicity
  (new) II. Delightful User Experience
  (new) III. Readability Over Cleverness
  (new) IV. Test-Driven Development
  (new) V. Accessibility & Inclusivity

Added sections:
  - Code Quality Standards
  - UX & Interaction Standards
  - Governance

Removed sections: none

Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check gate aligns with principles
  ✅ .specify/templates/spec-template.md — User Scenarios & Success Criteria align with UX principle
  ✅ .specify/templates/tasks-template.md — Phase structure supports TDD and UX polish phases

Follow-up TODOs: none — all placeholders resolved.
-->

# Todo App Constitution

## Core Principles

### I. Radical Simplicity

Every feature MUST be the simplest possible solution that satisfies the requirement.
Code complexity MUST be justified — if a simpler approach exists, it MUST be preferred.

- YAGNI (You Aren't Gonna Need It) is non-negotiable: do not build for hypothetical future needs.
- Dependencies MUST earn their place; every new dependency requires explicit justification.
- Functions and components MUST do one thing well. If a unit does two things, it MUST be split.
- Abstractions are introduced only when the same pattern appears three or more times.

**Rationale**: Simplicity reduces cognitive load for contributors, lowers bug surface area, and
keeps the codebase maintainable as the team grows.

### II. Delightful User Experience

Every product decision MUST prioritize how the feature feels to the end user — not just whether
it functions correctly.

- Interactions MUST feel immediate: UI feedback MUST appear within 100 ms of user action.
- Error states MUST be human-readable, empathetic, and actionable — never raw technical messages.
- Empty states, loading states, and success states MUST all be deliberately designed, not
  incidental.
- Features MUST be validated against real user scenarios before being considered done.
- Motion and transitions MUST have purpose; decorative-only animation is prohibited.

**Rationale**: A todo app is a productivity tool. If using it feels tedious or confusing, it
fails its core purpose regardless of technical correctness.

### III. Readability Over Cleverness

Code MUST read like well-written prose. A developer unfamiliar with a module MUST be able to
understand its intent within five minutes of reading.

- Names (variables, functions, components, files) MUST be descriptive and unambiguous.
  Single-letter names are forbidden outside loop counters.
- Inline comments are reserved for non-obvious _why_ explanations; obvious _what_ comments
  MUST be removed.
- Functions MUST NOT exceed 40 lines; components MUST NOT exceed 150 lines without documented
  justification.
- Consistent formatting MUST be enforced via automated tooling (linter + formatter) — style
  debates belong in configuration, not code review.

**Rationale**: Code is read far more often than it is written. Optimising for reading speed
directly reduces the cost of maintenance and onboarding.

### IV. Test-Driven Development (NON-NEGOTIABLE)

Tests MUST be written before implementation code. No feature is considered shippable without
a passing, meaningful test suite.

- Red-Green-Refactor cycle is strictly enforced: tests fail first, then implementation
  passes them, then code is refactored without breaking tests.
- Unit tests cover pure logic; integration tests cover user journeys end-to-end.
- Tests MUST be written at the same level of care as production code — no copy-paste tests,
  no tests that always pass.
- Flaky tests MUST be fixed or deleted immediately; they MUST NOT be merged.

**Rationale**: TDD produces more modular designs, catches regressions early, and gives the team
confidence to refactor and improve the codebase over time.

### V. Accessibility & Inclusivity

The application MUST be usable by people regardless of ability, device, or context.

- All interactive elements MUST be keyboard-navigable and screen-reader-compatible
  (WCAG 2.1 AA as a minimum bar).
- Colour MUST NOT be the sole means of conveying information.
- Touch targets MUST be at least 44×44 px on mobile.
- The app MUST be functional without JavaScript where feasible (progressive enhancement).
- Internationalisation hooks MUST be in place from the start, even if only one locale ships
  initially.

**Rationale**: Accessibility is not a nice-to-have. Excluding users because of ability or
context is a design failure. Building accessibly from the start is cheaper than retrofitting.

## Code Quality Standards

Consistent quality gates apply to every pull request and MUST be enforced in CI.

- Linting and formatting checks MUST pass before merge (zero warnings policy).
- Code coverage MUST not decrease; regressions in coverage require explicit sign-off.
- All public-facing APIs and component interfaces MUST have type definitions.
- Security scanning (dependency audit) MUST run on every dependency change.
- Performance budgets (bundle size, interaction latency) MUST be tracked and regressions
  flagged automatically.

## UX & Interaction Standards

Design and implementation decisions affecting the user interface MUST meet these standards.

- First Contentful Paint MUST be ≤ 1.5 s on a mid-range device on a 4G connection.
- All destructive actions (delete, bulk-clear) MUST require confirmation or provide undo.
- Form validation feedback MUST be inline and immediate — not deferred to submission.
- The app MUST be fully responsive across screen widths from 320 px to 2560 px.
- Visual design MUST use a defined design token system (colours, spacing, typography) —
  no magic numbers in stylesheets.

## Governance

This constitution supersedes all other development guidelines. Any practice that conflicts
with these principles MUST be resolved in favour of the constitution.

**Amendment procedure**:

1. Propose the amendment in a pull request with a written rationale.
2. All active contributors MUST review and approve before merge.
3. The version number MUST be incremented following semantic versioning rules
   (MAJOR for breaking principle changes, MINOR for additions, PATCH for clarifications).
4. The `Last Amended` date MUST be updated on every merge that modifies this file.

**Compliance reviews**: Constitution compliance is a mandatory criterion on every pull request.
The "Constitution Check" gate in `plan.md` MUST be completed before implementation begins.

**Version**: 1.0.0 | **Ratified**: 2026-03-11 | **Last Amended**: 2026-03-11
