# Feature Specification: Task Management Web App

**Feature Branch**: `001-task-management`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User description: "Build a web application that can allow user to create a new task, update an existing tasks, archive existing tasks (which do not appear on the main list), user can mark tasks as complete (completed tasks are removed from the open list)"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create a Task (Priority: P1)

A user opens the app and adds a new task to their open task list by typing a title and
optionally a description. The task appears immediately in the list without a page reload.

**Why this priority**: Creating tasks is the foundational action of any todo app. Without it
nothing else has value. All other stories depend on there being tasks to interact with.

**Independent Test**: Open the app with an empty list. Submit the "Add task" form with a
title. Verify the new task appears in the open list and persists after a page refresh.

**Acceptance Scenarios**:

1. **Given** the open task list, **When** the user enters a task title and submits the form,
   **Then** the new task appears at the top of the open list with "open" status and the input
   field is cleared ready for the next entry.
2. **Given** the add-task form, **When** the user submits without entering a title,
   **Then** an inline validation message appears immediately and no task is created.
3. **Given** the add-task form, **When** the user enters a title exceeding 200 characters,
   **Then** an inline error is shown and submission is blocked.
4. **Given** the add-task form, **When** the user submits a title that is only whitespace,
   **Then** an inline validation error is shown and no task is created.

---

### User Story 2 - Complete a Task (Priority: P2)

A user marks an open task as complete. The task is immediately removed from the open list
and moved to a "Completed" view accessible via a tab or secondary navigation link.

**Why this priority**: Completing tasks is the core satisfaction loop of a todo app.
It is the primary interaction that makes the app feel rewarding and useful.

**Independent Test**: With at least one open task, mark it as complete. Verify it disappears
from the open list. Navigate to the Completed view and verify it is present there.

**Acceptance Scenarios**:

1. **Given** an open task, **When** the user activates the "Complete" control,
   **Then** the task is removed from the open list within 100 ms and appears in the
   Completed view with the date/time it was completed.
2. **Given** the Completed view, **When** the user views it, **Then** all completed tasks
   are listed in reverse-chronological order (most recently completed first).
3. **Given** the open list with multiple tasks, **When** one is marked complete,
   **Then** only that task is removed; all other tasks remain unchanged and in order.

---

### User Story 3 - Update a Task (Priority: P3)

A user edits the title or description of an existing open task. The change is saved and
reflected immediately in the list without leaving the page.

**Why this priority**: Real-world tasks evolve. Inline editing prevents users from
accumulating stale or inaccurate task descriptions.

**Independent Test**: With at least one open task, activate inline edit mode, change the
title, and confirm. Verify the updated title persists in the list after a page refresh.

**Acceptance Scenarios**:

1. **Given** an open task, **When** the user activates the edit control, **Then** the task
   title becomes an editable field, pre-filled with the current value, and focus is moved
   to that field.
2. **Given** an open task in edit mode, **When** the user changes the title and confirms,
   **Then** the updated title is shown immediately and persisted on refresh.
3. **Given** a task in edit mode, **When** the user clears the title and attempts to save,
   **Then** an inline validation error appears and the save is blocked.
4. **Given** a task in edit mode, **When** the user presses Escape or activates a "Cancel"
   control, **Then** the original values are restored with no changes saved.
5. **Given** a completed or archived task, **When** the user attempts to edit it,
   **Then** the edit control is not presented (editing is restricted to open tasks only).

---

### User Story 4 - Archive a Task (Priority: P4)

A user archives an open task they no longer want on the main list but do not want to
permanently delete. The task disappears from the open list and is accessible in an
"Archived" view.

**Why this priority**: Archiving gives users a non-destructive way to tidy their list.
Users frequently want to defer tasks indefinitely without losing them.

**Independent Test**: With at least one open task, activate the archive action and confirm
the prompt. Verify the task is removed from the open list and appears in the Archived view.

**Acceptance Scenarios**:

1. **Given** an open task, **When** the user activates the "Archive" control,
   **Then** a confirmation prompt is shown before the action is executed (destructive action
   per UX & Interaction Standards).
