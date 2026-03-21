"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { t } from "@/lib/i18n";
import styles from "./Nav.module.css";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { authState, logout } = useAuthContext();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <Link
        href="/"
        className={pathname === "/" ? styles.active : undefined}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        {t("nav.open")}
      </Link>
      <Link
        href="/completed"
        className={pathname === "/completed" ? styles.active : undefined}
        aria-current={pathname === "/completed" ? "page" : undefined}
      >
        {t("nav.completed")}
      </Link>
      <Link
        href="/archived"
        className={pathname === "/archived" ? styles.active : undefined}
        aria-current={pathname === "/archived" ? "page" : undefined}
      >
        {t("nav.archived")}
      </Link>
      {authState.status === "authenticated" && (
        <button
          onClick={handleLogout}
          aria-label={t("auth.logout.ariaLabel")}
          className={styles.logoutButton}
        >
          {t("auth.logout.button")}
        </button>
      )}
    </nav>
  );
}
