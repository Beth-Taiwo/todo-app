# Quickstart: Internationalisation (i18n) Hook Wiring

**Feature**: `002-i18n-hooks`  
**Branch**: `002-i18n-hooks`  
**Date**: 2026-03-11

This guide describes the exact steps to implement the i18n hook wiring on top of the existing
Next.js 14 / React 18 project scaffolded by `001-task-management/quickstart.md`.

---

## Step 1: Verify `tsconfig.json` Has `resolveJsonModule`

Open `tsconfig.json` at the project root. Confirm `compilerOptions` includes:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

`create-next-app@14` enables this by default. If it is absent, add it.

---

## Step 2: Create the English Message File

Create `messages/en.json` at the **project root** (not inside `src/`):

```bash
mkdir -p messages
```

Populate `messages/en.json` with the 29 baseline keys defined in `data-model.md`:

```json
{
  "nav.open": "Open",
  "nav.completed": "Completed",
  "nav.archived": "Archived",

  "taskForm.heading": "New task",
  "taskForm.inputPlaceholder": "What needs to be done?",
  "taskForm.inputAriaLabel": "Task title",
  "taskForm.submitButton": "Add",
  "taskForm.validationRequired": "Title is required",
  "taskForm.validationMaxLength": "Title cannot exceed 120 characters",

  "taskList.emptyOpen": "No open tasks yet.",
  "taskList.emptyCompleted": "No completed tasks yet.",
  "taskList.emptyArchived": "No archived tasks yet.",

  "taskItem.completeButton": "Complete",
  "taskItem.completeAriaLabel": "Complete task: {title}",
  "taskItem.editButton": "Edit",
  "taskItem.editAriaLabel": "Edit task: {title}",
  "taskItem.archiveButton": "Archive",
  "taskItem.archiveAriaLabel": "Archive task: {title}",
  "taskItem.saveButton": "Save",
  "taskItem.saveAriaLabel": "Save changes to: {title}",
  "taskItem.cancelButton": "Cancel",
  "taskItem.cancelAriaLabel": "Cancel editing: {title}",
  "taskItem.editInputPlaceholder": "Task title",

  "confirmAction.question": "Archive this task?",
  "confirmAction.confirmButton": "Yes, archive",
  "confirmAction.cancelButton": "Cancel",
  "confirmAction.ariaLabel": "Confirm archive",

  "pages.open": "Open Tasks",
  "pages.completed": "Completed Tasks",
  "pages.archived": "Archived Tasks"
}
```

---

## Step 3: Create `src/lib/i18n.ts` (TDD: write test first)

### 3a. Write unit tests (RED phase)

Create `tests/unit/i18n.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createTranslator } from "@/lib/i18n";

describe("createTranslator", () => {
  const messages = {
    "nav.open": "Open",
    "greet.hello": "Hello, {name}!",
  };
  const t = createTranslator(messages);

  it("returns the string for a known key", () => {
    expect(t("nav.open")).toBe("Open");
  });

  it("returns the key name for an unknown key", () => {
    expect(t("nav.unknown")).toBe("nav.unknown");
  });

  it("substitutes a single variable", () => {
    expect(t("greet.hello", { name: "Beth" })).toBe("Hello, Beth!");
  });

  it("leaves an unresolved slot intact when variable is not provided", () => {
    expect(t("greet.hello", {})).toBe("Hello, {name}!");
  });

  it("substitutes a numeric variable as a string", () => {
    expect(t("greet.hello", { name: 42 })).toBe("Hello, 42!");
  });
});

describe("createTranslator fallback", () => {
  const active = { "nav.open": "Ouvrir" }; // French — missing "nav.completed"
  const fallback = { "nav.open": "Open", "nav.completed": "Completed" };
  const t = createTranslator(active, fallback);

  it("returns active locale value when key exists", () => {
    expect(t("nav.open")).toBe("Ouvrir");
  });

  it("falls back to fallback messages for missing key", () => {
    expect(t("nav.completed")).toBe("Completed");
  });
});
```

### 3b. Implement `src/lib/i18n.ts` (GREEN phase)

```typescript
import en from "../../messages/en.json";

export type MessageKey = keyof typeof en;

// ─── Module-level singleton ────────────────────────────────────────────────

const _fallback = Object.freeze(en as Record<string, string>);

function resolveMessages(): Record<string, string> {
  const locale = process.env.NEXT_PUBLIC_LOCALE ?? "en";
  if (locale === "en") return _fallback;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const localeData = require(`../../messages/${locale}.json`) as Record<
      string,
      string
    >;
    return Object.freeze(localeData);
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[i18n] Locale file "messages/${locale}.json" not found. Falling back to "en".`,
      );
    }
    return _fallback;
  }
}

const _messages = resolveMessages();

// ─── Exported: translation function ───────────────────────────────────────

