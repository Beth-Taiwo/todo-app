<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (MINOR — three new principles added)

Modified principles:
  (unchanged) I. Radical Simplicity
  (unchanged) II. Delightful User Experience
  (unchanged) III. Readability Over Cleverness
  (unchanged) IV. Test-Driven Development
  (unchanged) V. Accessibility & Inclusivity
  (new) VI. Secure Authentication & Authorization
  (new) VII. User Privacy & Data Protection
  (new) VIII. Cross-Device Continuity

Added sections: Principles VI, VII, VIII

Removed sections: none

Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check gate is generic;
     new auth/privacy/sync checks will surface automatically when plans are generated
  ✅ .specify/templates/spec-template.md — FR-006 auth placeholder and security
     FR examples already present; privacy and cross-device FRs should be added
     when specifying features that involve authenticated user data
  ✅ .specify/templates/tasks-template.md — T005 auth task and TXXX security
     hardening task already present; cross-device/sync tasks should be added
     per-feature as needed
  ✅ .specify/templates/checklist-template.md — no principle-specific references;
     no change required
  ✅ .specify/templates/constitution-template.md — source template; no change required
  ✅ .specify/templates/agent-file-template.md — no principle references; no change

Follow-up TODOs:
  - 003-auth feature spec should be opened to implement Principle VI & VII
  - localStorage-only storage strategy must be revisited under Principle VIII
    before shipping to authenticated users
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

### VI. Secure Authentication & Authorization

User identity MUST be verified before granting access to any task data. Authorization checks
MUST be enforced at the server boundary — UI-only enforcement is insufficient.

- Authentication MUST use a proven, audited mechanism (OAuth 2.0, OpenID Connect, or a vetted
  auth provider). Custom authentication protocols are prohibited.
- Authorization MUST follow least-privilege: users MUST only access their own data.
- Session tokens MUST be short-lived, rotated on privilege change, and invalidated on logout.
- All authentication endpoints MUST be rate-limited to prevent brute-force attacks.
- Client-side auth state MUST be treated as untrusted; all data mutations MUST be
  re-validated server-side regardless of what the client claims.

**Rationale**: Task data is personal and potentially sensitive. Authentication without
server-side enforcement is theatre. A breach of user data violates trust and may carry
legal consequences.

### VII. User Privacy & Data Protection

User data MUST be collected minimally, stored securely, and never shared without explicit
informed consent.

- Only data necessary to deliver the feature MUST be collected — no speculative data
  gathering is permitted.
- Task data MUST be encrypted at rest and in transit (TLS 1.2+ minimum for transport).
- Users MUST be able to export and permanently delete all their data via a self-service
  mechanism — no support-ticket required.
- Third-party services that handle user data MUST be identified, justified, and covered by
  a Data Processing Agreement before integration.
- Personally identifiable information (PII) MUST NOT appear in logs, error messages,
  analytics events, or crash reports.

**Rationale**: Privacy is a user right, not a compliance checkbox. Building with privacy
by default is cheaper than retrofitting, and builds lasting trust that is hard to recover
once broken.

### VIII. Cross-Device Continuity

Users MUST experience consistent, up-to-date task state regardless of which device they use.

- Task state MUST be persisted server-side for authenticated users; local storage MAY be
  used as a read cache but MUST NOT be the sole source of truth.
- Changes made on one device MUST be visible on another device within 30 seconds under
  normal network conditions.
- The UI MUST handle offline states gracefully: changes made offline MUST be queued and
  synced automatically when connectivity is restored, with clear user feedback.
- Conflict resolution for concurrent edits MUST follow a defined, documented strategy.
  Silent data loss is never acceptable.

**Rationale**: A task manager that fragments or loses data across devices is worse than a
paper list. Users expect their tasks to follow them seamlessly between phone, tablet,
and desktop.

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

**Version**: 1.1.0 | **Ratified**: 2026-03-11 | **Last Amended**: 2026-03-21
