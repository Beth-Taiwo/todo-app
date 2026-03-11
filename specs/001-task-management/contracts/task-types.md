# Contract: TypeScript Type Definitions

**Branch**: `001-task-management` | **Date**: 2026-03-11  
**Source file**: `src/types/task.ts`

These types form the stable interface between all modules. Any change to these types is a
**breaking change** and requires updating all consumers before merge.

---

## TaskStatus Enum

```typescript
export type TaskStatus = "open" | "completed" | "archived";
```

---

## Task Interface

```typescript
export interface Task {
  id: string; // UUID v4; immutable after creation
  title: string; // 1–200 chars; trimmed; must not be whitespace-only
  description: string; // Free text; empty string when not provided
  status: TaskStatus;
  createdAt: string; // ISO 8601 UTC; immutable after creation
  completedAt: string | null; // Set when status → "completed"; never cleared
  archivedAt: string | null; // Set when status → "archived"; cleared on restore
}
```

---

## Reducer Action Types

All actions use a **discriminated union** — the `type` field is the discriminant.

```typescript
export type TaskAction =
  | { type: "HYDRATE"; payload: Task[] }
  | { type: "ADD_TASK"; payload: { title: string; description: string } }
  | {
      type: "UPDATE_TASK";
      payload: { id: string; title: string; description: string };
    }
  | { type: "COMPLETE_TASK"; payload: { id: string } }
  | { type: "ARCHIVE_TASK"; payload: { id: string } }
  | { type: "RESTORE_TASK"; payload: { id: string } }
  | { type: "START_EDIT"; payload: { id: string } }
  | { type: "CANCEL_EDIT" };
```

### Action semantics

| Action          | Pre-condition               | State change                                        |
| --------------- | --------------------------- | --------------------------------------------------- |
| `HYDRATE`       | App mount (useEffect)       | Replaces state with persisted array                 |
| `ADD_TASK`      | title valid                 | Prepends new Task with `status: "open"`             |
| `UPDATE_TASK`   | title valid; task is `open` | Mutates `title` and `description` in-place          |
| `COMPLETE_TASK` | task is `open`              | Sets `status: "completed"`, `completedAt: now`      |
| `ARCHIVE_TASK`  | task is `open`              | Sets `status: "archived"`, `archivedAt: now`        |
| `RESTORE_TASK`  | task is `archived`          | Sets `status: "open"`, `archivedAt: null`           |
| `START_EDIT`    | task is `open`              | Sets `editingTaskId` in context (not in Task array) |
| `CANCEL_EDIT`   | any                         | Clears `editingTaskId`                              |

---

## Validation Types

```typescript
export interface ValidationResult {
  valid: boolean;
  error: string | null; // null when valid; human-readable message when invalid
}
```

---

## Storage Contract

| Key        | `"todo-app:tasks"`                                                                     |
| ---------- | -------------------------------------------------------------------------------------- |
| Value type | `Task[]` serialised as JSON                                                            |
| Written    | After every `ADD_TASK`, `UPDATE_TASK`, `COMPLETE_TASK`, `ARCHIVE_TASK`, `RESTORE_TASK` |
| Read       | Once on app mount inside `useEffect` in `TaskContext`                                  |

**Breaking change rule**: If the `Task` interface gains or removes a required field, a
migration function in `taskStorage.ts` MUST handle records that predate the change.
