"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { t } from "@/lib/i18n";
import type { AuthError } from "@/types/auth";

export function LoginForm() {
  const { login } = useAuthContext();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      const authErr = err as AuthError;
      setError(authErr.message ?? t("auth.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t("auth.login.heading")}
    >
      <h1>{t("auth.login.heading")}</h1>

      <div>
        <label htmlFor="login-email">{t("auth.login.emailLabel")}</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.login.emailPlaceholder")}
          required
        />
      </div>

      <div>
        <label htmlFor="login-password">{t("auth.login.passwordLabel")}</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.login.passwordPlaceholder")}
          required
        />
      </div>

      {error && (
        <p role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? t("auth.login.submitting") : t("auth.login.submitButton")}
      </button>

      <p>
        <Link href="/forgot-password">
          {t("auth.login.forgotPasswordLink")}
        </Link>
      </p>
      <p>
        <Link href="/register">{t("auth.login.registerLink")}</Link>
      </p>
    </form>
  );
}
