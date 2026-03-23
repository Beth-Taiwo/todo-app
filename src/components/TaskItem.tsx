"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useTaskContext } from "@/context/TaskContext";
import { validateTitle } from "@/lib/taskValidation";
import ConfirmAction from "./ConfirmAction";
import type { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      <li className="rounded-lg border bg-card p-4 shadow-sm">
        <Input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder={t("taskItem.editInputPlaceholder")}
          aria-label={t("taskItem.editInputPlaceholder")}
          className="mb-2"
        />
        {editError && (
          <p className="mb-2 text-sm text-destructive">{editError}</p>
        )}
        <div className="flex gap-2">
          <Button size="sm" type="button" onClick={handleSave}>
            {t("taskItem.saveButton")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={handleCancel}
          >
            {t("taskItem.cancelButton")}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <>
      <li
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm",
          task.status !== "open" && "opacity-70",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              "truncate text-sm font-medium",
              task.status === "completed" &&
                "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </span>
          {task.status === "completed" && (
            <Badge variant="secondary" className="shrink-0">
              Done
            </Badge>
          )}
          {task.status === "archived" && (
            <Badge variant="outline" className="shrink-0">
              Archived
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {task.status === "open" && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => completeTask(task.id)}
              >
                {t("taskItem.completeButton")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleStartEdit}
              >
                {t("taskItem.editButton")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setShowConfirm(true)}
              >
                {t("taskItem.archiveButton")}
              </Button>
            </>
          )}
          {(task.status === "completed" || task.status === "archived") && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => restoreTask(task.id)}
            >
              {t("taskItem.restoreButton")}
            </Button>
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
