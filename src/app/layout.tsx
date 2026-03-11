import type { Metadata } from "next";
import { TaskProvider } from "@/context/TaskContext";
import { Nav } from "@/components/Nav";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Todo App",
  description: "Manage your tasks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TaskProvider>
          <Nav />
          <main>{children}</main>
        </TaskProvider>
      </body>
    </html>
  );
}
