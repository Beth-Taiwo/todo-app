import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { LoginForm } from "@/components/LoginForm";

const mockLogin = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuthContext: () => ({ login: mockLogin }),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/login",
}));

describe("LoginForm integration", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockPush.mockReset();
  });

  it("renders email and password fields with accessible labels", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("textbox", { name: /email address/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders a submit button and forgot password link", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /forgot password/i }),
    ).toBeInTheDocument();
  });

  it("calls login and redirects to / on success", async () => {
    mockLogin.mockResolvedValueOnce({
      uid: "uid-1",
      email: "user@example.com",
    });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByRole("textbox", { name: /email address/i }),
      "user@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "SecurePass1!");
    await user.click(screen.getByRole("button", { name: /log in/i }));
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith(
        "user@example.com",
        "SecurePass1!",
      ),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("shows error message when login fails with wrong password", async () => {
    mockLogin.mockRejectedValueOnce({
      code: "auth/invalid-credential",
      message: "Incorrect email or password.",
    });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByRole("textbox", { name: /email address/i }),
      "user@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));
    expect(
      await screen.findByText(/incorrect email or password/i),
    ).toBeInTheDocument();
  });

  it("shows the same error for nonexistent email (no user enumeration)", async () => {
    mockLogin.mockRejectedValueOnce({
      code: "auth/user-not-found",
      message: "Incorrect email or password.",
    });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByRole("textbox", { name: /email address/i }),
      "nobody@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "anypassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));
    expect(
      await screen.findByText(/incorrect email or password/i),
    ).toBeInTheDocument();
  });

  it("has a link to the register page", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("link", { name: /don't have an account/i }),
    ).toBeInTheDocument();
  });
});
