# Tasks: Internationalisation (i18n) Hook Wiring

**Input**: Design documents from `/specs/002-i18n-hooks/`
**Prerequisites**: plan.md ✅ research.md ✅ data-model.md ✅ contracts/i18n-module.md ✅ quickstart.md ✅
**Branch**: `002-i18n-hooks`
**Date**: 2026-03-11

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete task dependencies)
- **[Story]**: User story label — US1 or US2 (omitted for Setup/Foundation/Polish phases)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Ensure project prerequisites are in place before any i18n code is written.

- [X] T001 Verify `compilerOptions.resolveJsonModule: true` is set in `tsconfig.json` (required for static `import en from "../../messages/en.json"`)
- [X] T002 Create `messages/en.json` at project root with all 29 baseline keys defined in `data-model.md` (namespaces: `nav`, `taskForm`, `taskList`, `taskItem`, `confirmAction`, `pages`)

---

## Phase 2: Foundation (Blocking Prerequisite)

**Purpose**: Implement the `t()` translation module that both user stories depend on. MUST be complete before Phase 3 or Phase 4 can begin.

**⚠️ CRITICAL**: TDD RED gate — T003 tests MUST be written and FAILING before T004 implementation begins (Constitution Principle IV is non-negotiable).

- [X] T003 Write `tests/unit/i18n.test.ts` — RED-phase unit tests for `createTranslator()`: returns value for known key; returns key name for missing key; substitutes single `{variable}`; leaves unresolved `{slot}` intact when variable absent; substitutes numeric variable as string; returns active-locale value when key exists; falls back to fallback messages for key absent from active locale (must FAIL before T004)
- [X] T004 Implement `src/lib/i18n.ts` — `MessageKey` type alias (`keyof typeof en`), `resolveMessages()` factory with `NEXT_PUBLIC_LOCALE` env var + `try/catch` fallback to English, frozen singleton `_messages`, exported `t(key, variables?)` function, exported `createTranslator(activeMessages, fallbackMessages?)` factory (GREEN against T003)

**Checkpoint**: Run `npm run test tests/unit/i18n.test.ts` — all tests GREEN before continuing.

---

## Phase 3: User Story 1 — All UI Strings Served from a Message File (Priority: P1) 🎯 MVP

**Goal**: Every user-facing string in `src/` is sourced from `messages/en.json` via `t()`. A developer searching `src/` for any of the 29 known string literals finds zero matches.

**Independent Test**: After all Phase 3 tasks complete, run `grep -rn "No open tasks\|No completed tasks\|What needs to be done\|Title is required\|Archive this task\|Mark task complete" src/` — must return no output.

- [X] T005 [P] [US1] Migrate `src/lib/taskValidation.ts` — replace hardcoded `"Title is required"` and `"Title cannot exceed 120 characters"` validation error strings with `t("taskForm.validationRequired")` and `t("taskForm.validationMaxLength")`; add `import { t } from "@/lib/i18n"` at top of file
- [X] T006 [P] [US1] Migrate `src/components/Nav.tsx` — replace hardcoded `"Open"`, `"Completed"`, `"Archived"` nav tab labels with `t("nav.open")`, `t("nav.completed")`, `t("nav.archived")`; add `import { t } from "@/lib/i18n"` at top of file
- [X] T007 [P] [US1] Migrate `src/components/TaskList.tsx` — replace three hardcoded empty-state message strings with `t("taskList.emptyOpen")`, `t("taskList.emptyCompleted")`, `t("taskList.emptyArchived")`; add import
- [X] T008 [US1] Migrate `src/components/TaskForm.tsx` — replace `"New task"` heading, `"What needs to be done?"` placeholder, `"Task title"` aria-label, `"Add"` submit button text, and all inline validation error message strings with `t("taskForm.*")` calls (validation message strings must pick up from T005); add import
- [X] T009 [US1] Migrate `src/components/TaskItem.tsx` — replace `"Complete"`, `"Edit"`, `"Archive"`, `"Save"`, `"Cancel"` button labels and all five `aria-label` attributes with `t("taskItem.*")` and `t("taskItem.*AriaLabel", { title })` interpolation calls; add import
- [X] T010 [US1] Migrate `src/components/ConfirmAction.tsx` — replace `"Archive this task?"` question, `"Yes, archive"` confirm button, `"Cancel"` cancel button, and `aria-label` with `t("confirmAction.question")`, `t("confirmAction.confirmButton")`, `t("confirmAction.cancelButton")`, `t("confirmAction.ariaLabel")`; add import
- [X] T011 [P] [US1] Migrate `src/app/page.tsx` — replace hardcoded `"Open Tasks"` page heading with `t("pages.open")`; add import
- [X] T012 [P] [US1] Migrate `src/app/completed/page.tsx` — replace hardcoded `"Completed Tasks"` page heading with `t("pages.completed")`; add import
- [X] T013 [P] [US1] Migrate `src/app/archived/page.tsx` — replace hardcoded `"Archived Tasks"` page heading with `t("pages.archived")`; add import
- [X] T014 [US1] Run SC-001 verification grep from `quickstart.md` Step 5 — confirm `grep -rn` for all 29 known user-facing string literals across `src/` returns zero matches; fix any remaining hardcoded strings found

