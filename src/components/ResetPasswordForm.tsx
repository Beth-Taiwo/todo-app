"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <p
              role="alert"
              aria-live="assertive"
              className="text-sm text-destructive"
            >
              {t("auth.resetPassword.invalidLink")}
            </p>
          </CardContent>
        </Card>
      </div>
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
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {t("auth.resetPassword.success")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("auth.resetPassword.heading")}</CardTitle>
          <CardDescription>Choose a strong password</CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label={t("auth.resetPassword.heading")}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">
                {t("auth.resetPassword.passwordLabel")}
              </Label>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.resetPassword.passwordPlaceholder")}
                aria-describedby={
                  passwordError ? "reset-password-error" : undefined
                }
                aria-invalid={passwordError ? "true" : undefined}
                required
              />
              {passwordError && (
                <p
                  id="reset-password-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {passwordError}
                </p>
              )}
            </div>
            {error && (
              <p
                role="alert"
                aria-live="assertive"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? t("auth.resetPassword.submitting")
                : t("auth.resetPassword.submitButton")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t("auth.forgotPassword.loginLink")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
