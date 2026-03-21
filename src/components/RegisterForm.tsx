"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { t } from "@/lib/i18n";
import type { AuthError } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("auth.register.heading")}</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate aria-label={t("auth.register.heading")}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-email">{t("auth.register.emailLabel")}</Label>
              <Input
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
                <p id="register-email-error" role="alert" className="text-sm text-destructive">
                  {emailError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">{t("auth.register.passwordLabel")}</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.register.passwordPlaceholder")}
                aria-describedby={passwordError ? "register-password-error" : undefined}
                aria-invalid={passwordError ? "true" : undefined}
                required
              />
              {passwordError && (
                <p id="register-password-error" role="alert" className="text-sm text-destructive">
                  {passwordError}
                </p>
              )}
            </div>
            {serverError && (
              <p role="alert" aria-live="assertive" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t("auth.register.submitting") : t("auth.register.submitButton")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.register.loginPrompt")}{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                {t("auth.register.loginLink")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

