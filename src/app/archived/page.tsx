import { t } from "@/lib/i18n";
import TaskList from "@/components/TaskList";
import styles from "../page.module.css";

export const metadata = {
  title: "Archived Tasks",
};

export default function ArchivedPage() {
  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>{t("pages.archived")}</h2>
      <div className="mt-6">
        <TaskList filter="archived" />
      </div>
    </div>
  );
}
