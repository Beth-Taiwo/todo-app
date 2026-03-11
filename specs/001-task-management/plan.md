# Implementation Plan: Task Management Web App

**Branch**: `001-task-management` | **Date**: 2026-03-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-task-management/spec.md`

## Summary

Build a client-rendered Next.js (App Router) web application that lets a single user create,
update, complete, and archive tasks. All state is persisted in `localStorage` — no backend or
database is required. The UI is built with React client components, styled with CSS Modules
(design tokens via CSS custom properties), and managed with `useReducer` + React Context.
Zero external state or UI libraries are introduced, satisfying Constitution Principle I.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18, Next.js 14 (App Router), CSS Modules (built-in to Next.js)  
**Storage**: Browser `localStorage` — JSON-serialised tasks array; no server or database  
**Testing**: Vitest 1.x + @testing-library/react 14.x + jsdom  
**Target Platform**: Modern web browsers (Chrome 120+, Firefox 121+, Safari 17+); responsive 320 px – 2560 px  
**Project Type**: Web application (client-side SPA shell inside Next.js App Router)  
**Performance Goals**: FCP ≤ 1.5 s; UI interaction feedback ≤ 100 ms (SC-002, SC-003)  
**Constraints**: Minimal libraries (no external state manager, no UI component lib, no forms
lib); offline-capable via `localStorage`; WCAG 2.1 AA throughout  
**Scale/Scope**: Single-user; 3 filtered views (Open, Completed, Archived); ~10 components

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                | Gate                                                                                | Status  | Notes                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| I. Radical Simplicity    | No unnecessary deps; YAGNI                                                          | ✅ PASS | React Context + useReducer replaces any state library; CSS Modules replaces any CSS-in-JS; no UI kit    |
| II. Delightful UX        | Feedback ≤ 100 ms; deliberate empty/error/loading states                            | ✅ PASS | Optimistic reducer updates; explicit empty-state per view; archive requires inline confirmation         |
| III. Readability         | Max 40-line functions, 150-line components; descriptive names; automated format     | ✅ PASS | TypeScript enforces naming; components split by single responsibility; ESLint + Prettier                |
| IV. TDD (NON-NEGOTIABLE) | Tests before implementation; Red-Green-Refactor                                     | ✅ PASS | Vitest + RTL; unit tests for reducer/validation; integration tests per user story                       |
| V. Accessibility         | WCAG 2.1 AA; keyboard-navigable; no colour-only info; 44×44 px touch targets        | ✅ PASS | Semantic HTML; aria labels on controls; Escape key cancels edit; role="dialog" on confirm strip         |
| Code Quality             | Lint + format zero-warnings; all public interfaces typed                            | ✅ PASS | ESLint (Next.js built-in config) + Prettier; all component props and context typed                      |
| UX & Interaction         | FCP ≤ 1.5 s; destructive actions confirmed; inline validation immediate; responsive | ✅ PASS | `<ConfirmAction>` component guards archive; title validates on `input` event; CSS tokens enforce system |

**Post-design re-check**: See end of document — completed after Phase 1.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── task-types.md    # TypeScript type contracts (Task, TaskStatus, reducer actions)
│   └── context-api.md   # TaskContext hook API contract
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                  # Root layout: Nav + TaskProvider shell
│   ├── page.tsx                    # Open tasks view
│   ├── completed/
│   │   └── page.tsx                # Completed tasks view
│   └── archived/
│       └── page.tsx                # Archived tasks view
├── components/
│   ├── TaskForm.tsx                # Add-task form with inline validation
│   ├── TaskItem.tsx                # Single task row: view mode + inline edit mode
│   ├── TaskList.tsx                # Renders filtered list + empty state
│   ├── Nav.tsx                     # Open / Completed / Archived tab navigation
│   └── ConfirmAction.tsx           # Inline confirm/cancel strip (archive guard)
├── context/
│   └── TaskContext.tsx             # React context provider + useTaskContext hook
├── lib/
│   ├── taskReducer.ts              # Pure reducer: all task state transitions + action types
│   ├── taskStorage.ts              # localStorage load/save helpers
│   └── taskValidation.ts           # Title validation rules (pure functions)
├── styles/
│   ├── tokens.css                  # Design tokens: colours, spacing, typography scale
│   ├── globals.css                 # CSS reset + token import
│   └── *.module.css                # Per-component CSS Modules (co-located with components)
└── types/
    └── task.ts                     # Task interface + TaskStatus enum + Action discriminated union

tests/
├── unit/
│   ├── taskReducer.test.ts         # All reducer action branches
│   ├── taskValidation.test.ts      # All validation rule paths
│   └── taskStorage.test.ts         # localStorage read/write + hydration edge cases
├── integration/
│   ├── createTask.test.tsx         # US1 end-to-end: add form → list update → persist
│   ├── completeTask.test.tsx       # US2 end-to-end: complete → removed from open → completed view
│   ├── updateTask.test.tsx         # US3 end-to-end: edit mode → save/cancel → persist
│   └── archiveTask.test.tsx        # US4 end-to-end: confirm archive → archived view → restore
└── contract/
    └── taskSchema.test.ts          # Validates persisted JSON shape matches Task interface
```

**Structure Decision**: Single Next.js project with App Router. No backend — all persistence
is via `localStorage`. Logic, UI, and types are cleanly separated into `lib/`, `components/`,
and `types/`. Three route segments map directly to the three task views required by FR-008.

## Complexity Tracking

> No constitution violations detected. No entry required.

---

## Post-Design Constitution Re-Check (Phase 1 complete)

| Principle             | Re-check result                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| I. Radical Simplicity | ✅ PASS — single flat array in localStorage; reducer covers all transitions without extra abstractions   |
| II. Delightful UX     | ✅ PASS — empty states defined per view in data-model; error rollback on storage failure specified       |
| III. Readability      | ✅ PASS — discriminated union actions make reducer branches self-documenting                             |
| IV. TDD               | ✅ PASS — every public function in `lib/` has a unit test file; every user story has an integration test |
| V. Accessibility      | ✅ PASS — contracts specify `aria-label` requirements; ConfirmAction uses `role="dialog"`                |