**Checkpoint**: US1 complete — every user-facing string originates from `messages/en.json`. The grep check (T014) must pass with zero matches before proceeding to Phase 4.

---

## Phase 4: User Story 2 — Adding a New Locale Requires No Component Changes (Priority: P2)

**Goal**: Confirm the i18n abstraction is correct: adding `messages/fr.json` and setting `NEXT_PUBLIC_LOCALE=fr` renders the French strings in all three views with zero changes to any file in `src/`.

**Independent Test**: Follow `quickstart.md` Step 6 — create `messages/fr.json`, run `NEXT_PUBLIC_LOCALE=fr npm run dev`, verify French strings appear. No `src/` file modified.

- [X] T015 [US2] Write integration test `tests/integration/i18n-locale-switch.test.ts` — uses `createTranslator()` to simulate `"fr"` active locale with partial French message map; asserts French string returned for translated key; asserts English fallback returned for key absent from French map (TDD RED, must FAIL before T016)
- [X] T016 [US2] Extend `tests/integration/i18n-locale-switch.test.ts` GREEN phase — add test verifying `createTranslator(frMessages, enFallback)` behaviour covers FR-005 (missing key falls back gracefully); run `npm run test tests/integration/i18n-locale-switch.test.ts` to confirm all GREEN
- [X] T017 [US2] Run quickstart.md Step 6 locale-switching manual verification — create `messages/fr.json` translating `"nav.open"` (→`"Ouvrir"`) and `"pages.open"` (→`"Tâches ouvertes"`); start dev server with `NEXT_PUBLIC_LOCALE=fr`; confirm French strings render; confirm zero `src/` file modifications; delete `messages/fr.json` after verification

**Checkpoint**: US2 complete — locale abstraction validated. Both user stories now independently testable and complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final quality gates across both user stories.

- [X] T018 [P] Run TypeScript type-check — `npx tsc --noEmit` from project root; confirm zero errors from the `import en` static import and `require()` dynamic call in `src/lib/i18n.ts`; fix any type errors
- [X] T019 [P] Run ESLint — `npm run lint` from project root; confirm zero warnings and zero errors (the `eslint-disable` comment on the `require()` line in `i18n.ts` must be tightly scoped to that single line only)
- [X] T020 Run full test suite — `npm run test` from project root with coverage; confirm all existing 001-task-management tests still pass alongside new i18n tests; confirm `src/lib/i18n.ts` branch coverage ≥ 100%

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundation)**: Depends on Phase 1 completion — BLOCKS Phase 3 and Phase 4
- **Phase 3 (US1)**: Depends on Phase 2 completion — tasks within Phase 3 have limited internal dependencies (see below)
- **Phase 4 (US2)**: Depends on Phase 2 completion — CAN run in parallel with Phase 3 once Phase 2 is complete
- **Phase 5 (Polish)**: Depends on completion of both Phase 3 and Phase 4

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2. T008 depends on T005 (validation messages migrated). T014 depends on T005–T013 all complete.
- **User Story 2 (P2)**: Starts after Phase 2. Independent of US1 — T015–T017 can run concurrently with T005–T014.

