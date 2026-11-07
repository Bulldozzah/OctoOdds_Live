import { createFileRoute } from "@tanstack/react-router";
import { RefundsContent } from "@/components/legal/RefundsContent";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refunds, Returns, Chargebacks & Cancellation | OctoOdds" },
      {
        name: "description",
        content:
          "OctoOdds sells a single one-month plan. All payments are final: no refunds, no returns and no cancellation.",
      },
      { property: "og:title", content: "Refunds, Returns, Chargebacks & Cancellation | OctoOdds" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RefundsContent,
});
