import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/betting/Header";
import { AppShell } from "@/components/layout/AppShell";
import { Edge } from "@/components/edge/Edge";

export const Route = createFileRoute("/edge")({
  head: () => ({
    meta: [
      { title: "Edge — What Your Combos Are Actually Worth | OctoOdds" },
      {
        name: "description",
        content:
          "A second opinion on the Scanner's odds: rank combos by expected value, compare structures, see bookmaker margins and check results against the math.",
      },
      { property: "og:title", content: "Edge | OctoOdds" },
      {
        property: "og:description",
        content:
          "Value ranking, structure ladder, market margins and expected vs actual returns — from the same cached odds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EdgePage,
});

function EdgePage() {
  return (
    <AppShell>
      <Header />
      <Edge />
    </AppShell>
  );
}
