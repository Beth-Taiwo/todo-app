# Research: Task Management Web App

**Branch**: `001-task-management` | **Date**: 2026-03-11

All questions raised during Technical Context analysis are resolved here.

---

## Decision 1: Storage Strategy

**Decision**: `localStorage` with JSON serialisation of a flat tasks array.

**Rationale**:

- The spec requires single-user task management with no mention of multi-device sync,
  authentication, or a backend — `localStorage` satisfies FR-009 (persist across reloads)
  with zero infrastructure.
- A flat array is sufficient for the known scale (~hundreds of tasks); no normalisation,
  indexing, or query layer is needed, satisfying Constitution Principle I (Radical Simplicity).
- IndexedDB would be more robust for large data sets but is significantly more complex to
  use; overkill for this scope.

**Alternatives considered**:

- `sessionStorage` — rejected: data lost on tab close, violating FR-009.
- IndexedDB — rejected: async API adds complexity for no benefit at this scale.
- Server-side database (SQLite, PostgreSQL) — rejected: requires backend, contradicts
  "minimal libraries" constraint and the single-user scope.

**Storage key**: `"todo-app:tasks"` (namespaced to avoid collisions).

**Hydration note**: `localStorage` is unavailable during Next.js server-side rendering.
The `TaskContext` provider MUST initialise state with an empty array and hydrate from
`localStorage` inside a `useEffect`. This avoids server/client hydration mismatches.

---

## Decision 2: State Management

**Decision**: React `useReducer` + `React.createContext` (built-in; zero external dependency).

**Rationale**:

- The task state machine has a small, well-defined set of transitions (`open → completed`,
  `open → archived`, `archived → open`). A reducer with discriminated-union actions
  documents these transitions explicitly and is trivially testable as a pure function.
- A single context provider at the root (`layout.tsx`) makes task state available to all
  three route pages without prop drilling.
- Zustand, Jotai, Redux Toolkit, etc. would each add a library with no functional benefit
  for this scope.

**Alternatives considered**:

- Zustand — rejected: external dependency (one more `package.json` entry, one more bundle
  chunk) for no capability gain over `useReducer`.
- Redux Toolkit — rejected: excessive boilerplate and bundle size for 1 entity type.
- URL-only state (query params) — rejected: cannot encode the full task list in a URL;
  insufficient for persistence.

---

## Decision 3: Routing / View Structure

**Decision**: Next.js App Router with three route segments:

- `/` → Open tasks
- `/completed` → Completed tasks
- `/archived` → Archived tasks

**Rationale**:

- Route-per-view gives each view a shareable URL (bookmarkable, deep-linkable).
- The `Nav` component highlights the active route using `usePathname()` (built into
  Next.js, no extra routing library needed).
- All three pages share the same `TaskContext` via the root `layout.tsx`.

**Alternatives considered**:

- Single page + `useState` tab — rejected: loses URL addressability; deep-linking and
  browser back/forward behave unexpectedly.
- Single page + URL query param (`?view=completed`) — acceptable but less clean; chosen
  approach is idiomatic Next.js App Router convention.

---

## Decision 4: Styling

**Decision**: CSS Modules + CSS custom properties (design tokens in `tokens.css`).

**Rationale**:

- CSS Modules are built into Next.js (zero extra dependency), provide scoped class names,
  and eliminate style conflicts between components.
- CSS custom properties in `tokens.css` satisfy the Constitution's UX & Interaction
  Standard: "Visual design MUST use a defined design token system — no magic numbers."
- Tailwind CSS was considered but rejected: it requires an additional `devDependency`
  and a `tailwind.config` file; the user requested minimal libraries.

**Alternatives considered**:

- Tailwind CSS — rejected: extra dev dependency; contradicts minimal-library constraint.
- styled-components / Emotion — rejected: runtime CSS-in-JS adds bundle weight; requires
  special Next.js server-side streaming configuration.
- Plain global CSS — rejected: no scoping, high risk of selector collisions as component
  count grows.

---

## Decision 5: Testing Stack

**Decision**: Vitest 1.x + @testing-library/react 14.x + jsdom.

**Rationale**:

- Vitest is significantly faster than Jest for TypeScript projects (native ESM, no Babel
  transform overhead) and shares Jest's API, so the learning curve is negligible.
- `@testing-library/react` tests components from the user's perspective (querying by
  accessible role, label, text) which naturally validates FR-011 (keyboard navigation,
  ARIA) as a side effect.
- `jsdom` provides `localStorage` in the test environment; tests mock `localStorage`
  via `vi.spyOn` to isolate storage behaviour.

**Alternatives considered**:

- Jest + `ts-jest` — rejected: slower, requires additional Babel configuration for Next.js
  App Router; Vitest is the modern standard for Vite-compatible projects.
- Playwright (E2E only) — rejected as the _sole_ test tool: E2E tests are too slow for
  TDD Red-Green-Refactor; unit + integration tests must run in milliseconds.

---

## Decision 6: Archive Confirmation UX

**Decision**: Inline `<ConfirmAction>` component that replaces the Archive button with a
"Confirm archive / Cancel" strip directly inside the task row.

**Rationale**:

- The Constitution (UX & Interaction Standards) requires: "All destructive actions MUST
  require confirmation or provide undo."
- An inline strip avoids any modal/dialog library dependency (Principle I).
- Inline confirmation is spatially proximate to the task being archived, reducing
  cognitive load compared to a detached modal.
- The strip uses `role="status"` / `aria-live` for screen-reader announcement and
  keyboard-accessible confirm/cancel buttons.

**Alternatives considered**:

- `window.confirm()` — rejected: blocks the browser thread; not styleable; poor UX.
- Modal dialog with a UI library — rejected: introduces external dependency.
- Undo toast (archive immediately, offer undo for 5 s) — valid UX pattern; deferred as
  a potential future enhancement since it requires a timer-based rollback mechanism
  (Constitution Principle I: YAGNI).

---

## Decision 7: Inline Edit UX

**Decision**: Single `editingTaskId` state in the context tracks which task (if any) is
in edit mode. `TaskItem` renders either a read-only row or an edit form based on whether
its `id` matches `editingTaskId`.

**Rationale**:

- Only one task can be edited at a time; storing the ID (not a boolean per task) in
  shared context automatically collapses any previously open edit form when a new one
  opens, preventing the "concurrent edit" edge case from the spec.
- Escape key dispatches `CANCEL_EDIT` action; Save button dispatches `UPDATE_TASK`.

**Alternatives considered**:

- Local `isEditing` boolean per `TaskItem` — rejected: two edit forms could be open
  simultaneously (violates the concurrent-edit edge case requirement).

---

## Summary Table

| Area            | Decision                                  | Key Rationale                                                 |
| --------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Storage         | `localStorage` JSON array                 | Zero infrastructure; satisfies FR-009; single-user scope      |
| State           | `useReducer` + Context                    | Pure reducer; testable; zero dependencies                     |
| Routing         | App Router `/`, `/completed`, `/archived` | URL addressability; idiomatic Next.js                         |
| Styling         | CSS Modules + design tokens               | Built-in; scoped; satisfies Constitution UX token requirement |
| Testing         | Vitest + RTL + jsdom                      | Fast; user-centric; ARIA validation as a side effect          |
| Archive confirm | Inline `<ConfirmAction>` strip            | No modal library; keyboard-accessible; spatially proximate    |
| Inline edit     | Single `editingTaskId` in context         | Prevents concurrent-edit edge case automatically              |
