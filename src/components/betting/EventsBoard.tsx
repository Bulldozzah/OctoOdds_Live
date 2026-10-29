import { ChevronRight, Radio, Star } from "lucide-react";
import { SPORTS, type Match, type SportId } from "@/lib/sample-data";
import type { MarketKey, Selection } from "@/lib/betslip";

export type Trends = Record<string, "up" | "down" | undefined>;

export function EventsBoard({
  title,
  live,
  matches,
  slip,
  trends,
  onPick,
}: {
  title: string;
  live: boolean;
  matches: Match[];
  slip: Selection[];
  trends: Trends;
  onPick: (sel: Selection) => void;
}) {
  // Group by sport, then league
  const bySport = SPORTS.map((s) => ({
    sport: s,
    leagues: groupByLeague(matches.filter((m) => m.sportId === s.id)),
  })).filter((g) => g.leagues.length > 0);

  return (
    <section className="overflow-hidden rounded-md bg-card shadow-card">
      <div className="flex items-center gap-2 bg-gradient-header px-3 py-2.5 text-header-foreground">
        {live ? (
          <span className="flex items-center gap-1.5 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase text-live-foreground">
            <span className="animate-live h-1.5 w-1.5 rounded-full bg-live-foreground" /> Live
          </span>
        ) : (
          <Star className="h-4 w-4 text-gold" />
        )}
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">{title}</h2>
        <span className="ml-auto text-xs text-header-muted">{matches.length} events</span>
      </div>

      {bySport.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No events right now for this sport.
        </p>
      )}

      {bySport.map(({ sport, leagues }) =>
        leagues.map(([league, items]) => (
          <div key={sport.id + league}>
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-b bg-panel-head px-3 py-1.5 text-[11px] font-bold uppercase text-secondary-foreground">
              <span className="flex items-center gap-1.5 truncate">
                <span>{sport.icon}</span>
                {items[0]?.flag} {items[0]?.country}. {league}
              </span>
              <OddsHeader hasDraw={items.some((m) => m.odds.draw !== undefined)} />
            </div>
            {items.map((m) => (
              <MatchRow key={m.id} match={m} slip={slip} trends={trends} onPick={onPick} />
            ))}
          </div>
        )),
      )}
    </section>
  );
}

function groupByLeague(ms: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>();
  for (const m of ms) {
    const arr = map.get(m.league) ?? [];
    arr.push(m);
    map.set(m.league, arr);
  }
  return [...map.entries()];
}

function OddsHeader({ hasDraw }: { hasDraw: boolean }) {
  return (
    <div className="hidden grid-cols-[repeat(6,3.5rem)] gap-1 text-center sm:grid">
      <span>1</span>
      <span>{hasDraw ? "X" : ""}</span>
      <span>2</span>
      <span>O</span>
      <span>Total</span>
      <span>U</span>
    </div>
  );
}

function MatchRow({
  match: m,
  slip,
  trends,
  onPick,
}: {
  match: Match;
  slip: Selection[];
  trends: Trends;
  onPick: (sel: Selection) => void;
}) {
  const name = `${m.home} – ${m.away}`;
  const picked = slip.find((s) => s.matchId === m.id)?.market;

  const cell = (market: MarketKey, odd: number | undefined, label: string) =>
    odd === undefined ? (
      <span className="odd-btn pointer-events-none opacity-40">–</span>
    ) : (
      <button
        className="odd-btn"
        data-selected={picked === market}
        data-trend={trends[`${m.id}:${market}`]}
        onClick={() => onPick({ matchId: m.id, market, odd, label, matchName: name })}
        aria-label={`${name} ${label} at ${odd.toFixed(2)}`}
      >
        {odd.toFixed(2)}
      </button>
    );

  return (
    <div className="grid grid-cols-1 gap-2 border-b px-3 py-2 last:border-b-0 hover:bg-muted/60 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-16 shrink-0 text-[11px] leading-tight text-muted-foreground">
          {m.live ? (
            <>
              <span className="flex items-center gap-1 font-bold text-live">
                <Radio className="h-3 w-3" />
                {m.sportId === "football" ? `${m.live.minute}'` : "Live"}
              </span>
              <span>{m.live.period}</span>
            </>
          ) : (
            <>
              <span className="block font-semibold text-foreground">{m.start.split(" ")[1]}</span>
              <span>{m.start.split(" ")[0]}</span>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1 text-[13px]">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{m.home}</span>
            {m.live && <span className="font-bold tabular-nums text-live">{m.live.score[0]}</span>}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{m.away}</span>
            {m.live && <span className="font-bold tabular-nums text-live">{m.live.score[1]}</span>}
          </div>
        </div>
        <span className="hidden shrink-0 items-center text-[11px] font-semibold text-primary md:flex">
          +{m.markets}
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1 sm:grid-cols-[repeat(6,3.5rem)]">
        {cell("1", m.odds.home, "W1")}
        {cell("X", m.odds.draw, "Draw")}
        {cell("2", m.odds.away, "W2")}
        {cell("O", m.odds.over, `Over ${m.odds.totalLine}`)}
        <span className="flex h-9 items-center justify-center rounded-sm text-[12px] font-semibold text-muted-foreground tabular-nums">
          {m.odds.totalLine}
        </span>
        {cell("U", m.odds.under, `Under ${m.odds.totalLine}`)}
      </div>
    </div>
  );
}

export function sportName(id: SportId | "all") {
  return id === "all" ? "All sports" : (SPORTS.find((s) => s.id === id)?.name ?? "");
}
