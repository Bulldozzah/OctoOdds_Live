/**
 * Simulated odds feed (stands in for a live Odds API — demo only).
 * Fixtures and prices are generated deterministically from league + date,
 * with prices nudged every 10 minutes so a forced rescan can show movement.
 */

export type BookId = "1xbet" | "betway" | "bet365" | "pinnacle" | "williamhill";
export type Region = "eu" | "uk" | "both";

export interface Bookmaker {
  id: BookId;
  name: string;
  regions: ("eu" | "uk")[];
  margin: number;
}

export const BOOKMAKERS: Bookmaker[] = [
  { id: "1xbet", name: "1xBet", regions: ["eu"], margin: 0.045 },
  { id: "betway", name: "Betway", regions: ["uk", "eu"], margin: 0.06 },
  { id: "bet365", name: "Bet365", regions: ["uk"], margin: 0.052 },
  { id: "pinnacle", name: "Pinnacle", regions: ["eu"], margin: 0.028 },
  { id: "williamhill", name: "William Hill", regions: ["uk"], margin: 0.068 },
];

// Titles of bookmakers seen in live scans (the live feed carries 20+ books).
const liveTitles = new Map<string, string>();
export function registerBookTitles(titles: Record<string, string> | undefined) {
  for (const [id, title] of Object.entries(titles ?? {})) liveTitles.set(id, title);
}

export const bookName = (id: string | null | undefined) =>
  id ? (BOOKMAKERS.find((b) => b.id === id)?.name ?? liveTitles.get(id) ?? id) : "Best odds";

/** Every bookmaker quoting at least one of the games. */
export const booksInGames = (games: { quotes: Record<string, unknown> }[]) =>
  [...new Set(games.flatMap((g) => Object.keys(g.quotes)))].sort();

/** Books a scan covers: the picked books, or every book in the region. */
export function booksFor(region: Region, picked: BookId[]): BookId[] {
  if (picked.length) return picked;
  return BOOKMAKERS.filter((b) => region === "both" || b.regions.includes(region)).map((b) => b.id);
}

/** Credits per league request: 1 per region, or 1 when specific books are named. */
export const creditsPerLeague = (region: Region, picked: string[]) =>
  picked.length ? Math.ceil(picked.length / 10) : region === "both" ? 2 : 1;

export interface Quote {
  W: number;
  D: number;
  L: number;
  updatedAt: number;
}

export interface Game {
  id: string;
  leagueId: string;
  league: string;
  flag: string;
  home: string;
  away: string;
  kickoff: number;
  fetchedAt: number;
  /** Keyed by bookmaker id — the demo's BookIds, or any key the live feed returns. */
  quotes: Partial<Record<string, Quote>>;
}

