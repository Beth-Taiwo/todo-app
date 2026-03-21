import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Nav } from "@/components/Nav";

const mockLogout = vi.fn();
const mockAuthState = {
  status: "authenticated" as const,
  user: {
    uid: "u1",
    email: "user@example.com",
    displayName: null,
    createdAt: "",
    lastLoginAt: "",
  },
};

vi.mock("@/context/AuthContext", () => ({
  useAuthContext: () => ({
    authState: mockAuthState,
    logout: mockLogout,
    login: vi.fn(),
    register: vi.fn(),
    sendPasswordReset: vi.fn(),
  }),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/",
}));

describe("Logout integration", () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockPush.mockReset();
  });

  it("shows a logout button when authenticated", () => {
    render(<Nav />);
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });

  it("calls logout and redirects to /login on click", async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<Nav />);
    await user.click(screen.getByRole("button", { name: /log out/i }));
    await waitFor(() => expect(mockLogout).toHaveBeenCalledOnce());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("handles logout being called when already logged out gracefully", async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<Nav />);
    const btn = screen.getByRole("button", { name: /log out/i });
    await user.click(btn);
    // Second click should not throw
    await user.click(btn);
    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(2));
  });
});
