"use client";

import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="mx-4 w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
        <p className="mb-4 text-sm font-medium">
          {t("confirmAction.question")}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onCancel}>
            {t("confirmAction.cancelButton")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            type="button"
            onClick={onConfirm}
          >
            {t("confirmAction.confirmButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}
