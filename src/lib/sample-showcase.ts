/**
 * Read-only figures for the public /sample page and the home-page preview.
 * Everything here is composed from the same tested math the real pages use
 * (calculator.ts, scanner.ts), fed with made-up data, so the sample can never
 * drift from what a paying user would see.
 */
import {
  applyCoverPlan,
  bestCoverPlan,
  buildScenarios,
  computeRows,
  coverPlans,
  deriveScenarioOdds,
  type Outcome,
} from "./calculator";
import { combinations, freshGames, scanCombos, sortResults, type ComboResult } from "./scanner";
import { BOOKMAKERS, generateLeagueFixtures, type Game } from "./odds-feed";
import { MATCHES, type Match } from "./sample-data";

export const SAMPLE_BUDGET = 100;
export const SAMPLE_TAX = 0;
/** Same leagues the Scanner's Demo button prices. */
export const SAMPLE_LEAGUES = ["epl", "laliga", "seriea", "bundesliga"];

export interface SamplePlan {
  matches: Match[];
  scenarios: Outcome[][];
  odds: number[];
  excluded: boolean[];
  result: ReturnType<typeof computeRows>;
  /** Row given up by the best cover plan; null when covering everything pays best. */
  givenUp: number | null;
  /** What every covered scenario returns, as a % of the budget. */
  profitPct: number;
}

/** Upcoming football fixtures from the sample data that carry three-way odds. */
const threeWay = () =>
  MATCHES.filter((m) => m.sportId === "football" && !m.live && m.odds.draw !== undefined);

function planFor(matches: Match[]): SamplePlan {
  const scenarios = buildScenarios(matches.length);
  const odds = deriveScenarioOdds(
    matches.map((m) => ({ W: m.odds.home, D: m.odds.draw!, L: m.odds.away })),
    scenarios,
  );
  const rows = odds.map((o) => ({ stake: 0, odds: o }));
  const plans = coverPlans(rows, SAMPLE_BUDGET, SAMPLE_TAX);
  const best = bestCoverPlan(plans) ?? plans[0] ?? null;
  const givenUp = best?.index ?? null;
  const { excluded, stakes } = applyCoverPlan(rows, SAMPLE_BUDGET, SAMPLE_TAX, givenUp);
  const result = computeRows(
    rows.map((r, i) => ({ ...r, stake: stakes[i]!, excluded: excluded[i]! })),
    SAMPLE_BUDGET,
    SAMPLE_TAX,
  );
  return { matches, scenarios, odds, excluded, result, givenUp, profitPct: best?.profitPct ?? 0 };
}

/** The two-fixture sample plan with the best give-up return. Deterministic. */
export function samplePlan(): SamplePlan {
  let best: SamplePlan | null = null;
  for (const pair of combinations(threeWay(), 2)) {
    const p = planFor(pair);
    if (!best || p.profitPct > best.profitPct) best = p;
  }
  return best ?? planFor(threeWay().slice(0, 2));
}

/** Demo-priced fixtures and their best two-game combos, as the Scanner's Demo would show. */
export function sampleScan(now: number, limit = 4): { games: Game[]; results: ComboResult[] } {
  const books = BOOKMAKERS.map((b) => b.id);
  const all = SAMPLE_LEAGUES.flatMap((id) => generateLeagueFixtures(id, now, "demo"));
  const games = freshGames(all, now, books).games;
  const results = sortResults(
    scanCombos(games, { combine: 2, minProfitPct: 1, oddsSource: "best", books }),
    "profit",
  ).slice(0, limit);
  return { games, results };
}
