import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { RegisterForm } from "@/components/RegisterForm";

// Mock AuthContext so tests don't need Firebase initialized
const mockRegister = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuthContext: () => ({ register: mockRegister }),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => "/register",
}));

describe("RegisterForm integration", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockPush.mockReset();
  });

  it("renders email and password fields with accessible labels", () => {
    render(<RegisterForm />);
    expect(
      screen.getByRole("textbox", { name: /email address/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    render(<RegisterForm />);
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("shows weak password error for password without digit or symbol", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/password/i), "weakpassword");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/8 characters/i);
  });

  it("shows weak password error for password shorter than 8 characters", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByLabelText(/password/i), "Ab1!");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("calls register and redirects on success", async () => {
    mockRegister.mockResolvedValueOnce({
      uid: "uid-1",
      email: "user@example.com",
    });
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(
      screen.getByRole("textbox", { name: /email address/i }),
      "user@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "SecurePass1!");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(
        "user@example.com",
        "SecurePass1!",
      ),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("shows email-already-in-use error from server", async () => {
    mockRegister.mockRejectedValueOnce({
      code: "auth/email-already-in-use",
      message: "An account with this email already exists.",
    });
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(
      screen.getByRole("textbox", { name: /email address/i }),
      "taken@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "SecurePass1!");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(
      await screen.findByText(/An account with this email already exists/i),
    ).toBeInTheDocument();
  });

  it("has a link to the login page", () => {
    render(<RegisterForm />);
    expect(
      screen.getByRole("link", { name: /already have an account/i }),
    ).toBeInTheDocument();
  });
});
