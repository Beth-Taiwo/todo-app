"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { t } from "@/lib/i18n";
import type { AuthError } from "@/types/auth";

function validatePassword(password: string): string | null {
  if (password.length < 8) return t("auth.errors.weakPassword");
  if (!/[\d\W_]/.test(password)) return t("auth.errors.weakPassword");
  return null;
}

export function RegisterForm() {
  const { register } = useAuthContext();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    // Client-side validation
    const pwError = validatePassword(password);
    setPasswordError(pwError);
    if (pwError) return;
    setEmailError(null);

    setSubmitting(true);
    try {
      await register(email, password);
      router.push("/");
    } catch (err) {
      const authErr = err as AuthError;
      if (
        authErr.code === "auth/invalid-email" ||
        authErr.code === "auth/email-already-in-use"
      ) {
        setEmailError(authErr.message);
      } else {
        setServerError(authErr.message ?? t("auth.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t("auth.register.heading")}
    >
      <h1>{t("auth.register.heading")}</h1>

      <div>
        <label htmlFor="register-email">{t("auth.register.emailLabel")}</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.register.emailPlaceholder")}
          aria-describedby={emailError ? "register-email-error" : undefined}
          aria-invalid={emailError ? "true" : undefined}
          required
        />
        {emailError && (
          <span id="register-email-error" role="alert">
            {emailError}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="register-password">
          {t("auth.register.passwordLabel")}
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.register.passwordPlaceholder")}
          aria-describedby={
            passwordError ? "register-password-error" : undefined
          }
          aria-invalid={passwordError ? "true" : undefined}
          required
        />
        {passwordError && (
          <span id="register-password-error" role="alert">
            {passwordError}
          </span>
        )}
      </div>

      {serverError && (
        <p role="alert" aria-live="assertive">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting
          ? t("auth.register.submitting")
          : t("auth.register.submitButton")}
      </button>

      <p>
        <Link href="/login">{t("auth.register.loginLink")}</Link>
      </p>
    </form>
  );
}
