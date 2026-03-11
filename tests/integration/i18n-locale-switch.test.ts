import { createTranslator } from "@/lib/i18n";
import en from "../../messages/en.json";

describe("i18n locale switch", () => {
  it("returns English strings by default", () => {
    const t = createTranslator(en);
    expect(t("nav.open")).toBe("Open");
    expect(t("nav.completed")).toBe("Completed");
    expect(t("nav.archived")).toBe("Archived");
  });

  it("falls back to English when a key is missing from the active locale", () => {
    // Simulate a partial locale override missing some keys
    const partialLocale = { "nav.open": "Ouvrir" } as unknown as typeof en;
    const t = createTranslator(partialLocale, en);
    expect(t("nav.open")).toBe("Ouvrir");
    expect(t("nav.completed")).toBe("Completed"); // fell back to en
  });

  it("returns the key itself when not found in any locale", () => {
    const t = createTranslator({} as typeof en, {} as typeof en);
    expect(t("nav.open")).toBe("nav.open");
  });

  it("supports variable substitution in translated strings", () => {
    const customLocale = {
      "taskForm.validationMaxLength": "Max {max} chars allowed",
    } as unknown as typeof en;
    const t = createTranslator(customLocale);
    expect(t("taskForm.validationMaxLength", { max: "200" })).toBe(
      "Max 200 chars allowed",
    );
  });
});
