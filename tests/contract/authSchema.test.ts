import { describe, it, expect } from "vitest";
import type { AuthUser, AuthState, AuthError } from "@/types/auth";
import type { Task } from "@/types/task";

describe("AuthUser contract schema", () => {
  const validUser: AuthUser = {
    uid: "user-uid-123",
    email: "user@example.com",
    displayName: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  it("has a uid string field", () => {
    expect(typeof validUser.uid).toBe("string");
  });

  it("has an email string field", () => {
    expect(typeof validUser.email).toBe("string");
  });

  it("has a displayName field that is null or string", () => {
    expect(
      validUser.displayName === null ||
        typeof validUser.displayName === "string",
    ).toBe(true);
  });

  it("has a createdAt ISO string field", () => {
    expect(typeof validUser.createdAt).toBe("string");
    expect(() => new Date(validUser.createdAt)).not.toThrow();
  });

  it("has a lastLoginAt ISO string field", () => {
    expect(typeof validUser.lastLoginAt).toBe("string");
    expect(() => new Date(validUser.lastLoginAt)).not.toThrow();
  });
});

describe("AuthState discriminated union", () => {
  it("loading state is valid", () => {
    const state: AuthState = { status: "loading" };
    expect(state.status).toBe("loading");
  });

  it("unauthenticated state is valid", () => {
    const state: AuthState = { status: "unauthenticated" };
    expect(state.status).toBe("unauthenticated");
  });

  it("authenticated state carries user", () => {
    const user: AuthUser = {
      uid: "uid-456",
      email: "a@b.com",
      displayName: "Alice",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    const state: AuthState = { status: "authenticated", user };
    expect(state.status).toBe("authenticated");
    if (state.status === "authenticated") {
      expect(state.user.uid).toBe("uid-456");
    }
  });
});

describe("AuthError contract schema", () => {
  const validError: AuthError = {
    code: "auth/email-already-in-use",
    message: "An account with this email already exists.",
  };

  it("has a code string field", () => {
    expect(typeof validError.code).toBe("string");
  });

  it("has a message string field (i18n value, not raw error code)", () => {
    expect(typeof validError.message).toBe("string");
    expect(validError.message).not.toContain("auth/");
  });
});

describe("Task extended schema (userId + updatedAt)", () => {
  const validTask: Task = {
    id: "task-abc",
    userId: "user-uid-123",
    title: "Buy groceries",
    description: "Milk and eggs",
    status: "open",
    createdAt: new Date().toISOString(),
    completedAt: null,
    archivedAt: null,
    updatedAt: new Date().toISOString(),
  };

  it("has a userId string field", () => {
    expect(typeof validTask.userId).toBe("string");
  });

  it("has an updatedAt ISO string field", () => {
    expect(typeof validTask.updatedAt).toBe("string");
    expect(() => new Date(validTask.updatedAt)).not.toThrow();
  });

  it("JSON round-trip preserves all fields including userId and updatedAt", () => {
    const parsed = JSON.parse(JSON.stringify(validTask)) as Task;
    expect(parsed.userId).toBe(validTask.userId);
    expect(parsed.updatedAt).toBe(validTask.updatedAt);
  });
});
