"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { validateTitle } from "@/lib/taskValidation";
import { useTaskContext } from "@/context/TaskContext";
import styles from "./TaskForm.module.css";

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
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <h1 className={styles.heading}>{t("taskForm.heading")}</h1>
      <div className={styles.row}>
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("taskForm.inputPlaceholder")}
          aria-label={t("taskForm.inputAriaLabel")}
        />
        <button type="submit" className={styles.submitButton}>
          {t("taskForm.submitButton")}
        </button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </form>
  );
}
