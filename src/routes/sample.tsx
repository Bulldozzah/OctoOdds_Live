import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/betting/Header";
import { SampleShowcase } from "@/components/sample/SampleShowcase";

export const Route = createFileRoute("/sample")({
  head: () => ({
    meta: [
      { title: "Sample Tour — Read-only Demo | OctoOdds" },
      {
        name: "description",
        content:
          "See the OctoOdds cover calculator, odds scanner and bet stats with made-up sample data. No account needed.",
      },
      { property: "og:title", content: "Sample Tour | OctoOdds" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SamplePage,
});

/** Public on purpose: visitors and unpaid accounts can explore with sample data. */
function SamplePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <SampleShowcase />
    </div>
  );
}
