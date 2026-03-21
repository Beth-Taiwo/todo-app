import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TaskProvider } from "@/context/TaskContext";
import TaskList from "@/components/TaskList";
import TaskForm from "@/components/TaskForm";

// Stable authState object — must be the same reference each render to prevent
// the authState useEffect dependency from triggering an infinite re-render loop.
vi.mock("@/context/AuthContext", () => {
  const authState = { status: "unauthenticated" } as const;
  return {
    useAuthContext: () => ({
      authState,
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      sendPasswordReset: vi.fn(),
    }),
  };
});
vi.mock("@/lib/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/lib/taskService", () => ({
  createTask: vi.fn(),
  getTasks: vi.fn(() => () => {}),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

function TaskPageUI() {
  return (
    <TaskProvider>
      <TaskForm />
      <TaskList filter="open" />
    </TaskProvider>
  );
}

describe("Create task integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the task form with an input and submit button", () => {
    render(<TaskPageUI />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("adds a new task to the list when the form is submitted", async () => {
    const user = userEvent.setup();
    render(<TaskPageUI />);

    await user.type(screen.getByRole("textbox"), "Buy groceries");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("clears the input after submission", async () => {
    const user = userEvent.setup();
    render(<TaskPageUI />);

    const input = screen.getByRole("textbox");
    await user.type(input, "Buy groceries");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(input).toHaveValue("");
  });

  it("shows a validation error when submitting an empty title", async () => {
    const user = userEvent.setup();
    render(<TaskPageUI />);

    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows empty-state message when no tasks exist", () => {
    render(<TaskPageUI />);
    expect(screen.getByText(/no open tasks/i)).toBeInTheDocument();
  });
});
