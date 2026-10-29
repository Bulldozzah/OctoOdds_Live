import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/betting/Header";
import { AppShell } from "@/components/layout/AppShell";
import { CoverCalculator } from "@/components/calculator/CoverCalculator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Cover Calculator — Plan Stakes Across Every Outcome | OctoOdds" },
      {
        name: "description",
        content:
          "Spread a budget across every result of 1–4 events: balance profit, target a win, or use Turbo to back your own read.",
      },
      { property: "og:title", content: "Cover Calculator | OctoOdds" },
      {
        property: "og:description",
        content:
          "Plan cover bets across every outcome with tax-aware payouts, balancing tools and PDF export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  return (
    <AppShell>
      <Header />
      <ProtectedRoute>
        <CoverCalculator />
      </ProtectedRoute>
    </AppShell>
  );
}
