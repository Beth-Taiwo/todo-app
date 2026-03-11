"use client";

import { t } from "@/lib/i18n";
import { useTaskContext } from "@/context/TaskContext";
import TaskItem from "./TaskItem";
import type { TaskStatus } from "@/types/task";
import styles from "./TaskList.module.css";

interface TaskListProps {
  filter: TaskStatus;
}

const emptyMessages: Record<TaskStatus, string> = {
  open: "taskList.emptyOpen",
  completed: "taskList.emptyCompleted",
  archived: "taskList.emptyArchived",
};

export default function TaskList({ filter }: TaskListProps) {
  const { openTasks, completedTasks, archivedTasks } = useTaskContext();

  const tasks =
    filter === "open"
      ? openTasks
      : filter === "completed"
        ? completedTasks
        : archivedTasks;

  if (tasks.length === 0) {
    return (
      <p className={styles.empty}>
        {t(emptyMessages[filter] as Parameters<typeof t>[0])}
      </p>
    );
  }

  return (
    <ul className={styles.list}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
