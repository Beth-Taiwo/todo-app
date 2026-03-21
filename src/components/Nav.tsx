"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { authState, logout } = useAuthContext();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const linkClass = (href: string) =>
    cn(
      "text-sm font-medium transition-colors hover:text-foreground/80",
      pathname === href ? "text-foreground" : "text-foreground/60",
    );

  return (
    <nav
      className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          {authState.status === "authenticated" && (
            <>
              <Link
                href="/"
                className={linkClass("/")}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                {t("nav.open")}
              </Link>
              <Link
                href="/completed"
                className={linkClass("/completed")}
                aria-current={pathname === "/completed" ? "page" : undefined}
              >
                {t("nav.completed")}
              </Link>
              <Link
                href="/archived"
                className={linkClass("/archived")}
                aria-current={pathname === "/archived" ? "page" : undefined}
              >
                {t("nav.archived")}
              </Link>
            </>
          )}
        </div>
        {authState.status === "authenticated" && (
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {authState.user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              aria-label={t("auth.logout.ariaLabel")}
            >
              {t("auth.logout.button")}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
