# Contract: `src/lib/i18n.ts` — i18n Module

**Feature**: `002-i18n-hooks`  
**Branch**: `002-i18n-hooks`  
**Date**: 2026-03-11

---

## Module Overview

`src/lib/i18n.ts` is a pure TypeScript module (no React dependency) that:

1. Loads the active locale's message file once at module initialisation
2. Exposes the `t()` translation function for use throughout the codebase
3. Exports types and a factory function for type-safe component code and isolated testing

---

## Exported Types

```typescript
// Derived from messages/en.json via TypeScript resolveJsonModule
// Auto-updated when new keys are added to en.json — no manual maintenance
export type MessageKey = keyof typeof import("../../messages/en.json");
```

**Usage in components**:

```typescript
import { t, type MessageKey } from "@/lib/i18n";

// Compile-time error if key does not exist in en.json:
const label = t("nav.open"); // ✅
const bad = t("nav.ope"); // ❌ TypeScript error: Argument of type '"nav.ope"' is
//    not assignable to parameter of type 'MessageKey'
```

---

## Exported: `t()`

```typescript
export function t(
  key: string,
  variables?: Record<string, string | number>,
): string;
```

### Behaviour

| Scenario                                    | Return value                                             | Side effect                                                          |
| ------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| Key found in active locale                  | Translated string (interpolated if `variables` provided) | —                                                                    |
| Key missing in active locale, found in `en` | English fallback string                                  | —                                                                    |
| Key missing in both active locale and `en`  | Key name as string (e.g., `"nav.open"`)                  | `console.warn("[i18n] Missing key: \"nav.open\"")` in non-production |
| `variables` provided with `{slot}`          | `{slot}` replaced with `String(variables[slot])`         | —                                                                    |
| `variables` provided but slot undefined     | `{slot}` left intact                                     | —                                                                    |

### Examples

```typescript
// Simple lookup
t("nav.open"); // → "Open"

// Variable interpolation
t("taskItem.completeAriaLabel", { title: "Buy milk" });
// → "Complete task: Buy milk"

// Missing variable slot (safe)
t("taskItem.completeAriaLabel", {});
// → "Complete task: {title}"

// Missing key (dev mode)
t("nonExistent.key");
// → "nonExistent.key"  +  console.warn in DEV
```

---

## Exported: `createTranslator()`

**For testing only.** Components and lib modules MUST use `t()` directly.

```typescript
export function createTranslator(
  activeMessages: Record<string, string>,
  fallbackMessages?: Record<string, string>,
): (key: string, variables?: Record<string, string | number>) => string;
```

### Usage in tests

```typescript
// tests/unit/i18n.test.ts
import { createTranslator } from "@/lib/i18n";

const mockMessages = { "nav.open": "Open", "nav.completed": "Completed" };
const t = createTranslator(mockMessages);

expect(t("nav.open")).toBe("Open");
expect(t("nav.unknown")).toBe("nav.unknown"); // missing key → key name
```

The factory function uses the same interpolation and fallback logic as the singleton `t()`.
It does NOT modify the module-level singleton messages.

---

## Module Internals (non-exported)

These are implementation details documented here for implementors.

```typescript
// Module-level constants (evaluated once at import time)
import en from "../../messages/en.json";

const fallback: Record<string, string> = en as Record<string, string>;

function resolveMessages(): Record<string, string> {
  const locale = process.env.NEXT_PUBLIC_LOCALE ?? "en";
  if (locale === "en") return fallback;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`../../messages/${locale}.json`) as Record<string, string>;
  } catch {
    console.error(
      `[i18n] Locale file "messages/${locale}.json" not found. Falling back to "en".`,
    );
    return fallback;
  }
}

const messages: Record<string, string> = resolveMessages();
```

---

## Invariants

1. `t()` NEVER throws — any error path returns a string (either a value, fallback, or key name).
2. `messages` is frozen after module init — no mutation occurs after the `resolveMessages()`
   call. (Frozen using `Object.freeze()` in the implementation to enforce this.)
3. `createTranslator` calls NEVER affect the singleton `messages` object.
4. `console.warn` and `console.error` from this module are ONLY emitted in non-production
   (`process.env.NODE_ENV !== "production"`).

---

## Dependencies

| Import                           | Type        | Reason                                                |
| -------------------------------- | ----------- | ----------------------------------------------------- |
| `../../messages/en.json`         | Static JSON | English baseline — guaranteed at build time           |
| `process.env.NEXT_PUBLIC_LOCALE` | Runtime env | Active locale selection (inlined by Next.js at build) |

**Zero npm dependencies added by this module.**
