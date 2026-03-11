# Implementation Plan: Internationalisation (i18n) Hook Wiring

**Branch**: `002-i18n-hooks` | **Date**: 2026-03-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-i18n-hooks/spec.md`

## Summary

Wire a lightweight i18n foundation into the existing Next.js 14 / React 18 todo app so that
every user-facing string is sourced from `messages/en.json` via a pure `t(key, variables?)`
function rather than being hardcoded in components. No new runtime dependencies are
introduced. Message files are statically imported at build time to guarantee zero async
overhead (FR-008). The active locale is controlled by the `NEXT_PUBLIC_LOCALE` environment
variable so locale switching requires no component changes (FR-007, US2).

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18, Next.js 14 (App Router) — **zero new dependencies added**  
**Storage**: N/A — message files are static JSON bundled at build time; no runtime fetch  
**Testing**: Vitest 1.x + @testing-library/react 14.x + jsdom (unchanged from 001)  
**Target Platform**: Modern web browsers — same as 001-task-management  
**Project Type**: Cross-cutting concern added to existing Next.js web application  
**Performance Goals**: `t()` call resolves in < 1 ms (synchronous in-memory map lookup); zero
impact on FCP ≤ 1.5 s budget  
**Constraints**: Zero new npm dependencies; English-only initially; `t()` must be a plain
module export (not a React hook) so it works in both component and non-component code  
**Scale/Scope**: ~29 message keys across 6 namespaces; 1 locale file initially; up to N files
for N future locales

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                | Gate                                                     | Status  | Notes                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Radical Simplicity    | No unnecessary deps; YAGNI                               | ✅ PASS | Zero new dependencies — pure TypeScript module export; no i18next / react-intl / next-intl; React context wrapper for runtime locale switching explicitly deferred (YAGNI) |
| II. Delightful UX        | Feedback ≤ 100 ms; deliberate states                     | ✅ PASS | Synchronous in-memory lookup — no async gap, no blank labels during render; missing key falls back to key name (safe, visible in dev via console.warn)                     |
| III. Readability         | Max 40-line functions; descriptive names                 | ✅ PASS | `t("taskList.emptyOpen")` reads as self-documenting intent; `i18n.ts` is a single-responsibility module well under 40 lines                                                |
| IV. TDD (NON-NEGOTIABLE) | Tests before implementation; Red-Green-Refactor          | ✅ PASS | Unit tests for `t()` written first: missing key, variable substitution, fallback locale; integration tests verify zero hardcoded strings in rendered components            |
| V. Accessibility         | WCAG 2.1 AA; i18n hooks MUST be present                  | ✅ PASS | This feature **directly implements** the i18n MUST from Principle V; aria-labels are included in FR-006 migration scope                                                    |
| Code Quality             | Lint + format zero-warnings; all public interfaces typed | ✅ PASS | `MessageKey` type alias derived from `keyof typeof en` — auto-updated when keys are added; `resolveJsonModule: true` in tsconfig                                           |
| UX & Interaction         | FCP ≤ 1.5 s; responsive                                  | ✅ PASS | Static import bundled by Next.js — no extra network round-trip; no impact on FCP budget                                                                                    |

**Post-design re-check**: See end of document — completed after Phase 1.

## Project Structure

### Documentation (this feature)

```text
specs/002-i18n-hooks/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── i18n-module.md   # TypeScript interface contract for src/lib/i18n.ts
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

New files and modified files added by this feature to the existing project layout:

```text
messages/                           # NEW — locale message files (project root, not src/)
├── en.json                         # NEW — all 29 English user-facing strings

src/
├── app/
│   ├── page.tsx                    # MODIFY — replace hardcoded heading with t()
│   ├── completed/
│   │   └── page.tsx                # MODIFY — replace hardcoded heading with t()
│   └── archived/
│       └── page.tsx                # MODIFY — replace hardcoded heading with t()
├── components/
│   ├── TaskForm.tsx                # MODIFY — replace hardcoded strings with t()
│   ├── TaskItem.tsx                # MODIFY — replace hardcoded strings with t()
│   ├── TaskList.tsx                # MODIFY — replace hardcoded empty-state strings with t()
│   ├── Nav.tsx                     # MODIFY — replace hardcoded nav labels with t()
│   └── ConfirmAction.tsx           # MODIFY — replace hardcoded strings with t()
└── lib/
    ├── i18n.ts                     # NEW — t() function + locale loading
    └── taskValidation.ts           # MODIFY — replace hardcoded error messages with t()

tests/
└── unit/
    └── i18n.test.ts                # NEW — unit tests for t() (TDD RED before i18n.ts)
```

**Structure Decision**: `messages/` lives at the project root (not inside `src/`) following
the Next.js convention of placing locale assets alongside `public/`. This keeps message files
accessible to both Next.js build tooling and any future server-side code without path
gymnastics. The `src/lib/i18n.ts` module is a plain TypeScript module — no framework coupling.

## Complexity Tracking

> No constitution violations detected. No entry required.

---

## Post-Design Constitution Re-Check (Phase 1 complete)

| Principle             | Re-check result                                                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Radical Simplicity | ✅ PASS — `i18n.ts` is 40 lines; `createTranslator` and `t` share identical substitution logic; zero new npm packages; `require()` used for non-English locales to stay synchronous without bundling unused files          |
| II. Delightful UX     | ✅ PASS — data-model confirms all 29 string keys including empty states, validation messages, and aria-labels; missing-key fallback to key name prevents blank labels                                                      |
| III. Readability      | ✅ PASS — contracts confirm `MessageKey = keyof typeof en` auto-maintains the type; `t("taskList.emptyOpen")` is self-documenting at every call site                                                                       |
| IV. TDD               | ✅ PASS — quickstart defines tests-first order: `i18n.test.ts` (RED) before `i18n.ts` (GREEN); integration tests per component verify zero hardcoded strings after migration                                               |
| V. Accessibility      | ✅ PASS — all 5 `taskItem.*AriaLabel` keys with `{title}` interpolation are defined in data-model; confirmAction.ariaLabel included; this feature closes the constitution MUST violation identified in analysis finding U1 |
| Code Quality          | ✅ PASS — `MessageKey` type is auto-derived; `Object.freeze()` on message maps prevents accidental mutation; ESLint disable comment scoped tightly to the `require()` line                                                 |
| UX & Interaction      | ✅ PASS — synchronous module-init loading confirmed in research Decision 2; no async gaps possible; FCP budget unchanged                                                                                                   |
