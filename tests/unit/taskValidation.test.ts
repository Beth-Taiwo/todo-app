import { describe, it, expect } from "vitest";
import { validateTitle } from "@/lib/taskValidation";

describe("validateTitle", () => {
  it("returns valid for a normal title", () => {
    const result = validateTitle("Buy groceries");
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("VR-001: returns invalid for an empty string", () => {
    const result = validateTitle("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("VR-002: returns invalid for a whitespace-only string", () => {
    const result = validateTitle("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("VR-003: returns invalid for a string exceeding 120 characters", () => {
    const longTitle = "a".repeat(121);
    const result = validateTitle(longTitle);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("VR-003: accepts a string of exactly 120 characters", () => {
    const borderTitle = "a".repeat(120);
    const result = validateTitle(borderTitle);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });
});
