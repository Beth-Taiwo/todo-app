import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskProvider } from "@/context/TaskContext";
import TaskList from "@/components/TaskList";
import TaskForm from "@/components/TaskForm";

function App() {
  return (
    <TaskProvider>
      <TaskForm />
      <TaskList filter="open" />
    </TaskProvider>
  );
}

describe("Update task integration", () => {
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

  it("shows an edit button on each open task", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Buy milk");

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("shows an inline edit input when edit is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Buy milk");

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByDisplayValue("Buy milk")).toBeInTheDocument();
  });

  it("updates the task title after saving the edit", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Buy milk");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const editInput = screen.getByDisplayValue("Buy milk");
    await user.clear(editInput);
    await user.type(editInput, "Buy oat milk");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText("Buy oat milk")).toBeInTheDocument();
    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
  });

  it("cancels the edit and restores original title", async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, "Buy milk");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const editInput = screen.getByDisplayValue("Buy milk");
    await user.clear(editInput);
    await user.type(editInput, "Something else");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.queryByText("Something else")).not.toBeInTheDocument();
  });
});
