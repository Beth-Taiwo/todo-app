import { t } from "@/lib/i18n";
import type { ValidationResult } from "@/types/task";

export function validateTitle(title: string): ValidationResult {
  if (title.trim().length === 0) {
    return { valid: false, error: t("taskForm.validationRequired") };
  }
  if (title.length > 120) {
    return { valid: false, error: t("taskForm.validationMaxLength") };
  }
  return { valid: true, error: null };
}
