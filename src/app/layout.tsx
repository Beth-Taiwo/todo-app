import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { TaskProvider } from "@/context/TaskContext";
import { Nav } from "@/components/Nav";
import { ProtectedShell } from "@/components/ProtectedShell";
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
        <AuthProvider>
          <TaskProvider>
            <Nav />
            <main className="mx-auto max-w-2xl px-4 py-8">
              <ProtectedShell>{children}</ProtectedShell>
            </main>
          </TaskProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
