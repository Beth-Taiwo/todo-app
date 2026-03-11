"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useTaskContext } from "@/context/TaskContext";
import { validateTitle } from "@/lib/taskValidation";
import ConfirmAction from "./ConfirmAction";
import type { Task } from "@/types/task";
import styles from "./TaskItem.module.css";

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const {
    completeTask,
    archiveTask,
    restoreTask,
    updateTask,
    startEdit,
    cancelEdit,
    editingTaskId,
  } = useTaskContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description ?? "",
  );
  const [editError, setEditError] = useState<string | null>(null);

  const isEditing = editingTaskId === task.id;

  function handleStartEdit() {
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditError(null);
    startEdit(task.id);
  }

  function handleSave() {
    const validation = validateTitle(editTitle);
    if (!validation.valid) {
      setEditError(validation.error ?? null);
      return;
    }
    updateTask(task.id, editTitle.trim(), editDescription.trim());
  }

  function handleCancel() {
    cancelEdit();
    setEditError(null);
  }

  function handleArchiveConfirm() {
    setShowConfirm(false);
    archiveTask(task.id);
  }

  function handleArchiveCancel() {
    setShowConfirm(false);
  }

  if (isEditing) {
    return (
      <li className={styles.item}>
        <input
          className={styles.editInput}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder={t("taskItem.editInputPlaceholder")}
          aria-label={t("taskItem.editInputPlaceholder")}
        />
        {editError && <p className={styles.error}>{editError}</p>}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSave}
          >
            {t("taskItem.saveButton")}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleCancel}
          >
            {t("taskItem.cancelButton")}
          </button>
        </div>
      </li>
    );
  }

  return (
    <>
      <li className={styles.item}>
        <span className={styles.title}>{task.title}</span>
        <div className={styles.actions}>
          {task.status === "open" && (
            <>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => completeTask(task.id)}
              >
                {t("taskItem.completeButton")}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleStartEdit}
              >
                {t("taskItem.editButton")}
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setShowConfirm(true)}
              >
                {t("taskItem.archiveButton")}
              </button>
            </>
          )}
          {(task.status === "completed" || task.status === "archived") && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => restoreTask(task.id)}
            >
              {t("taskItem.restoreButton")}
            </button>
          )}
        </div>
      </li>
      {showConfirm && (
        <ConfirmAction
          onConfirm={handleArchiveConfirm}
          onCancel={handleArchiveCancel}
        />
      )}
    </>
  );
}
