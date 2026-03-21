/**
 * LocalTaskProvider — a lightweight TaskProvider for unit/integration tests.
 *
 * Provides the same TaskContextValue interface as the real TaskProvider but
 * uses only the taskReducer and localStorage. It has NO Firebase dependency,
 * so it can run in any vitest environment without triggering the Firebase SDK.
 *
 * Use this in tests that exercise the task reducer / local-storage path
 * (add, complete, archive, restore, update). Tests that cover Firestore
 * sync should use the real TaskProvider with firebase mocks instead.
 */
import React, {
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
  importPromptVisible: boolean;
  addTask: (title: string, description: string) => void;
  updateTask: (id: string, title: string, description: string) => void;
  completeTask: (id: string) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;
  startEdit: (id: string) => void;
  cancelEdit: () => void;
  confirmImport: () => Promise<void>;
  declineImport: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function LocalTaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    dispatch({ type: "HYDRATE", payload: loadTasks() });
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever tasks change
  useEffect(() => {
    if (hydrated) saveTasks(tasks);
  }, [tasks, hydrated]);

  function dispatchAction(action: TaskAction) {
    dispatch(action);
  }

  const value: TaskContextValue = {
    openTasks: tasks.filter((t) => t.status === "open"),
    completedTasks: tasks.filter((t) => t.status === "completed"),
    archivedTasks: tasks.filter((t) => t.status === "archived"),
    editingTaskId,
    importPromptVisible: false,
    addTask: (title, description) =>
      dispatchAction({ type: "ADD_TASK", payload: { title, description } }),
    updateTask: (id, title, description) => {
      dispatchAction({
        type: "UPDATE_TASK",
        payload: { id, title, description },
      });
      setEditingTaskId(null);
    },
    completeTask: (id) =>
      dispatchAction({ type: "COMPLETE_TASK", payload: { id } }),
    archiveTask: (id) =>
      dispatchAction({ type: "ARCHIVE_TASK", payload: { id } }),
    restoreTask: (id) =>
      dispatchAction({ type: "RESTORE_TASK", payload: { id } }),
    startEdit: (id) => setEditingTaskId(id),
    cancelEdit: () => setEditingTaskId(null),
    confirmImport: async () => {},
    declineImport: () => {},
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx)
    throw new Error("useTaskContext must be used within a LocalTaskProvider");
  return ctx;
}
