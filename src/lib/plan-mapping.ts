/**
 * Converts between the Calculator's SavedPlan and a row of the shared OctoOdds
 * `bets` table, so a plan saved here opens in OctoOdds and vice versa.
 *
 * OctoOdds' conventions, which the table follows:
 *   - rows[i].name is the canonical scenario "AW + BL" (last event cycles fastest)
 *   - tax is a rate (0.15), not a percentage
 *   - won_scenario is the winning row's name, "__LOST__", or null while pending
 */
import { buildScenarios, EVENT_LETTERS, type Outcome } from "./calculator";
import { emptyEvent, emptyRow, type EventDraft, type SavedPlan } from "./calculator-plans";
import { LOST } from "./bets";

export const LOST_NAME = "__LOST__";

export interface BetRowRecord {
  name: string;
  stake: string;
  odds: string;
  excluded?: boolean;
  unlikely?: boolean;
}

export interface BetRecord {
  id: string;
  user_id: string;
  title: string | null;
  team_count: number;
  tax: number;
  target_stake: number;
  rows: BetRowRecord[];
  team_names: string[];
  outcome_odds: { W: string; D: string; L: string }[] | null;
  games: { home: string; away: string; league?: string }[] | null;
  won_scenario: string | null;
  settled_at: string | null;
  created_at: string;
}

/** Columns a save writes; ids, owner and timestamps are the database's. */
export type BetWrite = Pick<
  BetRecord,
  "title" | "team_count" | "tax" | "target_stake" | "rows" | "team_names" | "outcome_odds" | "games"
>;

/** "AW + BL" — the OctoOdds row name for a scenario. */
export const scenarioName = (sc: Outcome[]) =>
  sc.map((o, k) => `${EVENT_LETTERS[k]}${o}`).join(" + ");

const num = (s: string | number | null | undefined) => {
  const n = typeof s === "number" ? s : parseFloat(s ?? "");
  return Number.isFinite(n) ? n : 0;
};

const trimNum = (n: number) => String(Math.round(n * 1e6) / 1e6);

const splitMatchup = (m: string): { home: string; away: string } | null => {
  const [home, away] = m.split(/\s+vs\.?\s+/i).map((s) => s.trim());
  return home && away ? { home, away } : null;
};

export function planToBet(plan: SavedPlan): BetWrite {
  const n = plan.eventCount;
  const names = buildScenarios(n).map(scenarioName);
  const games = plan.events.map((e) => splitMatchup(e.matchup));
  return {
    title: plan.title || null,
    team_count: n,
    tax: num(plan.tax) / 100,
    target_stake: num(plan.budget),
    rows: names.map((name, i) => {
      const r = plan.rows[i] ?? emptyRow();
      return {
        name,
        stake: r.excluded ? "0" : String(num(r.stake)),
        odds: r.odds || String(plan.odds[i] ?? 0),
        excluded: r.excluded,
        unlikely: r.unlikely,
      };
    }),
    team_names: plan.events.map((e) => e.name),
    outcome_odds: plan.events.map((e) => ({ W: e.W, D: e.D, L: e.L })),
    // Only stored when every event has a matchup — OctoOdds reads it as all-or-nothing.
    games: games.every(Boolean) ? (games as { home: string; away: string }[]) : null,
  };
}

/** The won_scenario value for a plan: the winning row's name, "__LOST__", or null while pending. */
export function wonScenarioName(plan: SavedPlan): string | null {
  const w = plan.wonScenario ?? null;
  if (w === null) return null;
  if (w === LOST) return LOST_NAME;
  const sc = buildScenarios(plan.eventCount)[w];
  return sc ? scenarioName(sc) : null;
}

export function betToPlan(bet: BetRecord): SavedPlan {
  const n = Math.min(Math.max(bet.team_count || 1, 1), 4);
  const names = buildScenarios(n).map(scenarioName);
  const byName = new Map((bet.rows ?? []).map((r) => [r.name.replace(/\s+/g, ""), r]));
  const rowFor = (name: string) => byName.get(name.replace(/\s+/g, ""));

  // OctoOdds' 1-event tab binds the three rows (AW, AD, AL) straight to W/D/L,
  // so older single-event bets carry no outcome_odds — read them off the rows.
  const rowOdds = (name: string) => {
    const v = num(rowFor(name)?.odds);
    return v > 0 ? v.toFixed(2) : "";
  };
  const fallback = n === 1 ? { W: rowOdds("AW"), D: rowOdds("AD"), L: rowOdds("AL") } : undefined;

  const events: EventDraft[] = Array.from({ length: n }, (_, k) => {
    const o = bet.outcome_odds?.[k] ?? fallback;
    const g = bet.games?.[k];
    return {
      ...emptyEvent(),
      name: bet.team_names?.[k] ?? "",
      matchup: g ? `${g.home} vs ${g.away}` : "",
      W: o?.W ?? "",
      D: o?.D ?? "",
      L: o?.L ?? "",
    };
  });

  // A won_scenario that matches no row is treated as unsettled rather than guessed at.
  const winnerIdx = names.findIndex(
    (name) => name.replace(/\s+/g, "") === (bet.won_scenario ?? "").replace(/\s+/g, ""),
  );
  const wonScenario = bet.won_scenario === LOST_NAME ? LOST : winnerIdx >= 0 ? winnerIdx : null;

  return {
    id: bet.id,
    createdAt: new Date(bet.created_at).getTime(),
    title: bet.title || events.map((e, k) => e.name || `Team ${EVENT_LETTERS[k]}`).join(" / "),
    eventCount: n,
    events,
    rows: names.map((name) => {
      const r = rowFor(name);
      if (!r) return emptyRow();
      const stake = num(r.stake);
      return {
        stake: !r.excluded && stake > 0 ? stake.toFixed(2) : "",
        // Stored verbatim like OctoOdds — a hand-edited or full-precision value survives the round trip.
        odds: r.odds,
        excluded: !!r.excluded,
        unlikely: !!r.unlikely,
      };
    }),
    odds: names.map((name) => num(rowFor(name)?.odds)),
    budget: trimNum(num(bet.target_stake)),
    tax: trimNum(num(bet.tax) * 100),
    status: wonScenario === null ? "Pending" : "Settled",
    wonScenario,
    settledAt: wonScenario !== null && bet.settled_at ? new Date(bet.settled_at).getTime() : null,
  };
}
