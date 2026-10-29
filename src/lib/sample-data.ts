export type SportId =
  | "football"
  | "basketball"
  | "tennis"
  | "ice-hockey"
  | "cricket"
  | "table-tennis"
  | "volleyball"
  | "esports";

export interface Sport {
  id: SportId;
  name: string;
  icon: string;
}

export const SPORTS: Sport[] = [
  { id: "football", name: "Football", icon: "⚽" },
  { id: "basketball", name: "Basketball", icon: "🏀" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
  { id: "ice-hockey", name: "Ice Hockey", icon: "🏒" },
  { id: "cricket", name: "Cricket", icon: "🏏" },
  { id: "table-tennis", name: "Table Tennis", icon: "🏓" },
  { id: "volleyball", name: "Volleyball", icon: "🏐" },
  { id: "esports", name: "Esports", icon: "🎮" },
];

export interface Odds {
  home: number;
  draw?: number;
  away: number;
  totalLine: number;
  over: number;
  under: number;
}

export interface Match {
  id: string;
  sportId: SportId;
  country: string;
  flag: string;
  league: string;
  home: string;
  away: string;
  start: string;
  live?: { minute: number; period: string; score: [number, number] };
  odds: Odds;
  markets: number;
}

export const MATCHES: Match[] = [
  // Football — live
  {
    id: "m1",
    sportId: "football",
    country: "England",
    flag: "🏴",
    league: "Premier League",
    home: "Arsenal",
    away: "Chelsea",
    start: "Today 18:30",
    live: { minute: 63, period: "2nd half", score: [1, 1] },
    odds: { home: 2.45, draw: 2.9, away: 3.6, totalLine: 2.5, over: 1.72, under: 2.1 },
    markets: 612,
  },
  {
    id: "m2",
    sportId: "football",
    country: "Spain",
    flag: "🇪🇸",
    league: "La Liga",
    home: "Real Madrid",
    away: "Sevilla",
    start: "Today 19:00",
    live: { minute: 27, period: "1st half", score: [1, 0] },
    odds: { home: 1.38, draw: 4.8, away: 8.5, totalLine: 3.5, over: 2.05, under: 1.76 },
    markets: 548,
  },
  {
    id: "m3",
    sportId: "football",
    country: "Zambia",
    flag: "🇿🇲",
    league: "Super League",
    home: "ZESCO United",
    away: "Power Dynamos",
    start: "Today 15:00",
    live: { minute: 78, period: "2nd half", score: [0, 0] },
    odds: { home: 3.9, draw: 1.62, away: 5.4, totalLine: 0.5, over: 2.6, under: 1.48 },
    markets: 214,
  },
  {
    id: "m4",
    sportId: "football",
    country: "Italy",
    flag: "🇮🇹",
    league: "Serie A",
    home: "Inter",
    away: "Napoli",
    start: "Today 20:45",
    live: { minute: 12, period: "1st half", score: [0, 0] },
    odds: { home: 2.1, draw: 3.25, away: 3.7, totalLine: 2.5, over: 1.95, under: 1.85 },
    markets: 487,
  },
  // Football — upcoming
  {
    id: "m5",
    sportId: "football",
    country: "England",
    flag: "🏴",
    league: "Premier League",
    home: "Manchester City",
    away: "Liverpool",
    start: "Sat 14:30",
    odds: { home: 1.95, draw: 3.8, away: 3.75, totalLine: 2.5, over: 1.58, under: 2.4 },
    markets: 1204,
  },
  {
    id: "m6",
    sportId: "football",
    country: "England",
    flag: "🏴",
    league: "Premier League",
    home: "Tottenham",
    away: "Newcastle",
    start: "Sat 17:00",
    odds: { home: 2.3, draw: 3.55, away: 3.0, totalLine: 2.5, over: 1.66, under: 2.22 },
    markets: 1098,
  },
  {
    id: "m7",
    sportId: "football",
    country: "Germany",
    flag: "🇩🇪",
    league: "Bundesliga",
    home: "Bayern Munich",
    away: "Borussia Dortmund",
    start: "Sat 19:30",
    odds: { home: 1.6, draw: 4.4, away: 5.0, totalLine: 3.5, over: 1.9, under: 1.9 },
    markets: 1156,
  },
  {
    id: "m8",
    sportId: "football",
    country: "Europe",
    flag: "🇪🇺",
    league: "UEFA Champions League",
    home: "Barcelona",
    away: "PSG",
    start: "Tue 22:00",
    odds: { home: 2.05, draw: 3.7, away: 3.4, totalLine: 2.5, over: 1.55, under: 2.45 },
    markets: 1320,
  },
  {
    id: "m9",
    sportId: "football",
    country: "Zambia",
    flag: "🇿🇲",
    league: "Super League",
    home: "Nkana FC",
    away: "Red Arrows",
    start: "Sun 15:00",
    odds: { home: 2.2, draw: 2.95, away: 3.3, totalLine: 2.5, over: 2.35, under: 1.55 },
    markets: 188,
  },
  {
    id: "m10",
    sportId: "football",
    country: "Africa",
    flag: "🌍",
    league: "CAF Champions League",
    home: "Al Ahly",
    away: "Mamelodi Sundowns",
    start: "Sun 18:00",
    odds: { home: 2.0, draw: 3.1, away: 3.85, totalLine: 2.5, over: 2.2, under: 1.65 },
    markets: 302,
  },
  // Basketball
  {
    id: "b1",
    sportId: "basketball",
    country: "USA",
    flag: "🇺🇸",
    league: "NBA",
    home: "LA Lakers",
    away: "Boston Celtics",
    start: "Today 03:30",
    live: { minute: 3, period: "3rd quarter", score: [74, 81] },
    odds: { home: 2.6, away: 1.5, totalLine: 221.5, over: 1.87, under: 1.93 },
    markets: 286,
  },
  {
    id: "b2",
    sportId: "basketball",
    country: "USA",
    flag: "🇺🇸",
    league: "NBA",
    home: "Golden State Warriors",
    away: "Denver Nuggets",
    start: "Fri 04:00",
    odds: { home: 2.15, away: 1.72, totalLine: 228.5, over: 1.9, under: 1.9 },
    markets: 312,
  },
  {
    id: "b3",
    sportId: "basketball",
    country: "Europe",
    flag: "🇪🇺",
    league: "EuroLeague",
    home: "Real Madrid",
    away: "Olympiacos",
    start: "Fri 21:00",
    odds: { home: 1.55, away: 2.45, totalLine: 160.5, over: 1.88, under: 1.92 },
    markets: 198,
  },
  // Tennis
  {
    id: "t1",
    sportId: "tennis",
    country: "ATP",
    flag: "🎾",
    league: "ATP Vienna",
    home: "J. Sinner",
    away: "A. Rublev",
    start: "Today 13:00",
    live: { minute: 2, period: "2nd set", score: [1, 0] },
    odds: { home: 1.12, away: 6.2, totalLine: 21.5, over: 1.95, under: 1.8 },
    markets: 96,
  },
  {
    id: "t2",
    sportId: "tennis",
    country: "WTA",
    flag: "🎾",
    league: "WTA Finals",
    home: "A. Sabalenka",
    away: "C. Gauff",
    start: "Sat 16:00",
    odds: { home: 1.62, away: 2.3, totalLine: 21.5, over: 1.85, under: 1.9 },
    markets: 84,
  },
  // Ice hockey
  {
    id: "h1",
    sportId: "ice-hockey",
    country: "USA",
    flag: "🇺🇸",
    league: "NHL",
    home: "Toronto Maple Leafs",
    away: "Montreal Canadiens",
    start: "Today 02:00",
    live: { minute: 14, period: "2nd period", score: [2, 1] },
    odds: { home: 1.7, draw: 4.6, away: 4.1, totalLine: 5.5, over: 1.82, under: 1.98 },
    markets: 174,
  },
  {
    id: "h2",
    sportId: "ice-hockey",
    country: "Russia",
    flag: "🏒",
    league: "KHL",
    home: "CSKA Moscow",
    away: "SKA St. Petersburg",
    start: "Sat 12:30",
    odds: { home: 2.35, draw: 4.2, away: 2.6, totalLine: 4.5, over: 1.85, under: 1.95 },
    markets: 142,
  },
  // Cricket
  {
    id: "c1",
    sportId: "cricket",
    country: "International",
    flag: "🏏",
    league: "T20 International",
    home: "India",
    away: "South Africa",
    start: "Sun 10:00",
    odds: { home: 1.55, away: 2.45, totalLine: 172.5, over: 1.87, under: 1.87 },
    markets: 76,
  },
  {
    id: "c2",
    sportId: "cricket",
    country: "Australia",
    flag: "🇦🇺",
    league: "Big Bash League",
    home: "Sydney Sixers",
    away: "Perth Scorchers",
    start: "Mon 09:15",
    odds: { home: 1.9, away: 1.9, totalLine: 165.5, over: 1.9, under: 1.85 },
    markets: 58,
  },
  // Table tennis
  {
    id: "tt1",
    sportId: "table-tennis",
    country: "International",
    flag: "🏓",
    league: "Setka Cup",
    home: "Y. Petrenko",
    away: "O. Kovalenko",
    start: "Today 14:20",
    live: { minute: 1, period: "4th set", score: [2, 1] },
    odds: { home: 1.44, away: 2.65, totalLine: 18.5, over: 1.83, under: 1.9 },
    markets: 32,
  },
  // Volleyball
  {
    id: "v1",
    sportId: "volleyball",
    country: "Italy",
    flag: "🇮🇹",
    league: "SuperLega",
    home: "Perugia",
    away: "Trentino",
    start: "Sun 18:00",
    odds: { home: 1.5, away: 2.5, totalLine: 182.5, over: 1.86, under: 1.88 },
    markets: 44,
  },
  // Esports
  {
    id: "e1",
    sportId: "esports",
    country: "CS2",
    flag: "🎮",
    league: "CS2 — ESL Pro League",
    home: "Natus Vincere",
    away: "FaZe Clan",
    start: "Today 17:00",
    live: { minute: 1, period: "Map 2", score: [1, 0] },
    odds: { home: 1.42, away: 2.75, totalLine: 2.5, over: 2.1, under: 1.7 },
    markets: 64,
  },
  {
    id: "e2",
    sportId: "esports",
    country: "Dota 2",
    flag: "🎮",
    league: "Dota 2 — The International",
    home: "Team Spirit",
    away: "Gaimin Gladiators",
    start: "Sat 13:00",
    odds: { home: 1.85, away: 1.95, totalLine: 2.5, over: 1.75, under: 2.05 },
    markets: 52,
  },
];

export const TOP_LEAGUES = [
  { flag: "🇪🇺", name: "UEFA Champions League" },
  { flag: "🏴", name: "Premier League" },
  { flag: "🇪🇸", name: "La Liga" },
  { flag: "🇮🇹", name: "Serie A" },
  { flag: "🇩🇪", name: "Bundesliga" },
  { flag: "🇿🇲", name: "Super League" },
  { flag: "🇺🇸", name: "NBA" },
];

export const CURRENCY = "K";
