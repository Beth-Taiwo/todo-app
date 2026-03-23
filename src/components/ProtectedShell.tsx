"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "./AuthGuard";

// Auth routes are public — all other routes are protected by AuthGuard
const PUBLIC_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_ROUTES.has(pathname)) return <>{children}</>;
  return <AuthGuard>{children}</AuthGuard>;
}
