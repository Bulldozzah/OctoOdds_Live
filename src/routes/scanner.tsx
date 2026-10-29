import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/betting/Header";
import { AppShell } from "@/components/layout/AppShell";
import { Scanner } from "@/components/scanner/Scanner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Odds Scanner — Find Guaranteed and Near-Guaranteed Combos | OctoOdds" },
      {
        name: "description",
        content:
          "Scan upcoming games by league or date and find 2–4 game combos whose odds can be dutched for a profit, with single-game arbs.",
      },
      { property: "og:title", content: "Odds Scanner | OctoOdds" },
      {
        property: "og:description",
        content:
          "Find full covers and safest near-covers across bookmakers, then load them straight into the Calculator.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScannerPage,
});

function ScannerPage() {
  return (
    <AppShell>
      <Header />
      <ProtectedRoute>
        <Scanner />
      </ProtectedRoute>
    </AppShell>
  );
}
