import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header } from "@/components/betting/Header";
import { AppShell } from "@/components/layout/AppShell";
import { MyBets } from "@/components/bets/MyBets";

export const Route = createFileRoute("/my-bets")({
  head: () => ({
    meta: [
      { title: "My Bets — Settle and Track Saved Cover Plans | OctoOdds" },
      {
        name: "description",
        content:
          "Every bet saved from the Calculator: filter by Pending, Won, Lost or Break-even, mark the winning scenario and see the net result.",
      },
      { property: "og:title", content: "My Bets | OctoOdds" },
      {
        property: "og:description",
        content:
          "Settle saved cover bets with corrected stakes and odds, and see returns and net profit per bet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyBetsPage,
});

function MyBetsPage() {
  return (
    <AppShell>
      <Header />
      <ProtectedRoute>
        <MyBets />
      </ProtectedRoute>
    </AppShell>
  );
}
