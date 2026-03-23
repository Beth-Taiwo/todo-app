import { t } from "@/lib/i18n";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import styles from "./page.module.css";

export const metadata = {
  title: "Open Tasks",
};

export default function OpenPage() {
  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>{t("pages.open")}</h2>
      <TaskForm />
      <div className="mt-6">
        <TaskList filter="open" />
      </div>
    </div>
  );
}
