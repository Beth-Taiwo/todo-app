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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("auth.login.heading")}</CardTitle>
          <CardDescription>
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label={t("auth.login.heading")}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">{t("auth.login.emailLabel")}</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.login.emailPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">
                {t("auth.login.passwordLabel")}
              </Label>
              <Input
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
                ? t("auth.login.submitting")
                : t("auth.login.submitButton")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t("auth.login.forgotPasswordLink")}
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.login.registerPrompt")}{" "}
              <Link
                href="/register"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t("auth.login.registerLink")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
