import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header } from "@/components/betting/Header";
import { AppShell } from "@/components/layout/AppShell";
import { Stats } from "@/components/bets/Stats";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats — ROI, Win Rate and Equity Curve for Your Bets | OctoOdds" },
      {
        name: "description",
        content:
          "A performance dashboard for your saved bets: staked, returns, net profit, ROI, win rate, daily charts, per-team results and CSV export.",
      },
      { property: "og:title", content: "Stats | OctoOdds" },
      {
        property: "og:description",
        content:
          "Track net profit, ROI and win rate over 7, 30 or 90 days, with an equity curve and per-team table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  return (
    <AppShell>
      <Header />
      <ProtectedRoute>
        <Stats />
      </ProtectedRoute>
    </AppShell>
  );
}
