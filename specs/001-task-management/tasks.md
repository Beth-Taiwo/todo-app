---
description: "Task list for 001-task-management — Task Management Web App"
---

# Tasks: Task Management Web App

**Input**: Design documents from `/specs/001-task-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Included — Constitution Principle IV (TDD) is NON-NEGOTIABLE; all unit and
integration tests must be written before their corresponding implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented,
tested, and demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

## Path Conventions

- Source: `src/app/`, `src/components/`, `src/context/`, `src/lib/`, `src/styles/`, `src/types/`
- Tests: `tests/unit/`, `tests/integration/`, `tests/contract/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the Next.js project, install test tooling, scaffold the directory
structure, and establish design tokens. All other phases depend on this phase.

- [X] T001 Scaffold Next.js 14 project at the repo root using `npx create-next-app@14 . --typescript --eslint --no-tailwind --src-dir --app --import-alias "@/*"` per quickstart.md
- [X] T002 [P] Install Vitest dev dependencies: `npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`
- [X] T003 [P] Create `vitest.config.ts` at repo root (jsdom environment, globals: true, `@/*` alias resolving to `./src`, setupFiles pointing to `tests/setup.ts`) and create `tests/setup.ts` that imports `@testing-library/jest-dom`; add `"test"` and `"test:watch"` scripts to `package.json`
- [X] T004 [P] Create directory scaffold: `src/components` `src/context` `src/lib` `src/styles` `src/types` `src/app/completed` `src/app/archived` `tests/unit` `tests/integration` `tests/contract`
- [X] T005 [P] Create `src/styles/tokens.css` with CSS custom properties for all colour, spacing, typography, border-radius, and touch-target tokens per quickstart.md; create `src/styles/globals.css` with a CSS reset that imports `tokens.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type definitions, pure business logic (validation, reducer, storage), the
context provider, Nav, and root layout. Every user story phase depends on this phase
being fully complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Types

- [X] T006 Define `Task` interface, `TaskStatus` union type (`"open" | "completed" | "archived"`), `TaskAction` discriminated union (8 action variants), and `ValidationResult` interface in `src/types/task.ts` per `contracts/task-types.md`

### Tests for Foundation ⚠️

> **RED gate — write all tests below first, then run `npm test` and confirm they ALL FAIL before proceeding to the implementation section**

- [X] T007 [P] Write contract test asserting that a valid `Task` JSON object matches every required field name and type from the `Task` interface in `tests/contract/taskSchema.test.ts`
- [X] T008 [P] Write unit tests covering VR-001 (empty string), VR-002 (whitespace-only), VR-003 (>200 chars), and the valid path for `validateTitle()` in `tests/unit/taskValidation.test.ts`
- [X] T009 [P] Write unit tests for all 8 `taskReducer` action branches (HYDRATE, ADD_TASK, UPDATE_TASK, COMPLETE_TASK, ARCHIVE_TASK, RESTORE_TASK, START_EDIT, CANCEL_EDIT) including invalid transition guards (`completed → open`, `completed → archived`, `archived → completed`) in `tests/unit/taskReducer.test.ts`
- [X] T010 [P] Write unit tests for `loadTasks()` (happy path, empty storage, corrupt JSON fallback to `[]`) and `saveTasks()` (serialises and writes to `localStorage`) in `tests/unit/taskStorage.test.ts`

### Implementation for Foundation

- [X] T011 [P] Implement `validateTitle(title: string): ValidationResult` pure function covering VR-001, VR-002, VR-003 in `src/lib/taskValidation.ts` so that tests in `tests/unit/taskValidation.test.ts` pass
- [X] T012 [P] Implement `taskReducer(state: Task[], action: TaskAction): Task[]` covering all 8 action branches with UUID v4 generation for `ADD_TASK` (use `crypto.randomUUID()`) and invalid-transition guards in `src/lib/taskReducer.ts` so that tests in `tests/unit/taskReducer.test.ts` pass
- [X] T013 [P] Implement `loadTasks(): Task[]` (parses `localStorage["todo-app:tasks"]`, returns `[]` on missing or corrupt JSON) and `saveTasks(tasks: Task[]): void` in `src/lib/taskStorage.ts` so that tests in `tests/unit/taskStorage.test.ts` pass
- [X] T014 Implement `TaskProvider` component using `useReducer(taskReducer, [])` with a `useEffect` that hydrates state once from `loadTasks()` on mount and saves via `saveTasks()` after every dispatch; expose `useTaskContext(): TaskContextValue` hook that throws outside the provider; implement all mutator wrappers per `contracts/context-api.md` in `src/context/TaskContext.tsx` (depends on T011, T012, T013)
- [X] T015 [P] Create `Nav` component rendering `<Link>` elements to `/`, `/completed`, and `/archived` using `usePathname()` for active-link highlighting; all links must be keyboard navigable with minimum 44 px touch targets; in `src/components/Nav.tsx` and `src/components/Nav.module.css` using design tokens
- [X] T016 Create root layout in `src/app/layout.tsx` that wraps `{children}` in `<TaskProvider>`, renders `<Nav>` above the main content, and imports `src/styles/globals.css` (depends on T014, T015)

**Checkpoint**: Foundation ready. Run `npm test` — contract test T007, all unit tests T008–T010, and their implementations T011–T013 must all PASS. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 — Create a Task (Priority: P1) 🎯 MVP

**Goal**: User can type a task title (and optionally a description), submit the form, see
the new task instantly at the top of the open list, and find it still there after a page
refresh.

**Independent Test**: Open the app at `/` with an empty list. Submit the "Add task" form
with a valid title. Verify the task card appears at index 0. Refresh the page. Verify the
task persists.

### Tests for User Story 1 ⚠️

> **Write this test FIRST — must FAIL before implementing T018–T021**

- [X] T017 [P] [US1] Write integration test covering: render app → submit `TaskForm` with a valid title → assert new task item appears in list → assert title input cleared → assert `localStorage["todo-app:tasks"]` updated; also assert form submission blocked when title is empty in `tests/integration/createTask.test.tsx`

### Implementation for User Story 1

- [X] T018 [P] [US1] Create `TaskList` component that maps over a `tasks: Task[]` prop to render a `<TaskItem>` per task and renders an empty-state `<p>` with the appropriate message when the array is empty in `src/components/TaskList.tsx` and `src/components/TaskList.module.css`
- [X] T019 [P] [US1] Create `TaskItem` base component displaying task `title`, `description` (only when non-empty), and formatted `createdAt` timestamp in a read-only semantic list item in `src/components/TaskItem.tsx` and `src/components/TaskItem.module.css` (long titles must not overflow; uses `var(--space-*)` tokens only)
- [X] T020 [P] [US1] Create `TaskForm` component with a controlled `<input>` for title, an optional `<textarea>` for description, real-time inline validation error displayed below the title input on every `input` event (VR-001/VR-002/VR-003 via `validateTitle()`), and a submit handler that calls `addTask()` then clears the inputs; submit button disabled while title is invalid in `src/components/TaskForm.tsx` and `src/components/TaskForm.module.css`
- [X] T021 [US1] Implement Open tasks page `"use client"` composing `<TaskForm>` above `<TaskList tasks={openTasks} />` with the empty-state message "No open tasks — add one above" in `src/app/page.tsx` (depends on T017–T020 and T016)

**Checkpoint**: User Story 1 fully functional and independently testable. Run `npm test -- tests/integration/createTask` — must PASS.

---

## Phase 4: User Story 2 — Complete a Task (Priority: P2)

**Goal**: User can mark any open task complete; it disappears from the open list and appears
in the Completed view with the date/time it was completed, in reverse-chronological order.

**Independent Test**: Load `/` with one open task. Activate the Complete control. Verify
the task is removed from the open list immediately. Navigate to `/completed`. Verify the
task is present with a `completedAt` timestamp.

### Tests for User Story 2 ⚠️

> **Write this test FIRST — must FAIL before implementing T023–T024**

- [X] T022 [P] [US2] Write integration test covering: render open task → click/activate "Mark task complete" button → assert task removed from open list → render Completed page → assert task present with formatted `completedAt` value in `tests/integration/completeTask.test.tsx`

### Implementation for User Story 2

- [X] T023 [US2] Add a "Mark task complete" button (`aria-label="Mark task complete"`, min 44 px touch target) to `TaskItem`'s read-view, wired to `completeTask(task.id)` from context; only render this button when the task has `status === "open"` in `src/components/TaskItem.tsx`
- [X] T024 [US2] Implement Completed tasks page `"use client"` composing `<TaskList tasks={completedTasks} />` where each task displays its formatted `completedAt` timestamp; empty-state message: "No completed tasks yet" in `src/app/completed/page.tsx` (pass a `view="completed"` prop to `TaskList` so `TaskItem` knows which action buttons to render)

**Checkpoint**: User Story 2 fully functional and independently testable. Run `npm test -- tests/integration/completeTask` — must PASS.

---

## Phase 5: User Story 3 — Update a Task (Priority: P3)

**Goal**: User can click Edit on any open task to enter inline edit mode with pre-filled
inputs; changes save immediately and persist on refresh; pressing Escape or Cancel discards
changes; editing is impossible on completed or archived tasks.

**Independent Test**: Load `/` with one open task. Activate the Edit control. Verify the
task title becomes an editable field with focus. Clear the title — verify Save is blocked
with an inline error. Type a new title. Click Save. Verify updated title shown. Refresh.
Verify persisted.

### Tests for User Story 3 ⚠️

> **Write this test FIRST — must FAIL before implementing T026–T027**

- [X] T025 [P] [US3] Write integration test covering: render open task → click "Edit task" → assert edit form appears with pre-filled title → clear title → assert Save blocked with validation error → type valid new title → click Save → assert updated title in list → assert single `editingTaskId` constraint (opening second edit form closes the first); also assert Escape key triggers cancel in `tests/integration/updateTask.test.tsx`

### Implementation for User Story 3

- [X] T026 [US3] Add "Edit task" button (`aria-label="Edit task"`, min 44 px, only on `status === "open"` tasks) to `TaskItem`'s read-view calling `startEdit(task.id)`; button must not appear when `task.status !== "open"` in `src/components/TaskItem.tsx`
- [X] T027 [US3] Add inline edit mode branch to `TaskItem`: when `editingTaskId === task.id`, render a controlled title `<input>` (pre-filled, auto-focused) and description `<textarea>` (pre-filled) with real-time validation via `validateTitle()`, a Save button (disabled while invalid) calling `updateTask(task.id, title, description)` then `cancelEdit()`, a Cancel button calling `cancelEdit()`, and a `keydown` handler on the form that calls `cancelEdit()` on Escape in `src/components/TaskItem.tsx`

**Checkpoint**: User Story 3 fully functional and independently testable. Run `npm test -- tests/integration/updateTask` — must PASS. Verify only one task can be in edit mode at a time.

---

## Phase 6: User Story 4 — Archive a Task (Priority: P4)

**Goal**: User can archive any open task after confirming an inline prompt; the task is
removed from the open list, appears in the Archived view, and can be restored to the open
list via a Restore button.

**Independent Test**: Load `/` with one open task. Click Archive. Verify an inline confirm
strip appears (task remains in list until confirmed). Click Confirm. Verify task removed
from open list. Navigate to `/archived`. Verify task listed. Click Restore. Verify task
back in `/`.

### Tests for User Story 4 ⚠️

> **Write these tests FIRST — must FAIL before implementing T029–T032**

- [X] T028 [P] [US4] Write integration test covering: render open task → click "Archive task" → assert inline confirm strip appears (task still in list) → click Cancel → assert no change → click "Archive task" again → click Confirm → assert task removed from open list → render Archived page → assert task present → click "Restore task" → assert task back in open list in `tests/integration/archiveTask.test.tsx`

### Implementation for User Story 4

- [X] T029 [P] [US4] Create `ConfirmAction` component that accepts `message: string`, `onConfirm: () => void`, and `onCancel: () => void` props; renders a `<div role="status" aria-live="polite">` containing the message, a Confirm button, and a Cancel button (both min 44 px); all keyboard accessible in `src/components/ConfirmAction.tsx` and `src/components/ConfirmAction.module.css`
- [X] T030 [US4] Add "Archive task" button (`aria-label="Archive task"`, min 44 px, only on `status === "open"` tasks) to `TaskItem`'s read-view that sets a local `isConfirmingArchive` boolean state; when `true` replace the Archive button with a `<ConfirmAction>` strip whose `onConfirm` calls `archiveTask(task.id)` and `onCancel` resets `isConfirmingArchive` to `false` in `src/components/TaskItem.tsx` (depends on T029)
- [X] T031 [US4] Implement Archived tasks page `"use client"` composing `<TaskList tasks={archivedTasks} view="archived" />` with empty-state "No archived tasks"; each task row must show a "Restore task" button (`aria-label="Restore task"`, 44 px) wired to `restoreTask(task.id)` in `src/app/archived/page.tsx`
- [X] T032 [US4] Add a `view: "open" | "completed" | "archived"` prop to `TaskList` and `TaskItem`; `TaskItem` uses this prop to conditionally render action buttons: `open` view shows Complete + Edit + Archive buttons; `archived` view shows Restore button only; `completed` view shows no action buttons; update all three page components to pass the correct `view` prop in `src/components/TaskList.tsx`, `src/components/TaskItem.tsx`, `src/app/page.tsx`, `src/app/completed/page.tsx`, and `src/app/archived/page.tsx`

**Checkpoint**: All four User Stories fully functional and independently testable. Run the full integration suite `npm test -- tests/integration` — all four tests must PASS.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility audit, responsive layout, code quality gates, and final build
verification across all new files.

- [X] T033 Audit all interactive elements in `src/components/` for WCAG 2.1 AA: verify every button and link has a descriptive `aria-label` or visible text label; confirm focus-visible styles are present (not suppressed); verify `ConfirmAction` announces via `aria-live`; verify Escape key cancels both inline edit (T027) and confirm strip (T030); verify tab order follows visual DOM order; fix any gaps found
- [X] T034 Apply responsive CSS rules across all `*.module.css` files: use fluid widths with a `max-width` container centred on wide viewports; add `word-break: break-word` on task title elements so 200-character titles do not overflow on 320 px viewports; verify no horizontal scrollbar appears at 320 px, 768 px, 1280 px, or 2560 px viewport widths
- [X] T035 Run `npm run lint` across all `src/` files and fix every ESLint warning until the output is clean (zero warnings, zero errors); run Prettier format check and apply auto-fix to all changed files; confirm `package.json` has no unused `devDependencies`
- [X] T036 Run full test suite `npm test` — all 37 test assertions across contract, unit, and integration test files must PASS with zero failures and zero skipped tests; fix any failures before proceeding
- [X] T037 Run `npm run build` and confirm zero TypeScript compile errors and zero build warnings; verify the production bundle does not introduce any unexpected large chunks by inspecting Next.js build output

---

## Dependencies (Story Completion Order)

```
Phase 1 (Setup)
  └── Phase 2 (Foundation — blocks all stories)
            ├── Phase 3 (US1 — MVP, independently testable after Foundation)
            │         └── Phase 4 (US2 — extends TaskItem from US1)
            │                   └── Phase 5 (US3 — extends TaskItem from US2)
            │                             └── Phase 6 (US4 — extends TaskItem from US3)
            │                                       └── Phase 7 (Polish)
            └── (Phase 3–6 are sequentially dependent via TaskItem extensions)
