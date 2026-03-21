"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { t } from "@/lib/i18n";

function validatePassword(password: string): string | null {
  if (password.length < 8) return t("auth.errors.weakPassword");
  if (!/[\d\W_]/.test(password)) return t("auth.errors.weakPassword");
  return null;
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!oobCode) {
    return (
      <p role="alert" aria-live="assertive">
        {t("auth.resetPassword.invalidLink")}
      </p>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(password);
    setPasswordError(pwError);
    if (pwError) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode!, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError(t("auth.resetPassword.invalidLink"));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p role="status" aria-live="polite">
        {t("auth.resetPassword.success")}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t("auth.resetPassword.heading")}
    >
      <h1>{t("auth.resetPassword.heading")}</h1>

      <div>
        <label htmlFor="reset-password">
          {t("auth.resetPassword.passwordLabel")}
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.resetPassword.passwordPlaceholder")}
          aria-describedby={passwordError ? "reset-password-error" : undefined}
          aria-invalid={passwordError ? "true" : undefined}
          required
        />
        {passwordError && (
          <span id="reset-password-error" role="alert">
            {passwordError}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting
          ? t("auth.resetPassword.submitting")
          : t("auth.resetPassword.submitButton")}
      </button>

      <p>
        <Link href="/login">{t("auth.forgotPassword.loginLink")}</Link>
      </p>
    </form>
  );
}
