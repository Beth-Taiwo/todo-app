import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted() so these are available inside vi.mock() factory (hoisting-safe)
const {
  mockCreateUserWithEmailAndPassword,
  mockSignInWithEmailAndPassword,
  mockSignOut,
  mockSendPasswordResetEmail,
} = vi.hoisted(() => ({
  mockCreateUserWithEmailAndPassword: vi.fn(),
  mockSignInWithEmailAndPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  signOut: mockSignOut,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

vi.mock("@/lib/firebase", () => ({
  auth: {},
}));

// Mock the session/logout fetch calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { register, login, logout, sendPasswordReset } from "@/lib/authService";

function makeMockUser(uid = "uid-123", email = "user@example.com") {
  return {
    uid,
    email,
    displayName: null,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    getIdToken: vi.fn().mockResolvedValue("mock-id-token"),
  };
}

describe("authService.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("calls createUserWithEmailAndPassword with email and password", async () => {
    const user = makeMockUser();
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user });
    await register("user@example.com", "SecurePass1!");
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "user@example.com",
      "SecurePass1!",
    );
  });

  it("POSTs the id token to /api/auth/session", async () => {
    const user = makeMockUser();
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user });
    await register("user@example.com", "SecurePass1!");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/session",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns an AuthUser with uid and email", async () => {
    const user = makeMockUser("uid-abc", "test@example.com");
    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user });
    const result = await register("test@example.com", "SecurePass1!");
    expect(result.uid).toBe("uid-abc");
    expect(result.email).toBe("test@example.com");
  });

  it("throws an AuthError with mapped message on Firebase error", async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/email-already-in-use",
    });
    await expect(
      register("taken@example.com", "SecurePass1!"),
    ).rejects.toMatchObject({
      code: "auth/email-already-in-use",
      message: expect.stringContaining("already exists"),
    });
  });
});

describe("authService.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("calls signInWithEmailAndPassword with email and password", async () => {
    const user = makeMockUser();
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user });
    await login("user@example.com", "SecurePass1!");
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "user@example.com",
      "SecurePass1!",
    );
  });

  it("returns an AuthUser with uid and email", async () => {
    const user = makeMockUser("uid-xyz", "login@example.com");
    mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user });
    const result = await login("login@example.com", "SecurePass1!");
    expect(result.uid).toBe("uid-xyz");
  });

  it("throws AuthError with invalidCredentials message for wrong password", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValueOnce({
      code: "auth/invalid-credential",
    });
    await expect(login("user@example.com", "wrongpass")).rejects.toMatchObject({
      code: "auth/invalid-credential",
      message: "Incorrect email or password.",
    });
  });
});

describe("authService.logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    mockSignOut.mockResolvedValue(undefined);
  });

  it("POSTs to /api/auth/logout", async () => {
    await logout();
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });

  it("calls Firebase signOut client-side", async () => {
    await logout();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});

describe("authService.sendPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always resolves — does not throw even for unregistered email", async () => {
    mockSendPasswordResetEmail.mockRejectedValueOnce({
      code: "auth/user-not-found",
    });
    await expect(
      sendPasswordReset("nobody@example.com"),
    ).resolves.toBeUndefined();
  });

  it("calls sendPasswordResetEmail with the provided email", async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);
    await sendPasswordReset("user@example.com");
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "user@example.com",
    );
  });
});
