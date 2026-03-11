import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadTasks, saveTasks } from "@/lib/taskStorage";
import type { Task } from "@/types/task";

const STORAGE_KEY = "todo-app:tasks";

const makeTask = (): Task => ({
  id: "task-1",
  title: "Test",
  description: "",
  status: "open",
  createdAt: "2026-03-11T10:00:00.000Z",
  completedAt: null,
  archivedAt: null,
});

describe("loadTasks", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns an empty array when localStorage has no entry", () => {
    expect(loadTasks()).toEqual([]);
  });

  it("returns the parsed task array when valid JSON is stored", () => {
    const tasks = [makeTask()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    expect(loadTasks()).toEqual(tasks);
  });

  it("returns [] when the stored JSON is corrupt", () => {
    localStorage.setItem(STORAGE_KEY, "{{invalid json{{");
    expect(loadTasks()).toEqual([]);
  });
});

describe("saveTasks", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("serialises the task array and writes it to localStorage", () => {
    const tasks = [makeTask()];
    saveTasks(tasks);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual(tasks);
  });

  it("overwrites any previously stored value", () => {
    saveTasks([makeTask()]);
    saveTasks([]);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(stored!)).toEqual([]);
  });
});
