import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TaskProvider } from "@/context/TaskContext";
import TaskList from "@/components/TaskList";
import TaskForm from "@/components/TaskForm";

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

function App() {
  return (
    <TaskProvider>
      <TaskForm />
      <TaskList filter="open" />
      <TaskList filter="archived" />
    </TaskProvider>
  );
}

describe("Archive task integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  async function addTask(
    user: ReturnType<typeof userEvent.setup>,
    title: string,
  ) {
    await user.type(screen.getByRole("textbox"), title);
    await user.click(screen.getByRole("button", { name: /add/i }));
  }

  it("shows an archive button on each open task", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Read a book");

    expect(
      screen.getByRole("button", { name: /^archive$/i }),
    ).toBeInTheDocument();
  });

  it("shows a confirmation dialog before archiving", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Read a book");

    await user.click(screen.getByRole("button", { name: /^archive$/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("moves the task to archived when confirmed", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Read a book");

    await user.click(screen.getByRole("button", { name: /^archive$/i }));
    await user.click(screen.getByRole("button", { name: /yes, archive/i }));

    const items = screen.getAllByText("Read a book");
    expect(items.length).toBeGreaterThanOrEqual(1);
    // Archive button on open list should be gone
    expect(
      screen.queryByRole("button", { name: /^archive$/i }),
    ).not.toBeInTheDocument();
  });

  it("cancels the archive when dialog is dismissed", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Read a book");

    await user.click(screen.getByRole("button", { name: /^archive$/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Task should still be in the open list with archive button
    expect(screen.getByText("Read a book")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^archive$/i }),
    ).toBeInTheDocument();
  });
});