2. **Given** the confirmation prompt, **When** the user confirms, **Then** the task is
   removed from the open list within 100 ms and appears in the Archived view.
3. **Given** the confirmation prompt, **When** the user cancels, **Then** no change is made
   and the task remains in the open list.
4. **Given** the Archived view, **When** the user views it, **Then** all archived tasks are
   listed; neither open tasks nor completed tasks appear there.
5. **Given** an archived task, **When** the user activates a "Restore" control,
   **Then** the task is moved back to the open list with its original title and description.

---

### Edge Cases

- **Empty list**: When the open list has no tasks, a deliberate empty-state message is
  shown (e.g., "No open tasks — add one above") rather than a blank screen.
- **Rapid consecutive completions**: Completing multiple tasks in quick succession must
  not cause race conditions or duplicate entries in the Completed view.
- **Very long task titles**: Titles up to 200 characters must render correctly without
  overflowing their container or breaking layout on narrow viewports (320 px min-width).
- **Network/storage failure on save**: If a task cannot be persisted, the UI must show a
  human-readable error and roll back the optimistic UI update so the user is not misled.
- **Concurrent edits (same browser tab)**: If the user opens the edit form for task A and
  then somehow triggers another action, the edit form must be dismissed cleanly with no
  partial saves.
- **Keyboard-only navigation**: All actions (add, complete, edit, archive, restore) must
  be reachable and activatable via keyboard alone.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Users MUST be able to create a new task by submitting a form with a required
  title (1–200 characters) and an optional description.
- **FR-002**: The system MUST validate the task title in real-time (inline, immediate) and
  block submission when the title is empty, whitespace-only, or exceeds 200 characters.
- **FR-003**: Users MUST be able to mark any open task as complete; completing a task MUST
  remove it from the open list and place it in a Completed view with a completion timestamp.
- **FR-004**: Users MUST be able to edit the title and description of any open task inline;
  editing MUST be blocked for completed and archived tasks.
- **FR-005**: Users MUST be able to archive any open task; archiving MUST remove it from
  the open list and place it in an Archived view.
- **FR-006**: The system MUST present a confirmation step before executing the archive action.
- **FR-007**: Users MUST be able to restore an archived task back to the open list.
- **FR-008**: The open list, Completed view, and Archived view MUST be accessible via
  clearly labelled navigation (e.g., tabs or links).
- **FR-009**: All task state changes (create, complete, update, archive, restore) MUST be
  persisted and survive a full page reload.
- **FR-010**: The UI MUST provide feedback within 100 ms of any user action (Constitution
  Principle II).
- **FR-011**: All interactive elements MUST be keyboard-navigable and screen-reader-
  compatible (WCAG 2.1 AA — Constitution Principle V).
- **FR-012**: The application MUST be fully responsive from 320 px to 2560 px viewport width.

### Key Entities

- **Task**: The core data entity. Attributes: `id` (unique), `title` (string, 1–200 chars),
  `description` (string, optional), `status` (enum: `open` | `completed` | `archived`),
  `createdAt` (timestamp), `completedAt` (timestamp, nullable), `archivedAt` (timestamp,
  nullable).
- **TaskStatus**: Enumeration of the three mutually exclusive lifecycle states a task can
  occupy (`open`, `completed`, `archived`). A task can only be in one state at a time.
  Valid transitions: `open → completed`, `open → archived`, `archived → open`.
  The `completed` state is terminal (no transition out).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A user can create, view, complete, edit, and archive a task in under 60 seconds
  of first visiting the app with no prior instruction.
- **SC-002**: UI feedback for every task action (create, complete, edit, archive) appears
  within 100 ms of user interaction on a mid-range device.
- **SC-003**: First Contentful Paint ≤ 1.5 s on a mid-range device on a 4G connection
  (Constitution UX & Interaction Standard).
- **SC-004**: All interactive controls are reachable and operable via keyboard alone; the
  app passes automated accessibility audit with zero WCAG 2.1 AA violations.
- **SC-005**: The application renders correctly and is fully usable at viewport widths of
  320 px, 768 px, 1280 px, and 2560 px.
- **SC-006**: Zero data loss: task state changes persist correctly across page reloads in
  100% of test scenarios.
