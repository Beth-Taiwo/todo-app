"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import styles from "./Nav.module.css";

export function Nav() {
  const pathname = usePathname();

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
    </nav>
  );
}