export function t(
  key: string,
  variables?: Record<string, string | number>,
): string {
  let str: string =
    (_messages[key] as string | undefined) ??
    (_fallback[key] as string | undefined) ??
    (() => {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] Missing key: "${key}"`);
      }
      return key;
    })();

  if (variables) {
    str = str.replace(/\{(\w+)\}/g, (_, k: string) =>
      String(variables[k] ?? `{${k}}`),
    );
  }
  return str;
}

// ─── Exported: factory for isolated testing ────────────────────────────────

export function createTranslator(
  activeMessages: Record<string, string>,
  fallbackMessages: Record<string, string> = activeMessages,
): (key: string, variables?: Record<string, string | number>) => string {
  return (key, variables) => {
    let str: string =
      (activeMessages[key] as string | undefined) ??
      (fallbackMessages[key] as string | undefined) ??
      (() => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[i18n] Missing key: "${key}"`);
        }
        return key;
      })();

    if (variables) {
      str = str.replace(/\{(\w+)\}/g, (_, k: string) =>
        String(variables[k] ?? `{${k}}`),
      );
    }
    return str;
  };
}
```

---

## Step 4: Migrate Components (one at a time)

For each component with hardcoded strings, follow this pattern:

```typescript
// BEFORE (example: Nav.tsx)
export function Nav() {
  return (
    <nav>
      <a href="/">Open</a>
      <a href="/completed">Completed</a>
      <a href="/archived">Archived</a>
    </nav>
  );
}

// AFTER
import { t } from "@/lib/i18n";

export function Nav() {
  return (
    <nav>
      <a href="/">{t("nav.open")}</a>
      <a href="/completed">{t("nav.completed")}</a>
      <a href="/archived">{t("nav.archived")}</a>
    </nav>
  );
}
```

**Migration order** (matches tasks.md priority — P1 user story first):

1. `src/lib/taskValidation.ts` — validation error messages (non-component; migrated early to
   unblock TDD tests for `taskForm` integration)
2. `src/components/Nav.tsx`
3. `src/components/TaskForm.tsx`
4. `src/components/TaskList.tsx`
5. `src/components/TaskItem.tsx`
6. `src/components/ConfirmAction.tsx`
7. `src/app/page.tsx`, `completed/page.tsx`, `archived/page.tsx`

---

## Step 5: Verify Zero Hardcoded Strings (SC-001)

After all migrations, run this check from the project root to confirm no user-facing strings
remain hardcoded in `src/`:

```bash
# Should return zero matches for every known string
grep -rn "No open tasks" src/
grep -rn "No completed tasks" src/
grep -rn "What needs to be done" src/
grep -rn "Title is required" src/
grep -rn "Archive this task" src/
```

Each command should produce **no output**.

---

## Step 6: Test Locale Switching (US2 validation)

```bash
# 1. Create a partial French locale (test only — not shipped)
cp messages/en.json messages/fr.json
# 2. Edit messages/fr.json — translate two keys:
#    "nav.open": "Ouvrir"
#    "pages.open": "Tâches ouvertes"

# 3. Run dev server with French locale
NEXT_PUBLIC_LOCALE=fr npm run dev

# 4. Navigate to http://localhost:3000 — confirm "Ouvrir" and "Tâches ouvertes" appear
#    and NO component files were modified

# 5. Clean up
rm messages/fr.json
```

---

## Implementation Order Summary

| Step | Task                        | TDD Phase | Files Affected                     |
| ---- | --------------------------- | --------- | ---------------------------------- |
| 1    | Verify tsconfig             | —         | `tsconfig.json`                    |
| 2    | Create `messages/en.json`   | —         | `messages/en.json` (new)           |
| 3    | Write `i18n.test.ts`        | RED       | `tests/unit/i18n.test.ts` (new)    |
| 4    | Implement `i18n.ts`         | GREEN     | `src/lib/i18n.ts` (new)            |
| 5    | Migrate `taskValidation.ts` | GREEN     | `src/lib/taskValidation.ts`        |
| 6    | Migrate `Nav.tsx`           | GREEN     | `src/components/Nav.tsx`           |
| 7    | Migrate `TaskForm.tsx`      | GREEN     | `src/components/TaskForm.tsx`      |
| 8    | Migrate `TaskList.tsx`      | GREEN     | `src/components/TaskList.tsx`      |
| 9    | Migrate `TaskItem.tsx`      | GREEN     | `src/components/TaskItem.tsx`      |
| 10   | Migrate `ConfirmAction.tsx` | GREEN     | `src/components/ConfirmAction.tsx` |
| 11   | Migrate page headings       | GREEN     | `src/app/*/page.tsx` (3 files)     |
| 12   | Verify SC-001 (grep check)  | VERIFY    | All of `src/`                      |
| 13   | Run full test suite         | VERIFY    | —                                  |