export interface League {
  id: string;
  name: string;
  country: string;
  flag: string;
  teams: string[];
  days: number[]; // weekdays with fixtures (0 = Sunday)
  slots: string[];
  books?: BookId[];
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const LEAGUES: League[] = [
  {
    id: "epl",
    name: "Premier League",
    country: "England",
    flag: "🏴",
    teams: [
      "Arsenal",
      "Manchester City",
      "Liverpool",
      "Chelsea",
      "Tottenham",
      "Newcastle",
      "Aston Villa",
      "Manchester United",
      "Brighton",
      "West Ham",
    ],
    days: ALL_DAYS,
    slots: ["13:30", "16:00", "18:30"],
  },
  {
    id: "laliga",
    name: "La Liga",
    country: "Spain",
    flag: "🇪🇸",
    teams: [
      "Real Madrid",
      "Barcelona",
      "Atlético Madrid",
      "Athletic Club",
      "Real Sociedad",
      "Villarreal",
      "Real Betis",
      "Sevilla",
    ],
    days: ALL_DAYS,
    slots: ["14:00", "16:15", "18:30", "21:00"],
  },
  {
    id: "seriea",
    name: "Serie A",
    country: "Italy",
    flag: "🇮🇹",
    teams: ["Inter", "Napoli", "Juventus", "Milan", "Atalanta", "Roma", "Lazio", "Fiorentina"],
    days: ALL_DAYS,
    slots: ["15:00", "18:00", "20:45"],
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    flag: "🇩🇪",
    teams: [
      "Bayern Munich",
      "Bayer Leverkusen",
      "Borussia Dortmund",
      "RB Leipzig",
      "Stuttgart",
      "Eintracht Frankfurt",
      "Freiburg",
      "Wolfsburg",
    ],
    days: ALL_DAYS,
    slots: ["15:30", "18:30"],
  },
  {
    id: "ligue1",
    name: "Ligue 1",
    country: "France",
    flag: "🇫🇷",
    teams: ["PSG", "Monaco", "Marseille", "Lille", "Lyon", "Nice", "Lens", "Rennes"],
    days: ALL_DAYS,
    slots: ["17:00", "19:00", "21:05"],
  },
  {
    id: "eredivisie",
    name: "Eredivisie",
    country: "Netherlands",
    flag: "🇳🇱",
    teams: ["PSV", "Feyenoord", "Ajax", "AZ Alkmaar", "Twente", "Utrecht"],
    days: ALL_DAYS,
    slots: ["14:30", "16:45", "20:00"],
  },
  {
    id: "primeira",
    name: "Primeira Liga",
    country: "Portugal",
    flag: "🇵🇹",
    teams: ["Benfica", "Sporting CP", "Porto", "Braga", "Vitória SC", "Famalicão"],
    days: ALL_DAYS,
    slots: ["16:30", "19:00", "21:30"],
  },
  {
    id: "zambia",
    name: "Super League",
    country: "Zambia",
    flag: "🇿🇲",
    teams: [
      "ZESCO United",
      "Power Dynamos",
      "Red Arrows",
      "Nkana FC",
      "Zanaco",
      "Green Buffaloes",
      "Napsa Stars",
      "Forest Rangers",
    ],
    days: ALL_DAYS,
    slots: ["13:00", "15:00"],
    books: ["1xbet", "betway"],
  },
  {
    id: "ucl",
    name: "UEFA Champions League",
    country: "Europe",
    flag: "🇪🇺",
    teams: [
      "Real Madrid",
      "Manchester City",
      "Bayern Munich",
      "PSG",
      "Barcelona",
      "Inter",
      "Arsenal",
      "Benfica",
    ],
    days: [2, 3],
    slots: ["18:45", "21:00"],
  },
  {
    id: "caf",
    name: "CAF Champions League",
    country: "Africa",
    flag: "🌍",
    teams: ["Al Ahly", "Mamelodi Sundowns", "Espérance", "Wydad AC", "TP Mazembe", "Simba SC"],
    days: [5, 6, 0],
    slots: ["16:00", "19:00"],
    books: ["1xbet", "betway", "bet365"],
  },
];

export const leagueById = (id: string) => LEAGUES.find((l) => l.id === id);

export const DAYS_AHEAD = 7;
const PRICE_BUCKET_MS = 10 * 60 * 1000;

// ---------- deterministic randomness ----------

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function fixturesPerDay(league: League, day: number, r: () => number) {
  if (!league.days.includes(day)) return 0;
  const max = Math.floor(league.teams.length / 2);
  let n: number;
  if (league.id === "ucl") n = 2 + Math.floor(r() * 3);
  else if (league.id === "caf") n = 1 + Math.floor(r() * 2);
  else if (day === 0 || day === 6) n = 2 + Math.floor(r() * 3);
  else if (day === 1 || day === 5) n = Math.floor(r() * 2);
  else n = r() < 0.25 ? 1 : 0;
  return Math.min(n, max);
}

/** All fixtures for one league over the next week, priced as of `fetchedAt`. */
export function generateLeagueFixtures(
  leagueId: string,
  fetchedAt: number,
  seedPrefix = "live",
  priceSalt = "",
): Game[] {
  const league = leagueById(leagueId);
  if (!league) return [];
  const bucket = Math.floor(fetchedAt / PRICE_BUCKET_MS);
  const start = new Date(fetchedAt);
  start.setHours(0, 0, 0, 0);
  const books = BOOKMAKERS.filter((b) => !league.books || league.books.includes(b.id));
  const games: Game[] = [];

  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const key = dateKey(day);
    const r = rng(`${seedPrefix}:${leagueId}:${key}`);
    const n = fixturesPerDay(league, day.getDay(), r);
    const order = league.teams.map((t, i) => ({ t, i, k: r() })).sort((a, b) => a.k - b.k);

    for (let g = 0; g < n; g++) {
      const home = order[g * 2]!;
      const away = order[g * 2 + 1]!;
      const slot = league.slots[Math.floor(r() * league.slots.length)]!;
      const [hh, mm] = slot.split(":").map(Number);
      const kickoff = new Date(day);
      kickoff.setHours(hh!, mm!, 0, 0);

      // "True" chances from relative strength (lower index = stronger) plus home advantage.
      const size = league.teams.length;
      const edge = (away.i - home.i) / size + 0.08 + (r() - 0.5) * 0.15;
      const pD = 0.22 + r() * 0.08;
      const share = Math.min(0.88, Math.max(0.12, 0.5 + edge * 0.75));
      const pW = (1 - pD) * share;
      const pL = 1 - pD - pW;

      const pr = rng(`${seedPrefix}:${leagueId}:${key}:${g}:${bucket}${priceSalt}`);
      const quotes: Game["quotes"] = {};
      for (const b of books) {
        if (pr() > 0.93) continue; // book doesn't carry this fixture
        const m = b.margin * (0.75 + pr() * 0.5);
        const price = (p: number) =>
          round2(Math.max(1.01, (1 / (p * (1 + m))) * (1 + (pr() - 0.5) * 0.05)));
        const stale = pr() < 0.05;
        quotes[b.id] = {
          W: price(pW),
          D: price(pD),
          L: price(pL),
          updatedAt: stale ? fetchedAt - (15 + pr() * 45) * 60000 : fetchedAt - pr() * 180000,
        };
      }
      // Occasional soft line at one book — the source of genuine arbitrage.
      const ids = Object.keys(quotes) as BookId[];
      if (ids.length && pr() < 0.16) {
        const q = quotes[ids[Math.floor(pr() * ids.length)]!]!;
        const o = (["W", "D", "L"] as const)[Math.floor(pr() * 3)]!;
        q[o] = round2(q[o] * (1.08 + pr() * 0.08));
      }

      games.push({
        id: `${leagueId}-${key}-${g}`,
        leagueId,
        league: league.name,
        flag: league.flag,
        home: home.t,
        away: away.t,
        kickoff: kickoff.getTime(),
        fetchedAt,
        quotes,
      });
    }
  }
  return games.sort((a, b) => a.kickoff - b.kickoff);
}

