# Research: Internationalisation (i18n) Hook Wiring

**Feature**: `002-i18n-hooks`  
**Branch**: `002-i18n-hooks`  
**Date**: 2026-03-11

---

## Decision 1: Message File Location — `messages/` at Project Root

**Decision**: Place locale message files in `messages/{locale}.json` at the repository root
(e.g., `messages/en.json`, `messages/fr.json`).

**Rationale**: Next.js 14 treats the project root as the natural home for non-source assets
alongside `public/`. Keeping message files there mirrors the convention used by next-intl and
next-translate (the two dominant Next.js i18n libraries) even though we are not using those
libraries. This means any future migration to a full i18n library is zero-friction.
`resolveJsonModule: true` in `tsconfig.json` (already required for TypeScript) lets
`src/lib/i18n.ts` import the JSON with full type inference.

**Alternatives considered**:

| Alternative                             | Reason rejected                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/messages/`                         | Puts locale data inside the source tree — mixed concern; harder to extract in future                                            |
| `public/locales/`                       | `public/` is for static file serving; importing JSON from there requires runtime fetch (violates FR-008 zero-async requirement) |
| Inline string constants in a `.ts` file | Loses the standard JSON interoperability needed for translation tools and future library migration                              |

---

## Decision 2: Static Import Strategy — `dynamicRequire` Factory at Module Init

**Decision**: `src/lib/i18n.ts` statically imports `messages/en.json` (the guaranteed baseline)
and uses a synchronous `require()` call inside a try/catch for non-English locales, executed
once at module initialisation time (not per-render).

```typescript
import en from "../../messages/en.json";

const fallback = en as Record<string, string>;

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

const messages = resolveMessages();
```

**Rationale**: The `import()` dynamic syntax (async) cannot be awaited at module top-level in
a synchronous context. `require()` is synchronous — it runs during module evaluation, before
any React render, satisfying FR-008. The static `import en` guarantees the English fallback is
always bundled. The `try/catch` satisfies FR-005 (missing locale file → fallback).

**Alternatives considered**:

| Alternative                                                            | Reason rejected                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `await import()` with Suspense                                         | Introduces async gap; blank labels during loading — violates FR-008 and UX standard                          |
| Import all locale files statically                                     | Requires listing every locale at the top of `i18n.ts`; not extensible; adds bundle weight for unused locales |
| Server-side `fs.readFileSync()`                                        | Not available in client components; violates the no-backend architecture                                     |
| `NEXT_PUBLIC_LOCALE` inlined at build time only (no runtime `require`) | Would need separate builds per locale; impractical for development/testing                                   |

---

## Decision 3: `t()` Function Design — Pure Function with Regex Interpolation

**Decision**: Export a pure `t(key, variables?)` function that performs a direct property
lookup on the in-memory messages map and uses a single regex pass for `{variable}` placeholder
substitution.

```typescript
export function t(
  key: string,
  variables?: Record<string, string | number>,
): string {
  let str: string =
    (messages[key] as string | undefined) ??
    (fallback[key] as string | undefined) ??
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
```

**Key behaviours**:

- Missing key in active locale → falls back to English baseline → then to key name (FR-004)
- Undefined variable slot → leaves `{slot}` intact (safe; does not throw)
- `console.warn` only in non-production (FR-004)

**Rationale**: A property lookup on a plain object is O(1) and ~0.01 ms — well under the
SC-003 < 1 ms budget. The regex `/\{(\w+)\}/g` is compiled once per call but is a trivial
pattern; at the scale of a component render (~5–10 `t()` calls) this is imperceptible.

**Alternatives considered**:

| Alternative                               | Reason rejected                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ICU MessageFormat (intl-messageformat)    | External dependency violating "zero new deps" constraint; overkill for `{variable}` substitution |
| Template literals (`${var}`) for messages | Cannot store template literals in JSON; requires eval-like behaviour                             |
| Tagged template tag (`i18n\`key\``)       | Unusual syntax; harder to grep for key usage; confuses static analysis                           |

---

## Decision 4: Type Safety — `MessageKey` Alias from `keyof typeof en`

**Decision**: Export a `MessageKey` type alias that is derived directly from the English
message file:

```typescript
import en from "../../messages/en.json";
export type MessageKey = keyof typeof en;
```

**Rationale**: TypeScript's `resolveJsonModule` infers the exact shape of `en.json`. Using
`keyof typeof en` as the key type means the compiler flags any typo in a `t("nav.ope")` call
at compile time. When a new key is added to `en.json`, it automatically becomes a valid
`MessageKey` — no manual type maintenance required.

`t()` accepts `string` (not `MessageKey`) in its runtime implementation to keep non-typed
call sites unblocked (e.g., dynamic key construction in tests), but component code SHOULD use
the `MessageKey` type for the key argument where possible.

**Alternatives considered**:

