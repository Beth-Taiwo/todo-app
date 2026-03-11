# Contract: TaskContext Hook API

**Branch**: `001-task-management` | **Date**: 2026-03-11  
**Source file**: `src/context/TaskContext.tsx`

This contract defines the public surface area of the `useTaskContext` hook. All components
that need to read or mutate task state MUST consume this hook. Direct access to the
underlying `dispatch` function is intentionally NOT exposed.

---

## Provider

```typescript
// Wrap the root layout with this provider.
// All child components can then call useTaskContext().
export function TaskProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element;
```

---

## Hook

```typescript
export function useTaskContext(): TaskContextValue;
```

Throws if called outside a `<TaskProvider>` tree (fail-fast, no silent fallback).

---

## TaskContextValue Interface

```typescript
export interface TaskContextValue {
  // ── Derived state ─────────────────────────────────────────────────────────
  openTasks: Task[]; // tasks filtered to status === "open", createdAt desc
  completedTasks: Task[]; // tasks filtered to status === "completed", completedAt desc
  archivedTasks: Task[]; // tasks filtered to status === "archived", archivedAt desc

  // ── Edit state ─────────────────────────────────────────────────────────────
  editingTaskId: string | null; // id of task currently in edit mode; null if none

  // ── Mutators ───────────────────────────────────────────────────────────────

  /** Add a new open task. title must pass validation before calling. */
  addTask(title: string, description: string): void;

  /** Update the title/description of an open task. Caller validates title first. */
  updateTask(id: string, title: string, description: string): void;

  /** Mark an open task as completed (terminal — cannot be undone). */
  completeTask(id: string): void;

  /** Archive an open task (can be restored). */
  archiveTask(id: string): void;

  /** Restore an archived task back to open. */
  restoreTask(id: string): void;

  /** Enter inline edit mode for a task. Collapses any other open edit form. */
  startEdit(id: string): void;

  /** Exit inline edit mode without saving changes. */
  cancelEdit(): void;
}
```

---

## Consumption Example

```typescript
// Inside a client component:
"use client";

import { useTaskContext } from "@/context/TaskContext";

export function MyComponent() {
  const { openTasks, addTask } = useTaskContext();
  // ...
}
```

---

## Invariants

- `openTasks`, `completedTasks`, and `archivedTasks` are **always** mutually exclusive and
  exhaustive (every task appears in exactly one list).
- After calling `addTask(title, description)`, the new task appears at index 0 of
  `openTasks` — no re-fetch or reload required.
- `editingTaskId` is always `null` or a valid `id` present in `openTasks`. It is never set
  to the id of a completed or archived task.
- All mutators persist the updated state to `localStorage` synchronously before returning,
  ensuring FR-009 (persist across reloads) is satisfied even if the tab is closed
  immediately after the action.
