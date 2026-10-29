import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { Header } from "@/components/betting/Header";
import { SportsSidebar } from "@/components/betting/SportsSidebar";
import { PromoBanner } from "@/components/betting/PromoBanner";
import { EventsBoard, sportName, type Trends } from "@/components/betting/EventsBoard";
import { BetSlip, type PlacedBet } from "@/components/betting/BetSlip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MATCHES, SPORTS, type Match, type SportId } from "@/lib/sample-data";
import { toggleSelection, type MarketKey, type Selection } from "@/lib/betslip";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/calculator" });
  },
  head: () => ({
    meta: [
      { title: "OctoOdds — Sports Betting, Live Odds & Casino" },
      {
        name: "description",
        content:
          "Bet on football, basketball, tennis and more with live odds, accumulators and a 100% welcome bonus.",
      },
      { property: "og:title", content: "OctoOdds — Sports Betting, Live Odds & Casino" },
      {
        property: "og:description",
        content:
          "Live and upcoming events with competitive odds, a fast bet slip and a 100% welcome bonus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ODD_KEYS: { market: MarketKey; field: "home" | "draw" | "away" | "over" | "under" }[] = [
  { market: "1", field: "home" },
  { market: "X", field: "draw" },
  { market: "2", field: "away" },
  { market: "O", field: "over" },
  { market: "U", field: "under" },
];

function Index() {
  const [section] = useState<"sports" | "live">("sports");
  const [sport, setSport] = useState<SportId | "all">("all");
  const [matches, setMatches] = useState<Match[]>(MATCHES);
  const [trends, setTrends] = useState<Trends>({});
  const [slip, setSlip] = useState<Selection[]>([]);
  const [placed, setPlaced] = useState<PlacedBet[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const tick = useRef(0);

  // Simulate a live feed: clocks advance and live odds drift.
  useEffect(() => {
    const t = setInterval(() => {
      tick.current += 1;
      const next: Trends = {};
      setMatches((prev) =>
        prev.map((m) => {
          if (!m.live) return m;
          const live =
            m.sportId === "football" && tick.current % 3 === 0
              ? { ...m.live, minute: Math.min(m.live.minute + 1, 90) }
              : m.live;
          if (Math.random() > 0.35) return { ...m, live };
          const k = ODD_KEYS[Math.floor(Math.random() * ODD_KEYS.length)]!;
          const cur = m.odds[k.field];
          if (cur === undefined) return { ...m, live };
          const delta = (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.08);
          const val = Math.max(1.01, Math.round((cur + delta) * 100) / 100);
          next[`${m.id}:${k.market}`] = val > cur ? "up" : "down";
          return { ...m, live, odds: { ...m.odds, [k.field]: val } };
        }),
      );
      setTrends(next);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(
    () => matches.filter((m) => sport === "all" || m.sportId === sport),
    [matches, sport],
  );
  const live = filtered.filter((m) => m.live);
  const upcoming = filtered.filter((m) => !m.live);

  const onPick = (sel: Selection) => setSlip((s) => toggleSelection(s, sel));
  const slipProps = {
    slip,
    onRemove: (id: string) => setSlip((s) => s.filter((x) => x.matchId !== id)),
    onClear: () => setSlip([]),
    placed,
    onPlace: (bets: PlacedBet[]) => {
      setPlaced((p) => [...bets, ...p]);
      setSlip([]);
    },
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto grid max-w-[1600px] gap-3 px-2 py-3 sm:px-3 lg:grid-cols-[230px_1fr] xl:grid-cols-[230px_1fr_320px]">
        <div className="hidden lg:block">
          <div className="sticky top-[8.5rem]">
            <SportsSidebar
              matches={matches}
              sport={sport}
              onSport={setSport}
              liveOnly={section === "live"}
            />
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          {section === "sports" && <PromoBanner />}

          {/* Mobile sport chips */}
          <div className="scrollbar-none -mx-2 flex gap-1.5 overflow-x-auto px-2 lg:hidden">
            {[{ id: "all" as const, name: "All", icon: "🏆" }, ...SPORTS].map((s) => (
              <button
                key={s.id}
                onClick={() => setSport(s.id)}
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
                  sport === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-secondary-foreground shadow-card"
                }`}
              >
                <span>{s.icon}</span>
                {s.name}
              </button>
            ))}
          </div>

          <EventsBoard
            title={`Live bets · ${sportName(sport)}`}
            live
            matches={live}
            slip={slip}
            trends={trends}
            onPick={onPick}
          />
          {section === "sports" && (
            <EventsBoard
              title={`Sports · ${sportName(sport)}`}
              live={false}
              matches={upcoming}
              slip={slip}
              trends={trends}
              onPick={onPick}
            />
          )}

          <footer className="rounded-md bg-header-deep px-4 py-5 text-xs text-header-muted">
            <p className="font-display text-base font-black italic text-header-foreground">
              BET<span className="text-cta">ZED</span>
            </p>
            <p className="mt-1">
              Demo interface with sample data. 18+ only. Please gamble responsibly.
            </p>
          </footer>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-[8.5rem]">
            <BetSlip {...slipProps} />
          </div>
        </div>
      </main>

      {/* Mobile / tablet bet slip */}
      <button
        onClick={() => setSheetOpen(true)}
        className="btn-cta fixed bottom-4 right-4 z-30 h-12 rounded-full px-5 text-sm xl:hidden"
      >
        <Ticket className="h-4 w-4" /> Bet slip
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-card px-1 text-[11px] text-foreground">
          {slip.length}
        </span>
      </button>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-background p-3 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Bet slip</SheetTitle>
          </SheetHeader>
          <div className="pt-8">
            <BetSlip {...slipProps} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
