"use client";

import { t } from "@/lib/i18n";
import styles from "./ConfirmAction.module.css";

interface ConfirmActionProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmAction({
  onConfirm,
  onCancel,
}: ConfirmActionProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("confirmAction.ariaLabel")}
      className={styles.overlay}
    >
      <div className={styles.dialog}>
        <p className={styles.question}>{t("confirmAction.question")}</p>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            {t("confirmAction.confirmButton")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            {t("confirmAction.cancelButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
