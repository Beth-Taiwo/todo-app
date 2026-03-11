# Data Model: Internationalisation (i18n) Hook Wiring

**Feature**: `002-i18n-hooks`  
**Branch**: `002-i18n-hooks`  
**Date**: 2026-03-11

---

## Primary Entity: Message File

A `MessageFile` is a flat JSON object where every key is a dot-notation string identifier
and every value is a string (optionally containing `{variable}` placeholders).

### Schema

```text
MessageFile
├── key: MessageKey       — dot-notation string identifier (e.g., "nav.open")
└── value: string         — display string, may contain {variable} slots
```

```typescript
// TypeScript representation (auto-derived from en.json via resolveJsonModule)
type MessageFile = Record<MessageKey, string>;
type MessageKey = keyof typeof import("../../messages/en.json");
```

### Validation Rules

| Rule   | Description                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------- |
| VR-001 | Every key in a non-English locale file MUST also exist in `en.json` (English is the canonical key registry)      |
| VR-002 | A locale file MAY omit keys — missing keys fall back to English (FR-005)                                         |
| VR-003 | Values MUST be non-empty strings; empty string `""` is a data error (treated as missing)                         |
| VR-004 | Variable slots MUST use `{camelCaseIdentifier}` syntax; braces without a word inside are treated as literal text |
| VR-005 | `en.json` MUST NOT be empty or malformed — it is the fallback baseline; a malformed `en.json` is a build error   |

---

## Message File Contents (`messages/en.json`)

Complete inventory of all 29 keys shipped in the English baseline locale.

### Namespace: `nav` — Navigation tab labels

| Key             | English Value | Variable Slots |
| --------------- | ------------- | -------------- |
| `nav.open`      | `"Open"`      | —              |
| `nav.completed` | `"Completed"` | —              |
| `nav.archived`  | `"Archived"`  | —              |

### Namespace: `taskForm` — Add-task form

| Key                            | English Value                          | Variable Slots |
| ------------------------------ | -------------------------------------- | -------------- |
| `taskForm.heading`             | `"New task"`                           | —              |
| `taskForm.inputPlaceholder`    | `"What needs to be done?"`             | —              |
| `taskForm.inputAriaLabel`      | `"Task title"`                         | —              |
| `taskForm.submitButton`        | `"Add"`                                | —              |
| `taskForm.validationRequired`  | `"Title is required"`                  | —              |
| `taskForm.validationMaxLength` | `"Title cannot exceed 120 characters"` | —              |

### Namespace: `taskList` — Empty-state messages

| Key                       | English Value               | Variable Slots |
| ------------------------- | --------------------------- | -------------- |
| `taskList.emptyOpen`      | `"No open tasks yet."`      | —              |
| `taskList.emptyCompleted` | `"No completed tasks yet."` | —              |
| `taskList.emptyArchived`  | `"No archived tasks yet."`  | —              |

### Namespace: `taskItem` — Task row actions (view and edit modes)

| Key                             | English Value                | Variable Slots |
| ------------------------------- | ---------------------------- | -------------- |
| `taskItem.completeButton`       | `"Complete"`                 | —              |
| `taskItem.completeAriaLabel`    | `"Complete task: {title}"`   | `{title}`      |
| `taskItem.editButton`           | `"Edit"`                     | —              |
| `taskItem.editAriaLabel`        | `"Edit task: {title}"`       | `{title}`      |
| `taskItem.archiveButton`        | `"Archive"`                  | —              |
| `taskItem.archiveAriaLabel`     | `"Archive task: {title}"`    | `{title}`      |
| `taskItem.saveButton`           | `"Save"`                     | —              |
| `taskItem.saveAriaLabel`        | `"Save changes to: {title}"` | `{title}`      |
| `taskItem.cancelButton`         | `"Cancel"`                   | —              |
| `taskItem.cancelAriaLabel`      | `"Cancel editing: {title}"`  | `{title}`      |
| `taskItem.editInputPlaceholder` | `"Task title"`               | —              |

### Namespace: `confirmAction` — Archive confirmation dialog

| Key                           | English Value          | Variable Slots |
| ----------------------------- | ---------------------- | -------------- |
| `confirmAction.question`      | `"Archive this task?"` | —              |
| `confirmAction.confirmButton` | `"Yes, archive"`       | —              |
| `confirmAction.cancelButton`  | `"Cancel"`             | —              |
| `confirmAction.ariaLabel`     | `"Confirm archive"`    | —              |

### Namespace: `pages` — Route page headings

| Key               | English Value       | Variable Slots |
| ----------------- | ------------------- | -------------- |
| `pages.open`      | `"Open Tasks"`      | —              |
| `pages.completed` | `"Completed Tasks"` | —              |
| `pages.archived`  | `"Archived Tasks"`  | —              |

**Total**: 29 keys, 5 with `{variable}` interpolation slots.

---

## Variable Slot Reference

All `{variable}` slots used across the 29 keys:

| Slot Name | Used In                        | Runtime Source            |
| --------- | ------------------------------ | ------------------------- |
| `{title}` | `taskItem.*AriaLabel` (5 keys) | `Task.title` from context |

---

## Locale Switching State Transition

```
Module init
    │
    ▼
Read process.env.NEXT_PUBLIC_LOCALE
    │
    ├─ "en" (or undefined) ──────────────→ Load en.json (static import)
    │                                             │
    └─ other locale ──→ require(messages/LOCALE.json)
                              │
                         ┌────┴────────────────────┐
                         │ success                  │ error (file not found)
                         ▼                          ▼
                  Use locale messages        Log error + use en.json
                         │                          │
                         └──────────┬───────────────┘
                                    ▼
                         messages (in-memory map) frozen
                                    │
                                    ▼
                    t(key, variables?) calls resolve here
```

---

## Storage Contract

Message files are **not persisted** in `localStorage` or any runtime store. They are:

1. Bundled as part of the Next.js build output (static JSON modules)
2. Evaluated once at module initialisation
3. Held in-memory for the lifetime of the page session

No migration, versioning, or persistence schema is required.
