import en from "../../messages/en.json";

export type MessageKey = keyof typeof en;

// ─── Module-level singleton ────────────────────────────────────────────────

const _fallback = Object.freeze(en as Record<string, string>);

// Currently only "en" is supported. Additional locales can be added here
// as static imports when needed, then selected via NEXT_PUBLIC_LOCALE.
const _messages = _fallback;

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
