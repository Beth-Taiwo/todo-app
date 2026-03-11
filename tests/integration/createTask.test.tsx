import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskProvider } from "@/context/TaskContext";
import TaskList from "@/components/TaskList";
import TaskForm from "@/components/TaskForm";

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
