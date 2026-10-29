/**
 * Live odds from The Odds API, ported from OctoOdds. Fetching happens in
 * server functions (lib/odds-server.ts), so the paid key never reaches the
 * browser and every user shares one server-side cache.
 *
 * The API's fixtures are converted to the odds-feed `Game` shape, so the
 * Scanner/Edge math and components work unchanged on live or demo data.
 */
import { createServerFn } from "@tanstack/react-start";
import type { Game as FeedGame, Quote } from "./odds-feed";

/** One bookmaker's three-way prices for a fixture, as normalized from the API. */
export interface BookOdds {
  key: string;
  title: string;
  W: number;
  D: number;
  L: number;
  /** When the book last repriced the fixture, epoch ms — 0 when the feed didn't say. */
  updated: number;
}

/** A fixture normalized from the API. */
export interface Game {
  id: string;
  home: string;
  away: string;
  commence: string;
  books: BookOdds[];
}

export interface League {
  key: string;
  title: string;
}

export interface OddsResponse {
  games: Game[];
  /** Credits left this month, from the response headers. */
  remaining: string | null;
  used: string | null;
}

export interface OddsResult extends OddsResponse {
  /** True when the server answered from its cache, so no credits were spent. */
  cached: boolean;
  fetchedAt: number;
}

interface ApiOutcome {
  name: string;
  price: number;
}
interface ApiMarket {
  key: string;
  last_update?: string;
  outcomes?: ApiOutcome[];
}
interface ApiBookmaker {
  key: string;
  title: string;
  last_update?: string;
  markets?: ApiMarket[];
}
interface ApiEvent {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers?: ApiBookmaker[];
}

/**
 * API event -> Game: W/D/L are home win / draw / away win. Books missing a
 * three-way market (or any leg) are dropped, as are fixtures left with none.
 */
export function normalizeEvents(events: ApiEvent[] | null | undefined): Game[] {
  return (events || [])
    .map((ev) => {
      const books = (ev.bookmakers || [])
        .map((bk) => {
          const market = (bk.markets || []).find((m) => m.key === "h2h" || m.key === "h2h_3_way");
          if (!market) return null;
          const odds = { W: 0, D: 0, L: 0 };
          for (const out of market.outcomes || []) {
            if (out.name === ev.home_team) odds.W = out.price;
            else if (out.name === "Draw") odds.D = out.price;
            else if (out.name === ev.away_team) odds.L = out.price;
          }
          if (!(odds.W > 1 && odds.D > 1 && odds.L > 1)) return null;
          const stamp = Date.parse(market.last_update ?? bk.last_update ?? "");
          return {
            key: bk.key,
            title: bk.title,
            ...odds,
            updated: Number.isFinite(stamp) ? stamp : 0,
          };
        })
        .filter((b): b is BookOdds => b !== null);
      return {
        id: ev.id,
        home: ev.home_team,
        away: ev.away_team,
        commence: ev.commence_time,
        books,
      };
    })
    .filter((g) => g.books.length > 0);
}

// OctoOdds names 1xBet "1xbet"; The Odds API calls it "onexbet".
const TO_API: Record<string, string> = { "1xbet": "onexbet" };
const FROM_API: Record<string, string> = { onexbet: "1xbet" };
export const apiBookKey = (id: string) => TO_API[id] ?? id;
export const feedBookId = (key: string) => FROM_API[key] ?? key;

/**
 * API fixtures -> odds-feed Games. A quote with no timestamp is stamped with
 * the fetch time: a missing timestamp is not evidence of staleness.
 */
export function toFeedGames(
  games: Game[],
  league: League,
  fetchedAt: number,
): { games: FeedGame[]; bookTitles: Record<string, string> } {
  const bookTitles: Record<string, string> = {};
  const out = games.map((g): FeedGame => {
    const quotes: Record<string, Quote> = {};
    for (const b of g.books) {
      const id = feedBookId(b.key);
      bookTitles[id] = b.title;
      quotes[id] = { W: b.W, D: b.D, L: b.L, updatedAt: b.updated || fetchedAt };
    }
    return {
      id: g.id,
      leagueId: league.key,
      league: league.title,
      flag: "⚽",
      home: g.home,
      away: g.away,
      kickoff: Date.parse(g.commence),
      fetchedAt,
      quotes,
    };
  });
  return { games: out, bookTitles };
}

// ---------------------------------------------------------------- server fns
// Handlers are stripped from the client bundle; lib/odds-server.ts is imported
// dynamically so it never enters the client module graph.

const statusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { oddsKeyConfigured } = await import("./odds-server");
  return { configured: oddsKeyConfigured() };
});

export interface OddsRequest {
  accessToken: string;
  sportKey: string;
  regions: string;
  bookmakers?: string;
  from?: string;
  to?: string;
  /** Ignore the shared cache and pay for a live read. */
  refresh?: boolean;
}

const leaguesFn = createServerFn({ method: "POST" })
  .inputValidator((d: { accessToken: string }) => d)
  .handler(async ({ data }) => {
    const { loadLeagues, assertApprovedUser } = await import("./odds-server");
    await assertApprovedUser(data.accessToken);
    return loadLeagues("soccer");
  });

const oddsFn = createServerFn({ method: "POST" })
  .inputValidator((d: OddsRequest) => d)
  .handler(async ({ data }) => {
    const { loadLeagueOdds, assertApprovedUser } = await import("./odds-server");
    // The proxy holds a paid key, so only signed-in, paid accounts may spend it.
    await assertApprovedUser(data.accessToken);
    return loadLeagueOdds(
      data.sportKey,
      data.regions,
      data.bookmakers ?? "",
      data.from ?? "",
      data.to ?? "",
      data.refresh ?? false,
    );
  });

/** Whether the server holds an odds API key. */
export async function fetchOddsConfigured(): Promise<boolean> {
  return (await statusFn()).configured;
}

/** Football leagues currently in season (free endpoint, cached server-side). */
export function fetchLeagues(accessToken: string): Promise<League[]> {
  return leaguesFn({ data: { accessToken } });
}

/** 1X2 odds for one league, optionally restricted to a kickoff window (ISO, no ms). */
export function fetchLeagueOdds(req: OddsRequest): Promise<OddsResult> {
  return oddsFn({ data: req });
}

/** The API wants commence-time bounds as ISO without milliseconds. */
export const apiIso = (d: Date) => d.toISOString().replace(/\.\d+Z$/, "Z");
