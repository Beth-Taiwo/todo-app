"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";
import type { Task } from "@/types/task";
import type { TaskAction } from "@/types/task";
import { taskReducer } from "@/lib/taskReducer";
import { loadTasks, saveTasks } from "@/lib/taskStorage";

interface TaskContextValue {
  openTasks: Task[];
  completedTasks: Task[];
  archivedTasks: Task[];
  editingTaskId: string | null;
  addTask: (title: string, description: string) => void;
  updateTask: (id: string, title: string, description: string) => void;
  completeTask: (id: string) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;
  startEdit: (id: string) => void;
  cancelEdit: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatch({ type: "HYDRATE", payload: loadTasks() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveTasks(tasks);
    }
  }, [tasks, hydrated]);

  const openTasks = tasks.filter((t) => t.status === "open");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const archivedTasks = tasks.filter((t) => t.status === "archived");

  function dispatchAndEdit(action: TaskAction) {
    dispatch(action);
  }

  const value: TaskContextValue = {
    openTasks,
    completedTasks,
    archivedTasks,
    editingTaskId,
    addTask: (title, description) =>
      dispatchAndEdit({ type: "ADD_TASK", payload: { title, description } }),
    updateTask: (id, title, description) => {
      dispatchAndEdit({
        type: "UPDATE_TASK",
        payload: { id, title, description },
      });
      setEditingTaskId(null);
    },
    completeTask: (id) =>
      dispatchAndEdit({ type: "COMPLETE_TASK", payload: { id } }),
    archiveTask: (id) =>
      dispatchAndEdit({ type: "ARCHIVE_TASK", payload: { id } }),
    restoreTask: (id) =>
      dispatchAndEdit({ type: "RESTORE_TASK", payload: { id } }),
    startEdit: (id) => setEditingTaskId(id),
    cancelEdit: () => setEditingTaskId(null),
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx)
    throw new Error("useTaskContext must be used within a TaskProvider");
  return ctx;
}
