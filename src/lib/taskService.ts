import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task, TaskStatus } from "@/types/task";

type NewTaskData = {
  title: string;
  description: string;
};

type TaskPatch = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  completedAt?: string | null;
  archivedAt?: string | null;
};

function timestampToISO(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === "string") return ts;
  return new Date().toISOString();
}

function docToTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    userId: data.userId as string,
    title: data.title as string,
    description: (data.description as string) ?? "",
    status: data.status as TaskStatus,
    createdAt: timestampToISO(data.createdAt),
    completedAt: data.completedAt ? timestampToISO(data.completedAt) : null,
    archivedAt: data.archivedAt ? timestampToISO(data.archivedAt) : null,
    updatedAt: timestampToISO(data.updatedAt),
  };
}

function tasksRef(userId: string) {
  return collection(db, "users", userId, "tasks");
}

export async function createTask(
  userId: string,
  data: NewTaskData,
): Promise<Task> {
  const now = serverTimestamp();
  const ref = await addDoc(tasksRef(userId), {
    userId,
    title: data.title,
    description: data.description,
    status: "open",
    createdAt: now,
    completedAt: null,
    archivedAt: null,
    updatedAt: now,
  });
  // Return an optimistic task while Firestore resolves the timestamps
  const isoNow = new Date().toISOString();
  return {
    id: ref.id,
    userId,
    title: data.title,
    description: data.description,
    status: "open",
    createdAt: isoNow,
    completedAt: null,
    archivedAt: null,
    updatedAt: isoNow,
  };
}

export function getTasks(
  userId: string,
  onUpdate: (tasks: Task[]) => void,
): Unsubscribe {
  return onSnapshot(tasksRef(userId), (snapshot) => {
    const tasks = snapshot.docs.map((d) =>
      docToTask(d.id, d.data() as Record<string, unknown>),
    );
    onUpdate(tasks);
  });
}

export async function updateTask(
  userId: string,
  taskId: string,
  patch: TaskPatch,
): Promise<void> {
  const ref = doc(db, "users", userId, "tasks", taskId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<void> {
  const ref = doc(db, "users", userId, "tasks", taskId);
  await deleteDoc(ref);
}
