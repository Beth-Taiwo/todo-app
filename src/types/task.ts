export type TaskStatus = "open" | "completed" | "archived";

export interface Task {
  id: string;
  userId: string; // Firebase Auth uid of the owning user
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string; // ISO 8601
  completedAt: string | null;
  archivedAt: string | null;
  updatedAt: string; // ISO 8601 — updated on every write
}

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export type TaskAction =
  | { type: "HYDRATE"; payload: Task[] }
  | { type: "ADD_TASK"; payload: { title: string; description: string } }
  | {
      type: "UPDATE_TASK";
      payload: { id: string; title: string; description: string };
    }
  | { type: "COMPLETE_TASK"; payload: { id: string } }
  | { type: "ARCHIVE_TASK"; payload: { id: string } }
  | { type: "RESTORE_TASK"; payload: { id: string } }
  | { type: "START_EDIT"; payload: { id: string } }
  | { type: "CANCEL_EDIT" };