| Alternative                      | Reason rejected                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `string` only (no type alias)    | Loses compile-time key validation; typos cause runtime warnings instead of build errors |
| Manual string union type         | Must be kept in sync with `en.json` manually — fragile                                  |
| Zod schema validation at runtime | Over-engineered for a static JSON file; adds a dependency                               |

---

## Decision 5: Key Naming Convention — Flat Dot-Notation by Component Namespace

**Decision**: All keys follow the pattern `{namespace}.{identifier}` stored as flat keys in
the JSON (not nested objects). Namespace matches the component or concern the string belongs
to.

**Namespaces defined**:

| Namespace       | Scope                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| `nav`           | `Nav.tsx` — navigation tab labels                                      |
| `taskForm`      | `TaskForm.tsx` — form labels, placeholder, button, validation messages |
| `taskList`      | `TaskList.tsx` — empty-state messages per view                         |
| `taskItem`      | `TaskItem.tsx` — task action button labels and aria-labels             |
| `confirmAction` | `ConfirmAction.tsx` — archive confirmation dialog                      |
| `pages`         | Route page headings (`page.tsx` in each route segment)                 |

**Rationale**: Flat keys are grep-friendly (`grep "nav\."` finds all nav strings) and avoid
the cognitive overhead of nested object traversal when reading `en.json`. Dot-notation
preserves the logical grouping without requiring `messages.nav.open` syntax in the
`t()` call — `t("nav.open")` is clean and self-documenting.

**Alternatives considered**:

| Alternative                                            | Reason rejected                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Nested JSON objects (`{ "nav": { "open": "Open" } }`)  | `t("nav", "open")` is a worse API; requires nested lookup logic in `i18n.ts`; more complex TypeScript typing |
| All-caps underscore keys (`NAV_OPEN`)                  | Convention mismatch with standard i18n ecosystem; harder to read                                             |
| Per-component JSON files (`nav.json`, `taskForm.json`) | More files to maintain; harder to find all strings in one place (violates SC-004)                            |

---

## Decision 6: Locale Switching Mechanism — `NEXT_PUBLIC_LOCALE` Environment Variable

**Decision**: The active locale is determined by `process.env.NEXT_PUBLIC_LOCALE ?? "en"` at
module evaluation time. Switching locales requires setting the env var and restarting the dev
server (or rebuilding for production). This satisfies FR-007 without any component changes.

**Rationale**: `NEXT_PUBLIC_LOCALE` is the simplest mechanism that satisfies the spec's
requirement. The `NEXT_PUBLIC_` prefix makes the variable available in client components
(Next.js inlines it at build time). No React context, no Provider wrapping, no hook — all
of which would increase complexity and violate YAGNI (Principle I).

For the US2 test: the developer sets `NEXT_PUBLIC_LOCALE=fr` in `.env.local`, creates
`messages/fr.json`, and restarts the server. Zero component changes required — the spec's
acceptance criterion is satisfied.

**Alternatives considered**:

| Alternative                                        | Reason rejected                                                                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| React context + `useLocale()` hook                 | Requires wrapping every component in a Provider; blocks non-component usage (e.g., `taskValidation.ts`); deferred to future (YAGNI) |
| `src/config/locale.ts` constant (hardcoded `"en"`) | Requires code change to switch locale; violates FR-007                                                                              |
| URL-based locale (`/en/`, `/fr/`)                  | Full Next.js i18n routing — over-engineered for English-only initial deployment; can be adopted later via next-intl migration       |

---

## Decision 7: Testing Strategy — Factory Function + `vi.resetModules`

**Decision**: `src/lib/i18n.ts` additionally exports a `createTranslator(messages)` factory
function for isolated unit testing. Integration tests that need to verify locale switching use
`vi.resetModules()` + `vi.stubEnv("NEXT_PUBLIC_LOCALE", "fr")` to re-evaluate the module.

```typescript
// Exported for testing only
export function createTranslator(
  activeMessages: Record<string, string>,
  fallbackMessages: Record<string, string> = activeMessages,
): (key: string, variables?: Record<string, string | number>) => string {
  return (key, variables) => {
    // same logic as t(), but using injected maps
  };
}
```

**Rationale**: The singleton module-level `messages` object cannot be mutated between test
cases without module re-loading. `createTranslator` allows unit tests to pass any message
map without side effects. For locale-switching integration tests, `vi.resetModules()` reloads
`i18n.ts` fresh after `vi.stubEnv` sets a different locale — this correctly tests the
`resolveMessages()` code path without polluting other tests.

**Alternatives considered**:

| Alternative                                                 | Reason rejected                                                                           |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Export `setMessages()` setter                               | Creates mutable shared state; test isolation requires teardown discipline; easy to forget |
| Test against live `en.json` only (no locale switching test) | Doesn't exercise the FR-005 fallback or FR-007 locale switching paths                     |
| Separate `i18n.test.ts` using Playwright                    | E2E overkill for a pure function; unit tests are sufficient and faster                    |
