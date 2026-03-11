import { describe, it, expect } from "vitest";
import { taskReducer } from "@/lib/taskReducer";
import type { Task } from "@/types/task";

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  title: "Test task",
  description: "",
  status: "open",
  createdAt: "2026-03-11T10:00:00.000Z",
  completedAt: null,
  archivedAt: null,
  ...overrides,
});

describe("taskReducer — HYDRATE", () => {
  it("replaces state with the provided array", () => {
    const tasks = [makeTask()];
    const state = taskReducer([], { type: "HYDRATE", payload: tasks });
    expect(state).toEqual(tasks);
  });
});

describe("taskReducer — ADD_TASK", () => {
  it("prepends a new open task with a unique id and ISO createdAt", () => {
    const state = taskReducer([], {
      type: "ADD_TASK",
      payload: { title: "New task", description: "desc" },
    });
    expect(state).toHaveLength(1);
    expect(state[0].title).toBe("New task");
    expect(state[0].status).toBe("open");
    expect(state[0].id).toBeTruthy();
    expect(() => new Date(state[0].createdAt)).not.toThrow();
  });

  it("prepends so the newest task is at index 0", () => {
    const existing = makeTask({ id: "old" });
    const state = taskReducer([existing], {
      type: "ADD_TASK",
      payload: { title: "Newer", description: "" },
    });
    expect(state[0].title).toBe("Newer");
    expect(state[1].id).toBe("old");
  });
});

describe("taskReducer — UPDATE_TASK", () => {
  it("updates title and description of the matching task", () => {
    const state = taskReducer([makeTask()], {
      type: "UPDATE_TASK",
      payload: { id: "task-1", title: "Updated", description: "new desc" },
    });
    expect(state[0].title).toBe("Updated");
    expect(state[0].description).toBe("new desc");
  });

  it("does not modify other tasks", () => {
    const other = makeTask({ id: "task-2", title: "Other" });
    const state = taskReducer([makeTask(), other], {
      type: "UPDATE_TASK",
      payload: { id: "task-1", title: "Changed", description: "" },
    });
    expect(state[1].title).toBe("Other");
  });
});

describe("taskReducer — COMPLETE_TASK", () => {
  it("sets status to completed and records completedAt", () => {
    const state = taskReducer([makeTask()], {
      type: "COMPLETE_TASK",
      payload: { id: "task-1" },
    });
    expect(state[0].status).toBe("completed");
    expect(state[0].completedAt).toBeTruthy();
  });

  it("does not allow completed → open (invalid transition guard)", () => {
    const completed = makeTask({
      status: "completed",
      completedAt: "2026-03-11T11:00:00.000Z",
    });
    const state = taskReducer([completed], {
      type: "COMPLETE_TASK",
      payload: { id: "task-1" },
    });
    expect(state[0].status).toBe("completed");
  });

  it("does not allow archived → completed (invalid transition guard)", () => {
    const archived = makeTask({
      status: "archived",
      archivedAt: "2026-03-11T11:00:00.000Z",
    });
    const state = taskReducer([archived], {
      type: "COMPLETE_TASK",
      payload: { id: "task-1" },
    });
    expect(state[0].status).toBe("archived");
  });
});

describe("taskReducer — ARCHIVE_TASK", () => {
  it("sets status to archived and records archivedAt", () => {
    const state = taskReducer([makeTask()], {
      type: "ARCHIVE_TASK",
      payload: { id: "task-1" },
    });
    expect(state[0].status).toBe("archived");
    expect(state[0].archivedAt).toBeTruthy();
  });

  it("does not allow completed → archived", () => {
    const completed = makeTask({
      status: "completed",
      completedAt: "2026-03-11T11:00:00.000Z",
    });
    const state = taskReducer([completed], {
      type: "ARCHIVE_TASK",
      payload: { id: "task-1" },
    });
    expect(state[0].status).toBe("completed");
  });
});

describe("taskReducer — RESTORE_TASK", () => {
  it("restores an archived task to open and clears archivedAt", () => {
    const archived = makeTask({
      status: "archived",
      archivedAt: "2026-03-11T11:00:00.000Z",
    });
    const state = taskReducer([archived], {
      type: "RESTORE_TASK",
      payload: { id: "task-1" },
    });
    expect(state[0].status).toBe("open");
    expect(state[0].archivedAt).toBeNull();
  });
});

describe("taskReducer — START_EDIT / CANCEL_EDIT", () => {
  it("START_EDIT action returns state unchanged (editingTaskId lives in context, not reducer)", () => {
    const state = taskReducer([makeTask()], {
      type: "START_EDIT",
      payload: { id: "task-1" },
    });
    expect(state).toEqual([makeTask()]);
  });

  it("CANCEL_EDIT action returns state unchanged", () => {
    const state = taskReducer([makeTask()], { type: "CANCEL_EDIT" });
    expect(state).toEqual([makeTask()]);
  });
});
