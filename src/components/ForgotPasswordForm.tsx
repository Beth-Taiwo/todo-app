"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { t } from "@/lib/i18n";

export function ForgotPasswordForm() {
  const { sendPasswordReset } = useAuthContext();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Always resolves — do not expose whether email is registered
    await sendPasswordReset(email);
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t("auth.forgotPassword.heading")}
    >
      <h1>{t("auth.forgotPassword.heading")}</h1>

      {submitted ? (
        <p role="status" aria-live="polite">
          {t("auth.forgotPassword.sent")}
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="forgot-email">
              {t("auth.forgotPassword.emailLabel")}
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.forgotPassword.emailPlaceholder")}
              required
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting
              ? t("auth.forgotPassword.submitting")
              : t("auth.forgotPassword.submitButton")}
          </button>
        </>
      )}

      <p>
        <Link href="/login">{t("auth.forgotPassword.loginLink")}</Link>
      </p>
    </form>
  );
}
