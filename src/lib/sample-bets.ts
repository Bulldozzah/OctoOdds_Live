/** Made-up saved bets so My Bets and Stats have something to show in the demo. */
import { balanceProfitStakes, buildScenarios, deriveScenarioOdds } from "./calculator";
import { emptyRow, type EventDraft, type SavedPlan } from "./calculator-plans";
import { DAY_MS, LOST } from "./bets";

type Ev = [home: string, away: string, W: number, D: number, L: number];

const SPECS: {
  daysAgo: number;
  events: Ev[];
  budget: number;
  tax: number;
  won: number | null | "lost";
  exclude?: number;
}[] = [
  { daysAgo: 72, events: [["Arsenal", "Chelsea", 2.2, 3.6, 4.0]], budget: 500, tax: 0, won: 0 },
  {
    daysAgo: 64,
    events: [
      ["Real Madrid", "Sevilla", 1.62, 4.4, 6.5],
      ["Napoli", "Roma", 2.1, 3.4, 4.1],
    ],
    budget: 1000,
    tax: 0,
    won: 4,
    exclude: 8,
  },
  {
    daysAgo: 51,
    events: [["Zesco United", "Power Dynamos", 2.3, 3.0, 3.2]],
    budget: 400,
    tax: 15,
    won: 2,
  },
  {
    daysAgo: 40,
    events: [
      ["Liverpool", "Man City", 2.6, 3.6, 2.6],
      ["Arsenal", "Tottenham", 1.8, 3.8, 4.4],
    ],
    budget: 150,
    tax: 0,
    won: "lost",
  },
  {
    daysAgo: 33,
    events: [["Bayern", "Dortmund", 1.7, 4.1, 4.6]],
    budget: 1200,
    tax: 0,
    won: 1,
    exclude: 2,
  },
  {
    daysAgo: 26,
    events: [
      ["Barcelona", "Atletico", 1.95, 3.5, 4.0],
      ["Inter", "Juventus", 2.2, 3.1, 3.5],
    ],
    budget: 800,
    tax: 10,
    won: 0,
    exclude: 8,
  },
  { daysAgo: 20, events: [["Nkana", "Red Arrows", 2.05, 3.0, 3.7]], budget: 300, tax: 15, won: 0 },
  {
    daysAgo: 14,
    events: [["Chelsea", "Newcastle", 1.9, 3.6, 4.1]],
    budget: 120,
    tax: 0,
    won: 2,
    exclude: 2,
  },
  {
    daysAgo: 9,
    events: [
      ["PSG", "Marseille", 1.58, 4.6, 7.0],
      ["Arsenal", "Brighton", 1.66, 4.2, 6.0],
    ],
    budget: 1200,
    tax: 0,
    won: 0,
    exclude: 8,
  },
  { daysAgo: 5, events: [["Man United", "Everton", 2.0, 3.7, 4.6]], budget: 450, tax: 0, won: 1 },
  {
    daysAgo: 2,
    events: [
      ["Liverpool", "Aston Villa", 1.7, 4.0, 4.8],
      ["Real Madrid", "Valencia", 1.45, 4.6, 7.0],
    ],
    budget: 1000,
    tax: 0,
    won: null,
    exclude: 8,
  },
  {
    daysAgo: 0,
    events: [["Zesco United", "Nkana", 2.2, 3.1, 3.3]],
    budget: 350,
    tax: 15,
    won: null,
  },
];

export function sampleBets(now: number): SavedPlan[] {
  const bets = SPECS.map((s, idx): SavedPlan => {
    const events: EventDraft[] = s.events.map(([home, away, W, D, L]) => ({
      name: home,
      matchup: `${home} vs ${away}`,
      W: W.toFixed(2),
      D: D.toFixed(2),
      L: L.toFixed(2),
    }));
    const n = events.length;
    const odds = deriveScenarioOdds(
      s.events.map(([, , W, D, L]) => ({ W, D, L })),
      buildScenarios(n),
    );
    const stakes = balanceProfitStakes(
      odds.map((o, i) => ({ stake: 0, odds: o, excluded: i === s.exclude })),
      s.budget,
      s.tax / 100,
    );
    const rows = odds.map((_, i) => ({
      ...emptyRow(),
      excluded: i === s.exclude,
      stake: stakes[i] ? stakes[i]!.toFixed(2) : "",
    }));
    const createdAt = now - s.daysAgo * DAY_MS - (idx % 3) * 3 * 60 * 60 * 1000;
    const wonScenario = s.won === null ? null : s.won === "lost" ? LOST : s.won;
    return {
      id: `sample-${idx + 1}`,
      createdAt,
      title: events.map((e) => e.name).join(" / "),
      eventCount: n,
      events,
      rows,
      odds,
      budget: String(s.budget),
      tax: String(s.tax),
      status: wonScenario === null ? "Pending" : "Settled",
      wonScenario,
      settledAt: wonScenario === null ? null : createdAt + DAY_MS / 2,
    };
  });

  // One deliberate break-even: two rows staked K100 each, the 2.00 row wins.
  const be = now - 45 * DAY_MS;
  bets.push({
    id: "sample-be",
    createdAt: be,
    title: "Atletico",
    eventCount: 1,
    events: [{ name: "Atletico", matchup: "Atletico vs Betis", W: "2.00", D: "3.40", L: "4.20" }],
    rows: [
      { stake: "100.00", odds: "2", excluded: false, unlikely: false },
      { stake: "100.00", odds: "3.4", excluded: false, unlikely: false },
      { stake: "", odds: "4.2", excluded: true, unlikely: false },
    ],
    odds: [2, 3.4, 4.2],
    budget: "200",
    tax: "0",
    status: "Settled",
    wonScenario: 0,
    settledAt: be + DAY_MS / 2,
  });

  return bets.sort((a, b) => b.createdAt - a.createdAt);
}
