import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted() so these refs are available inside vi.mock() factory
const {
  mockAddDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockOnSnapshot,
  mockCollection,
  mockDoc,
  mockServerTimestamp,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockCollection: vi.fn(),
  mockDoc: vi.fn(),
  mockServerTimestamp: vi.fn(() => ({ _type: "server_timestamp" })),
}));

vi.mock("firebase/firestore", () => ({
  collection: mockCollection,
  doc: mockDoc,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: mockServerTimestamp,
  Timestamp: class {
    seconds: number;
    nanoseconds: number;
    constructor(s: number, n: number) {
      this.seconds = s;
      this.nanoseconds = n;
    }
    toDate() {
      return new Date(this.seconds * 1000);
    }
  },
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "@/lib/taskService";

const USER_ID = "user-uid-test";
const TASK_ID = "task-id-123";

describe("taskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue({ path: `users/${USER_ID}/tasks` });
    mockDoc.mockReturnValue({ path: `users/${USER_ID}/tasks/${TASK_ID}` });
  });

  describe("createTask", () => {
    it("adds a document to the correct user-scoped Firestore path", async () => {
      mockAddDoc.mockResolvedValueOnce({ id: TASK_ID });
      const task = await createTask(USER_ID, {
        title: "Buy milk",
        description: "2 litres",
      });
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "users",
        USER_ID,
        "tasks",
      );
      expect(mockAddDoc).toHaveBeenCalledOnce();
      expect(task.id).toBe(TASK_ID);
      expect(task.userId).toBe(USER_ID);
      expect(task.title).toBe("Buy milk");
      expect(task.status).toBe("open");
    });

    it("sets userId equal to the passed userId", async () => {
      mockAddDoc.mockResolvedValueOnce({ id: "t2" });
      const task = await createTask(USER_ID, { title: "x", description: "" });
      expect(task.userId).toBe(USER_ID);
    });
  });

  describe("getTasks", () => {
    it("calls onSnapshot with user-scoped collection path", () => {
      const onUpdate = vi.fn();
      mockOnSnapshot.mockImplementationOnce((ref, cb) => {
        cb({ docs: [] });
        return () => {};
      });
      getTasks(USER_ID, onUpdate);
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "users",
        USER_ID,
        "tasks",
      );
      expect(onUpdate).toHaveBeenCalledWith([]);
    });

    it("returns an unsubscribe function", () => {
      const unsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValueOnce(unsubscribe);
      const result = getTasks(USER_ID, vi.fn());
      expect(typeof result).toBe("function");
    });
  });

  describe("updateTask", () => {
    it("updates the correct user-scoped document", async () => {
      mockUpdateDoc.mockResolvedValueOnce(undefined);
      await updateTask(USER_ID, TASK_ID, { title: "Updated title" });
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "users",
        USER_ID,
        "tasks",
        TASK_ID,
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: "Updated title",
          updatedAt: expect.anything(),
        }),
      );
    });
  });

  describe("deleteTask", () => {
    it("deletes the correct user-scoped document", async () => {
      mockDeleteDoc.mockResolvedValueOnce(undefined);
      await deleteTask(USER_ID, TASK_ID);
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "users",
        USER_ID,
        "tasks",
        TASK_ID,
      );
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });
});
