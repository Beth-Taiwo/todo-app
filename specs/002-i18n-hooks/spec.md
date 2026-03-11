# Feature Specification: Internationalisation (i18n) Hook Wiring

**Feature Branch**: `002-i18n-hooks`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User description: "Add internationalisation (i18n) hook wiring so all user-facing strings are loaded from a locale message file rather than hardcoded in components"

## Context

This feature implements the i18n requirement mandated by the Todo App Constitution
(Principle V — Accessibility & Inclusivity): _"Internationalisation hooks MUST be in place
from the start, even if only one locale ships initially."_

The goal is not full multi-language support. It is to establish the plumbing — a single
source-of-truth message file per locale and a lightweight lookup mechanism — so that
translating the app to a second language never requires touching component source files.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - All UI Strings Served from a Message File (Priority: P1)

A developer opening the codebase can find every user-facing string in one locale file
(`messages/en.json`) rather than scattered across components. When a string needs changing
or translating, the developer edits only the message file.

**Why this priority**: This is the foundational deliverable of i18n wiring. Without a
central message file, the whole feature has no value.

**Independent Test**: Search the `src/` tree for any hardcoded user-facing string (e.g.,
"No open tasks", "Mark task complete", "Archive task"). Confirm zero matches — all such
strings originate from `messages/en.json` via the `t()` helper.

**Acceptance Scenarios**:

1. **Given** the `messages/en.json` file exists, **When** a developer searches `src/` for
   any literal user-facing string (button labels, empty-state messages, validation errors,
   aria-labels), **Then** no hardcoded string is found — all originate from the message
   file.
2. **Given** the app is running, **When** a key is looked up via `t("someKey")`, **Then**
   the corresponding string from `messages/en.json` is returned.
3. **Given** a missing key is requested via `t("nonExistent")`, **Then** the key name
   itself is returned (safe fallback) and a console warning is emitted in development mode
   so missing keys are visible without crashing the app.

---

### User Story 2 - Adding a New Locale Requires No Component Changes (Priority: P2)

A developer can add a second locale (e.g., French) by creating `messages/fr.json` with
the same key structure as `messages/en.json` and setting the active locale — no component
source files need modification.

**Why this priority**: This validates that the abstraction is correct. If components still
need to change when adding a locale, the wiring is incomplete.

**Independent Test**: Copy `messages/en.json` to `messages/fr.json`, translate two strings,
set the active locale to `"fr"`, render the app, and verify the two translated strings
appear in the UI without any change to component files.

**Acceptance Scenarios**:

1. **Given** `messages/fr.json` exists with the same keys as `messages/en.json`, **When**
   the active locale is set to `"fr"` (e.g., via an environment variable or config flag),
   **Then** the app renders French strings without any changes to component source files.
2. **Given** a key exists in `messages/en.json` but is missing in `messages/fr.json`,
   **When** that key is looked up in the `"fr"` locale, **Then** the English fallback string
   is used and a console warning is emitted (graceful degradation, no crash).

---

### Edge Cases

- **Missing message file at startup**: If the active locale's message file cannot be loaded,
  the app MUST fall back to English strings and emit a clear console error — it MUST NOT
  crash or render a blank screen.
- **Key with embedded variable (interpolation)**: Some strings contain dynamic values
  (e.g., a count: _"3 tasks completed"_). The lookup mechanism MUST support simple
  `{variable}` placeholder substitution.
- **Empty message file**: If `messages/en.json` exists but is empty or malformed JSON, the
  app MUST fall back gracefully and surface an actionable developer error message.
- **Build-time vs runtime loading**: Message files MUST be ready at component render time
  with no async loading gap that would cause a momentary blank label.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST store all user-facing strings in a locale message file
  (`messages/en.json`) using a flat or lightly-nested key-value structure.
- **FR-002**: The system MUST provide a `t(key: string, variables?: Record<string, string | number>): string` lookup function that returns the string for the given key from the active locale's message file.
- **FR-003**: The `t()` function MUST support simple `{variable}` placeholder substitution
  for strings that embed dynamic values (e.g., `"Task {title} archived"`).
- **FR-004**: When a requested key does not exist in the active locale's message file, the
  `t()` function MUST return the key name as a safe fallback and MUST emit a `console.warn`
  in development mode.
- **FR-005**: When the active locale's message file is missing or malformed, the system MUST
  automatically fall back to the English (`"en"`) message file without crashing.
- **FR-006**: All user-facing strings currently hardcoded in components (button labels,
  empty-state messages, validation error messages, `aria-label` values, page headings) MUST
  be migrated to `messages/en.json` and replaced with `t()` calls.
- **FR-007**: The active locale MUST be configurable without modifying component source
  files (e.g., via a config constant, context value, or environment variable).
- **FR-008**: The `t()` function and message-loading mechanism MUST add zero runtime
  performance overhead perceptible to the user (strings resolved synchronously at render
  time using a pre-loaded in-memory map).

### Key Entities

- **Message File** (`messages/{locale}.json`): A JSON file keyed by dot-notation string
  identifiers (e.g., `"tasks.emptyOpen"`, `"actions.complete"`) with string values. One
  file per supported locale. `en` is the required baseline.
- **Locale Key**: A BCP 47 language tag string (e.g., `"en"`, `"fr"`, `"es"`) identifying
  which message file is active.
- **Translation Function** (`t()`): A pure function (or hook wrapper) that accepts a key
  and optional variable map, looks up the active locale messages, performs substitution,
  and returns the final string.

## Assumptions

- Only English (`"en"`) ships initially. French (`"fr"`) is used as a test case in US2
  acceptance criteria only — it need not be shipped as a supported locale.
- Message files are statically imported at build time (no HTTP fetch), which satisfies
  FR-008 (zero runtime async gap) and is consistent with the no-backend architecture.
- The `t()` function is a plain module export (not a React hook), making it usable in
  both component render trees and non-component code (e.g., `taskValidation.ts` error
  messages). A React context wrapper for locale-switching is deferred as a future
  enhancement (YAGNI — Constitution Principle I).
- `aria-label` strings used in `src/components/` are considered user-facing and MUST be
  in the message file (they are read aloud by screen readers).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A search of the entire `src/` directory for any of the 20+ known user-facing
  string literals returns zero matches — all are sourced via `t()` calls.
- **SC-002**: Adding `messages/fr.json` with translated values and switching the active
  locale causes the French strings to render in all three views without any changes to
  files under `src/`.
- **SC-003**: The `t()` function call resolves in under 1 ms per invocation on a mid-range
  device (in-memory lookup; no async overhead).
- **SC-004**: A new developer can identify every user-facing string in the application by
  reading a single file (`messages/en.json`) in under 5 minutes.
