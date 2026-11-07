import { createFileRoute } from "@tanstack/react-router";
import { CookiesContent } from "@/components/legal/CookiesContent";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie & Browser Storage Policy | OctoOdds" },
      {
        name: "description",
        content:
          "OctoOdds only uses browser storage for login and settings. No advertising or tracking cookies, no banking details.",
      },
      { property: "og:title", content: "Cookie & Browser Storage Policy | OctoOdds" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CookiesContent,
});
