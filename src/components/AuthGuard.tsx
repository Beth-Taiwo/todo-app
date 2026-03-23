"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { authState } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === "unauthenticated") {
      router.replace("/login");
    }
  }, [authState.status, router]);

  if (authState.status === "loading") {
    return (
      <div role="status" aria-live="polite" aria-label="Loading">
        <span aria-hidden="true">Loading…</span>
      </div>
    );
  }

  if (authState.status === "unauthenticated") {
    // Render nothing while redirect is in progress
    return null;
  }

  return <>{children}</>;
}
