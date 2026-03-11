# Data Model: Task Management Web App

**Branch**: `001-task-management` | **Date**: 2026-03-11

---

## Entity: Task

The single core entity. Stored as elements of a JSON array in `localStorage` under the
key `"todo-app:tasks"`.

| Field         | Type                        | Required | Constraints                                                         |
| ------------- | --------------------------- | -------- | ------------------------------------------------------------------- |
| `id`          | `string` (UUID v4)          | Yes      | Immutable after creation; generated client-side                     |
| `title`       | `string`                    | Yes      | 1–200 characters; must not be whitespace-only                       |
| `description` | `string`                    | No       | Free text; no length limit enforced; defaults to `""`               |
| `status`      | `TaskStatus` enum           | Yes      | One of `"open"`, `"completed"`, `"archived"`; see transitions below |
| `createdAt`   | `string` (ISO 8601)         | Yes      | Immutable; set at creation                                          |
| `completedAt` | `string \| null` (ISO 8601) | Yes      | `null` until task is completed; never cleared once set              |
| `archivedAt`  | `string \| null` (ISO 8601) | Yes      | `null` until task is archived; cleared when task is restored        |

### Example JSON record

```json
{
  "id": "a3f2c1d4-8e76-4b2a-9c3f-1234567890ab",
  "title": "Write unit tests for taskReducer",
  "description": "Cover all action branches including edge cases",
  "status": "open",
  "createdAt": "2026-03-11T09:00:00.000Z",
  "completedAt": null,
  "archivedAt": null
}
```

---

## Enum: TaskStatus

```
"open"       — Task is active and appears on the main Open list
"completed"  — Task was marked done; appears in Completed view only
"archived"   — Task was archived; appears in Archived view only; can be restored to "open"
```

---

## State Transition Diagram

```
         create
           │
           ▼
        ┌──────┐
        │ open │
        └──┬───┘
     ┌─────┴──────┐
     │            │
  complete      archive
     │            │
     ▼            ▼
┌──────────┐  ┌──────────┐
│completed │  │ archived │
│(terminal)│  └────┬─────┘
└──────────┘       │
                 restore
                   │
                   ▼
                ┌──────┐
                │ open │
                └──────┘
```

**Valid transitions**:

- `open → completed` (irreversible)
- `open → archived`
- `archived → open` (restore)

**Invalid transitions** (must be blocked in reducer):

- `completed → open`
- `completed → archived`
- `archived → completed`

---

## Validation Rules

| Rule   | Field   | Logic                                                        |
| ------ | ------- | ------------------------------------------------------------ |
| VR-001 | `title` | Must not be empty string                                     |
| VR-002 | `title` | Must not be whitespace-only (`title.trim() === ""`)          |
| VR-003 | `title` | Maximum 200 characters (`title.trim().length <= 200`)        |
| VR-004 | `title` | Validated on every `input` event (real-time inline feedback) |

Validation errors are surfaced inline below the relevant input; form submission (create)
and save confirmation (update) are blocked while any rule is violated.

---

## Storage Schema

The full task list is serialised as a JSON array and stored at the `localStorage` key
`"todo-app:tasks"`.

```json
[
  {
    "id": "...",
    "title": "...",
    "description": "...",
    "status": "open",
    "createdAt": "...",
    "completedAt": null,
    "archivedAt": null
  },
  {
    "id": "...",
    "title": "...",
    "description": "...",
    "status": "completed",
    "createdAt": "...",
    "completedAt": "...",
    "archivedAt": null
  },
  {
    "id": "...",
    "title": "...",
    "description": "...",
    "status": "archived",
    "createdAt": "...",
    "completedAt": null,
    "archivedAt": "..."
  }
]
```

**Hydration strategy**: On first render, `TaskContext` initialises with `[]`. A `useEffect`
reads `localStorage`, parses the JSON, and dispatches `HYDRATE` to populate state. This
avoids Next.js server/client hydration mismatches.

**Serialisation error handling**: If JSON parsing fails (corrupt data), the app falls back
to `[]` and logs a warning. The user sees the empty-state UI rather than a crash.

---

## Derived Views (filtered projections — no additional storage)

| View      | Filter                   | Sort                                  |
| --------- | ------------------------ | ------------------------------------- |
| Open      | `status === "open"`      | `createdAt` descending (newest first) |
| Completed | `status === "completed"` | `completedAt` descending              |
| Archived  | `status === "archived"`  | `archivedAt` descending               |

---

## Empty States (per view)

| View      | Empty State Message             |
| --------- | ------------------------------- |
| Open      | "No open tasks — add one above" |
| Completed | "No completed tasks yet"        |
| Archived  | "No archived tasks"             |
