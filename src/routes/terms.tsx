import { createFileRoute } from "@tanstack/react-router";
import { TermsContent } from "@/components/legal/TermsContent";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | OctoOdds" },
      {
        name: "description",
        content:
          "The terms for using OctoOdds: a one-month analytics subscription, payments, acceptable use and liability.",
      },
      { property: "og:title", content: "Terms & Conditions | OctoOdds" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TermsContent,
});
