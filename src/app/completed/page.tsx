import { t } from "@/lib/i18n";
import TaskList from "@/components/TaskList";
import styles from "../page.module.css";

export const metadata = {
  title: "Completed Tasks",
};

export default function CompletedPage() {
  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>{t("pages.completed")}</h2>
      <TaskList filter="completed" />
    </div>
  );
}