### Within Phase 3 (US1 internal ordering)

| Task | Depends on                       |
| ---- | -------------------------------- |
| T005 | T004 (i18n.ts ready)             |
| T006 | T004                             |
| T007 | T004                             |
| T008 | T004, T005 (validation messages) |
| T009 | T004                             |
| T010 | T004                             |
| T011 | T004                             |
| T012 | T004                             |
| T013 | T004                             |
| T014 | T005–T013 all complete           |

T005, T006, T007, T009, T010, T011, T012, T013 are all independent of each other and can be worked in parallel.

---

## Parallel Execution Examples

### Phase 3 (US1) — after T004 is complete

```
T004 complete
    ├── T005 [taskValidation.ts]─────────────────────┐
    ├── T006 [Nav.tsx]                               │
    ├── T007 [TaskList.tsx]                          ├──→ T008 [TaskForm.tsx]
    ├── T009 [TaskItem.tsx]        (parallel)        │
    ├── T010 [ConfirmAction.tsx]                     │
    ├── T011 [app/page.tsx]                          │
    ├── T012 [completed/page.tsx]                    │
    └── T013 [archived/page.tsx]─────────────────────┘
                                                     ↓
                                                  T014 (SC-001 grep verify)
```

### Phase 4 (US2) — can run concurrently with Phase 3

```
T004 complete
    └── T015 (RED test) → T016 (GREEN) → T017 (manual verify)
```

### Phase 5 — after Phase 3 and Phase 4 both complete

```
    ├── T018 (tsc --noEmit)   ─┐
    ├── T019 (lint)            ├──→ T020 (full test suite + coverage)
```

---

## Implementation Strategy

### MVP Scope (Phase 1 + 2 + 3 = T001–T014)

Completing US1 alone delivers the constitution compliance requirement. US2 (T015–T017)
validates the abstraction quality but is not required for constitution compliance.
Recommended delivery order: ship MVP (T001–T014) first.

### Incremental Delivery

1. **T001–T002** (5 min): Create the JSON file — value visible immediately
2. **T003–T004** (30 min): TDD the `i18n.ts` module — core infrastructure in place
3. **T005–T007** (15 min): Migrate three independent files in parallel — quick wins
4. **T008–T010** (30 min): Migrate the three complex components
5. **T011–T013** (10 min): Migrate three page headings in parallel
6. **T014** (5 min): Run verification grep — confirm SC-001 passes
7. **T015–T017** (30 min): US2 integration tests + manual verification
8. **T018–T020** (15 min): Final quality gates

---

## Summary

| Phase        | Tasks     | Story | Description                                     |
| ------------ | --------- | ----- | ----------------------------------------------- |
| 1 Setup      | T001–T002 | —     | tsconfig verify + `messages/en.json`            |
| 2 Foundation | T003–T004 | —     | `i18n.ts` module (TDD RED → GREEN)              |
| 3 US1        | T005–T014 | US1   | Migrate all 9 source files + SC-001 grep verify |
| 4 US2        | T015–T017 | US2   | Locale-switch integration test + manual verify  |
| 5 Polish     | T018–T020 | —     | Type-check, lint, full test suite + coverage    |

**Total tasks**: 20  
**US1 task count**: 10 (T005–T014)  
**US2 task count**: 3 (T015–T017)  
**Parallel opportunities**: T005–T007, T009–T013 all parallel within Phase 3; Phase 4 parallel with Phase 3; T018–T019 parallel within Phase 5  
**MVP scope**: T001–T014 (Phases 1–3, delivers US1 — constitution MUST compliance)
