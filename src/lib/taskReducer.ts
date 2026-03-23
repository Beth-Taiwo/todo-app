import type { Task, TaskAction } from "@/types/task";

export function taskReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;

    case "ADD_TASK": {
      const newTask: Task = {
        id: crypto.randomUUID(),
        userId: "", // populated by Firestore migration; empty for anonymous/local tasks
        title: action.payload.title,
        description: action.payload.description,
        status: "open",
        createdAt: new Date().toISOString(),
        completedAt: null,
        archivedAt: null,
        updatedAt: new Date().toISOString(),
      };
      return [newTask, ...state];
    }

    case "UPDATE_TASK":
      return state.map((task) =>
        task.id === action.payload.id
          ? {
              ...task,
              title: action.payload.title,
              description: action.payload.description,
              updatedAt: new Date().toISOString(),
            }
          : task,
      );

    case "COMPLETE_TASK":
      return state.map((task) => {
        if (task.id !== action.payload.id || task.status !== "open")
          return task;
        return {
          ...task,
          status: "completed",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

    case "ARCHIVE_TASK":
      return state.map((task) => {
        if (task.id !== action.payload.id || task.status !== "open")
          return task;
        return {
          ...task,
          status: "archived",
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

    case "RESTORE_TASK":
      return state.map((task) => {
        if (task.id !== action.payload.id || task.status === "open")
          return task;
        return {
          ...task,
          status: "open",
          completedAt: null,
          archivedAt: null,
          updatedAt: new Date().toISOString(),
        };
      });

    case "START_EDIT":
    case "CANCEL_EDIT":
      return state;

    default:
      return state;
  }
}