```

**Story independence**: Each story phase delivers a complete, independently demonstrable
feature slice. The sequential dependency exists only because each story extends
`TaskItem.tsx`; the business logic (reducer, context) is story-agnostic and fully
complete after Phase 2.

---

## Parallel Execution Examples

### Phase 1 — after T001

```
T001 (scaffold project)
  → [T002 (install deps) | T003 (vitest config) | T004 (dirs) | T005 (tokens)]
```

### Phase 2 — after T006

```
T006 (types)
  → [T007 (contract test) | T008 (validation test) | T009 (reducer test) | T010 (storage test)]
    ← RED gate: all tests must fail ←
  → [T011 (implement validation) | T012 (implement reducer) | T013 (implement storage)]
  → T014 (context, depends on T011+T012+T013)
  + T015 (Nav, parallel with T014)
  → T016 (root layout, depends on T014+T015)
```

### Phase 3 — User Story 1

```
[T017 (integration test) | T018 (TaskList) | T019 (TaskItem) | T020 (TaskForm)]
  → T021 (Open page, depends on T017–T020)
```

### Phase 6 — User Story 4

```
[T028 (integration test) | T029 (ConfirmAction)]
  → T030 (TaskItem archive, depends on T029)
  → T031 (Archived page)
  → T032 (view prop propagation)
```

---

## Implementation Strategy

- **MVP scope**: Phase 1 + Phase 2 + Phase 3 only — delivers a fully working task creation
  app with persistence, real-time validation, and a proper empty state. Demonstrable to
  users after T021.
- **Incremental delivery**: Each of Phase 4, 5, and 6 adds one independently demonstrable
  user story on top of the MVP.
- **TDD discipline**: Within every phase, complete the test task(s) first, run `npm test`
  to confirm RED, then implement until GREEN. Never skip the RED gate.
- **Single edit session invariant**: `editingTaskId` in context is a single string | null.
  Opening any edit form automatically collapses any other — the concurrent-edit edge case
  from the spec is handled architecturally, not defensively.
