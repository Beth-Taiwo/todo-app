import { describe, it, expect } from "vitest";
import { createTranslator } from "@/lib/i18n";

describe("createTranslator — basic lookups", () => {
  const messages = {
    "nav.open": "Open",
    "nav.completed": "Completed",
    "greet.hello": "Hello, {name}!",
    "count.tasks": "{count} tasks remaining",
  };
  const t = createTranslator(messages);

  it("returns the string for a known key", () => {
    expect(t("nav.open")).toBe("Open");
  });

  it("returns the key name for an unknown key", () => {
    expect(t("nav.unknown")).toBe("nav.unknown");
  });

  it("substitutes a single string variable", () => {
    expect(t("greet.hello", { name: "Beth" })).toBe("Hello, Beth!");
  });

  it("substitutes a numeric variable as a string", () => {
    expect(t("count.tasks", { count: 3 })).toBe("3 tasks remaining");
  });

  it("leaves an unresolved slot intact when variable is not provided", () => {
    expect(t("greet.hello", {})).toBe("Hello, {name}!");
  });

  it("handles a message with no variables even when variables object is passed", () => {
    expect(t("nav.open", { unused: "value" })).toBe("Open");
  });
});

describe("createTranslator — fallback behaviour", () => {
  const active = {
    "nav.open": "Ouvrir",
    // "nav.completed" intentionally missing
  };
  const fallback = {
    "nav.open": "Open",
    "nav.completed": "Completed",
    "nav.archived": "Archived",
  };
  const t = createTranslator(active, fallback);

  it("returns the active locale value when key exists in active messages", () => {
    expect(t("nav.open")).toBe("Ouvrir");
  });

  it("falls back to fallback messages for a key absent from active locale", () => {
    expect(t("nav.completed")).toBe("Completed");
  });

  it("returns the key name when missing from both active and fallback", () => {
    expect(t("nav.missing")).toBe("nav.missing");
  });
});

describe("createTranslator — default fallback equals active", () => {
  const messages = { "nav.open": "Open" };
  const t = createTranslator(messages);

  it("works correctly when only one message map is provided", () => {
    expect(t("nav.open")).toBe("Open");
    expect(t("nav.missing")).toBe("nav.missing");
  });
});
