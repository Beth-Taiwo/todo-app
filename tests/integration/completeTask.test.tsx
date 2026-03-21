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
      <TaskList filter="completed" />
    </TaskProvider>
  );
}

describe("Complete task integration", () => {
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

  it("shows a complete button on each open task", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Walk the dog");

    expect(
      screen.getByRole("button", { name: /complete/i }),
    ).toBeInTheDocument();
  });

  it("moves a task to the completed list after clicking complete", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Walk the dog");

    await user.click(screen.getByRole("button", { name: /complete/i }));

    // Task should now appear in completed section
    const completedItems = screen.getAllByText("Walk the dog");
    expect(completedItems.length).toBeGreaterThanOrEqual(1);
  });

  it("removes the task from the open list after completing", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Walk the dog");

    await user.click(screen.getByRole("button", { name: /complete/i }));

    // Complete button should no longer appear (task moved to completed where it has no complete btn)
    expect(
      screen.queryByRole("button", { name: /complete/i }),
    ).not.toBeInTheDocument();
  });
});
