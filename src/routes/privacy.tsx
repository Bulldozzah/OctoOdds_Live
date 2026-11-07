import { createFileRoute } from "@tanstack/react-router";
import { PrivacyContent } from "@/components/legal/PrivacyContent";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy & Data Protection Notice | OctoOdds" },
      {
        name: "description",
        content:
          "What personal data OctoOdds collects, why, who it is shared with, and your data protection rights.",
      },
      { property: "og:title", content: "Privacy Policy & Data Protection Notice | OctoOdds" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyContent,
});
