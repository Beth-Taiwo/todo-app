"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("auth.forgotPassword.heading")}</CardTitle>
          <CardDescription>We&apos;ll send a reset link to your email</CardDescription>
        </CardHeader>
        {submitted ? (
          <CardContent>
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {t("auth.forgotPassword.sent")}
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit} noValidate aria-label={t("auth.forgotPassword.heading")}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">{t("auth.forgotPassword.emailLabel")}</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.forgotPassword.emailPlaceholder")}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submitButton")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                  {t("auth.forgotPassword.loginLink")}
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
        {submitted && (
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                {t("auth.forgotPassword.loginLink")}
              </Link>
            </p>
          </CardFooter>
        )}  
      </Card>
    </div>
  );
}
