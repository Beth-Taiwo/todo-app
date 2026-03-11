import { describe, it, expect } from "vitest";
import type { Task } from "@/types/task";

describe("Task contract schema", () => {
  const validTask: Task = {
    id: "abc-123",
    title: "Buy groceries",
    description: "Milk and eggs",
    status: "open",
    createdAt: new Date().toISOString(),
    completedAt: null,
    archivedAt: null,
  };

  it("has an id string field", () => {
    expect(typeof validTask.id).toBe("string");
  });

  it("has a title string field", () => {
    expect(typeof validTask.title).toBe("string");
  });

  it("has a description string field", () => {
    expect(typeof validTask.description).toBe("string");
  });

  it("has a status field that is one of the valid enum values", () => {
    expect(["open", "completed", "archived"]).toContain(validTask.status);
  });

  it("has a createdAt ISO string field", () => {
    expect(typeof validTask.createdAt).toBe("string");
    expect(() => new Date(validTask.createdAt)).not.toThrow();
  });

  it("has a completedAt field that is null or an ISO string", () => {
    expect(
      validTask.completedAt === null ||
        typeof validTask.completedAt === "string",
    ).toBe(true);
  });

  it("has an archivedAt field that is null or an ISO string", () => {
    expect(
      validTask.archivedAt === null || typeof validTask.archivedAt === "string",
    ).toBe(true);
  });

  it("JSON round-trip preserves all fields", () => {
    const parsed = JSON.parse(JSON.stringify(validTask)) as Task;
    expect(parsed).toEqual(validTask);
  });
});
