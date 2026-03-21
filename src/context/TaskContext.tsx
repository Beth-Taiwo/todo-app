"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Task } from "@/types/task";
import { taskReducer } from "@/lib/taskReducer";
import { loadTasks, saveTasks } from "@/lib/taskStorage";
import { createTask, getTasks, updateTask } from "@/lib/taskService";
import { useAuthContext } from "@/context/AuthContext";
import { t } from "@/lib/i18n";

const IMPORT_DONE_KEY = "todo-app:imported";

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

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [importPromptVisible, setImportPromptVisible] = useState(false);
  const [localAnonymousTasks, setLocalAnonymousTasks] = useState<Task[]>([]);

  const { authState } = useAuthContext();

  // Subscribe to Firestore when authenticated, fall back to localStorage when not
  useEffect(() => {
    if (authState.status === "loading") return;

    if (authState.status === "unauthenticated") {
      // Not logged in — use localStorage
      dispatch({ type: "HYDRATE", payload: loadTasks() });
      return;
    }

    // Authenticated — subscribe to Firestore real-time listener
    const userId = authState.user.uid;
    const unsubscribe = getTasks(userId, (firestoreTasks) => {
      dispatch({ type: "HYDRATE", payload: firestoreTasks });
    });

    // Check for anonymous tasks to import (first login only)
    const alreadyImported =
      typeof window !== "undefined" &&
      localStorage.getItem(IMPORT_DONE_KEY) === "true";

    if (!alreadyImported) {
      const anonymous = loadTasks().filter((t) => !t.userId || t.userId === "");
      if (anonymous.length > 0) {
        setLocalAnonymousTasks(anonymous);
        setImportPromptVisible(true);
      }
    }

    return () => unsubscribe();
  }, [authState]);

  // Keep localStorage in sync for unauthenticated state
  useEffect(() => {
    if (authState.status === "unauthenticated") {
      saveTasks(tasks);
    }
  }, [tasks, authState.status]);

  const openTasks = tasks.filter((t) => t.status === "open");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const archivedTasks = tasks.filter((t) => t.status === "archived");

  function addTaskHandler(title: string, description: string) {
    if (authState.status === "authenticated") {
      const userId = authState.user.uid;
      createTask(userId, { title, description }).then((task) => {
        // Optimistic: Firestore onSnapshot will update state; dispatch for instant feedback
        dispatch({ type: "ADD_TASK", payload: { title, description } });
        void task;
      });
    } else {
      dispatch({ type: "ADD_TASK", payload: { title, description } });
    }
  }

  function updateTaskHandler(id: string, title: string, description: string) {
    dispatch({ type: "UPDATE_TASK", payload: { id, title, description } });
    setEditingTaskId(null);
    if (authState.status === "authenticated") {
      const userId = authState.user.uid;
      void updateTask(userId, id, { title, description });
    }
  }

  function completeTaskHandler(id: string) {
    dispatch({ type: "COMPLETE_TASK", payload: { id } });
    if (authState.status === "authenticated") {
      const userId = authState.user.uid;
      void updateTask(userId, id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    }
  }

  function archiveTaskHandler(id: string) {
    dispatch({ type: "ARCHIVE_TASK", payload: { id } });
    if (authState.status === "authenticated") {
      const userId = authState.user.uid;
      void updateTask(userId, id, {
        status: "archived",
        archivedAt: new Date().toISOString(),
      });
    }
  }

  function restoreTaskHandler(id: string) {
    dispatch({ type: "RESTORE_TASK", payload: { id } });
    if (authState.status === "authenticated") {
      const userId = authState.user.uid;
      void updateTask(userId, id, {
        status: "open",
        completedAt: null,
        archivedAt: null,
      });
    }
  }

  const confirmImport = useCallback(async () => {
    if (authState.status !== "authenticated") return;
    const userId = authState.user.uid;
    for (const task of localAnonymousTasks) {
      await createTask(userId, {
        title: task.title,
        description: task.description,
      });
    }
    localStorage.setItem(IMPORT_DONE_KEY, "true");
    setImportPromptVisible(false);
    setLocalAnonymousTasks([]);
  }, [authState, localAnonymousTasks]);

  const declineImport = useCallback(() => {
    localStorage.setItem(IMPORT_DONE_KEY, "true");
    setImportPromptVisible(false);
    setLocalAnonymousTasks([]);
  }, []);

  const value: TaskContextValue = {
    openTasks,
    completedTasks,
    archivedTasks,
    editingTaskId,
    importPromptVisible,
    addTask: addTaskHandler,
    updateTask: updateTaskHandler,
    completeTask: completeTaskHandler,
    archiveTask: archiveTaskHandler,
    restoreTask: restoreTaskHandler,
    startEdit: (id) => setEditingTaskId(id),
    cancelEdit: () => setEditingTaskId(null),
    confirmImport,
    declineImport,
  };

  return (
    <TaskContext.Provider value={value}>
      {importPromptVisible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("auth.importPrompt.heading")}
        >
          <h2>{t("auth.importPrompt.heading")}</h2>
          <p>{t("auth.importPrompt.body")}</p>
          <button onClick={() => void confirmImport()}>
            {t("auth.importPrompt.confirmButton")}
          </button>
          <button onClick={declineImport}>
            {t("auth.importPrompt.declineButton")}
          </button>
        </div>
      )}
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx)
    throw new Error("useTaskContext must be used within a TaskProvider");
  return ctx;
}
