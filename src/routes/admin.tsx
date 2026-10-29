import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header } from "@/components/betting/Header";
import { AppShell } from "@/components/layout/AppShell";
import { Admin } from "@/components/admin/Admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Members — OctoOdds" },
      {
        name: "description",
        content: "Manage subscriptions and roles, and the site-wide paywall.",
      },
      { property: "og:title", content: "Members — OctoOdds" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AppShell>
      <Header />
      <ProtectedRoute requireAdmin>
        <Admin />
      </ProtectedRoute>
    </AppShell>
  );
}
