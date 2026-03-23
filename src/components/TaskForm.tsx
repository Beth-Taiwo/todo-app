"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { validateTitle } from "@/lib/taskValidation";
import { useTaskContext } from "@/context/TaskContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TaskForm() {
  const { addTask } = useTaskContext();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateTitle(title);
    if (!validation.valid) {
      setError(validation.error ?? null);
      return;
    }
    addTask(title.trim(), "");
    setTitle("");
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">
        {t("taskForm.heading")}
      </h1>
      <div className="flex gap-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("taskForm.inputPlaceholder")}
          aria-label={t("taskForm.inputAriaLabel")}
          className="flex-1"
        />
        <Button type="submit">{t("taskForm.submitButton")}</Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
