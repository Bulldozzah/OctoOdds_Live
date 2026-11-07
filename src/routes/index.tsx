import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, History, ScanSearch } from "lucide-react";
import { HeroFinancial } from "@/components/ui/hero-financial";
import { SampleCalculator } from "@/components/sample/SampleCalculator";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OctoOdds — Odds Analytics & Cover Calculator" },
      {
        name: "description",
        content:
          "Scan bookmaker odds, find dutching and arbitrage combos, and plan stakes across every outcome. Analytics only — no bets are placed on OctoOdds.",
      },
      { property: "og:title", content: "OctoOdds — Odds Analytics & Cover Calculator" },
      {
        property: "og:description",
        content:
          "Odds scanner, cover calculator and bet tracker for planning stakes across every result.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Odds scanner",
    text: "Reads live prices across bookmakers and ranks game combos that can be dutched for a guaranteed or near-guaranteed return.",
  },
  {
    icon: Calculator,
    title: "Cover calculator",
    text: "Spread one stake across every result of 1–4 events: balance profit, target a win, or give up the least likely scenario.",
  },
  {
    icon: History,
    title: "Bets & stats",
    text: "Save plans, settle them when results land, and track staked, net, ROI and win rate over time.",
  },
];

function HomePage() {
  const { user } = useAuth();
  const app = user
    ? ({ label: "Open app", to: "/calculator" } as const)
    : ({ label: "Log in", to: "/login" } as const);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1e293b]">
      <HeroFinancial appLabel={app.label} appTo={app.to} preview={<SampleCalculator compact />} />

      <section id="features" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-16">
        <h2 className="text-center text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
          Everything you need to plan a cover
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-blue-500 to-blue-300 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-lg font-semibold text-neutral-900">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/sample"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
          >
            Try the read-only sample
          </Link>
          <Link
            to={app.to}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-black"
          >
            {app.label}
          </Link>
        </div>
      </section>

      <footer className="space-y-3 border-t border-neutral-200 px-4 py-6 text-center text-xs text-neutral-500">
        <LegalLinks className="font-semibold text-neutral-600" />
        <p>
          OctoOdds is an analytics tool. No bets are placed, held or paid out on OctoOdds — you
          place bets yourself at licensed bookmakers. 18+ only. Please gamble responsibly.
        </p>
      </footer>
    </div>
  );
}