/** Leagues with at least one fixture on the given day. */
export function leaguesPlayingOn(key: string) {
  const day = parseDateKey(key).getDay();
  return LEAGUES.filter((l) => l.days.includes(day));
}

// ---------- settled-bet history (sample) for Edge → Expected vs actual ----------

export interface SettledBet {
  id: string;
  date: string;
  title: string;
  legs: number;
  stake: number;
  /** Return per unit staked when a covered scenario lands. */
  payout: number;
  /** Fair chance a covered scenario lands, at the odds taken. */
  coverProb: number;
  won: boolean;
}

export const DEMO_SETTLED_BETS: SettledBet[] = [
  {
    id: "s1",
    date: "2026-09-05",
    title: "Arsenal / Inter",
    legs: 2,
    stake: 1000,
    payout: 1.042,
    coverProb: 0.905,
    won: true,
  },
  {
    id: "s2",
    date: "2026-09-06",
    title: "PSV / Benfica",
    legs: 2,
    stake: 800,
    payout: 1.061,
    coverProb: 0.872,
    won: true,
  },
  {
    id: "s3",
    date: "2026-09-12",
    title: "Bayern / Napoli / Lille",
    legs: 3,
    stake: 1200,
    payout: 1.083,
    coverProb: 0.861,
    won: false,
  },
  {
    id: "s4",
    date: "2026-09-13",
    title: "Real Madrid / Ajax",
    legs: 2,
    stake: 1000,
    payout: 1.038,
    coverProb: 0.917,
    won: true,
  },
  {
    id: "s5",
    date: "2026-09-19",
    title: "ZESCO / Power Dynamos",
    legs: 2,
    stake: 500,
    payout: 1.074,
    coverProb: 0.858,
    won: true,
  },
  {
    id: "s6",
    date: "2026-09-20",
    title: "Liverpool / Milan",
    legs: 2,
    stake: 1000,
    payout: 1.029,
    coverProb: 0.934,
    won: true,
  },
  {
    id: "s7",
    date: "2026-09-26",
    title: "Barcelona / Porto / Lens",
    legs: 3,
    stake: 1500,
    payout: 1.091,
    coverProb: 0.848,
    won: true,
  },
  {
    id: "s8",
    date: "2026-09-27",
    title: "Chelsea / Dortmund",
    legs: 2,
    stake: 1000,
    payout: 1.047,
    coverProb: 0.898,
    won: false,
  },
  {
    id: "s9",
    date: "2026-10-03",
    title: "Juventus / Feyenoord",
    legs: 2,
    stake: 900,
    payout: 1.052,
    coverProb: 0.889,
    won: true,
  },
  {
    id: "s10",
    date: "2026-10-04",
    title: "Man City / Sporting / Monaco / Roma",
    legs: 4,
    stake: 2000,
    payout: 1.12,
    coverProb: 0.812,
    won: true,
  },
  {
    id: "s11",
    date: "2026-10-10",
    title: "Atlético / Leverkusen",
    legs: 2,
    stake: 1000,
    payout: 1.035,
    coverProb: 0.921,
    won: true,
  },
  {
    id: "s12",
    date: "2026-10-11",
    title: "Al Ahly / Sundowns",
    legs: 2,
    stake: 600,
    payout: 1.068,
    coverProb: 0.866,
    won: true,
  },
  {
    id: "s13",
    date: "2026-10-17",
    title: "Tottenham / Lazio / Twente",
    legs: 3,
    stake: 1200,
    payout: 1.077,
    coverProb: 0.853,
    won: true,
  },
  {
    id: "s14",
    date: "2026-10-18",
    title: "Newcastle / Marseille",
    legs: 2,
    stake: 1000,
    payout: 1.044,
    coverProb: 0.902,
    won: true,
  },
];
