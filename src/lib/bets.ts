/**
 * My Bets / Stats rules. A bet is a saved Calculator plan. Its result is never
 * stored: it is derived every time with outcomeOf(computeBet(bet)), so My Bets,
 * Stats and the per-team table can never disagree.
 */
import { buildScenarios, EVENT_LETTERS, round2 } from "./calculator";
import type { RowDraft, SavedPlan } from "./calculator-plans";

/** wonScenario value for a bet marked lost without any scenario winning. */
export const LOST = -1;
export const DAY_MS = 24 * 60 * 60 * 1000;

export type BetOutcome = "pending" | "won" | "lost" | "breakeven";

const num = (s: string | number | undefined) => {
  const n = typeof s === "number" ? s : parseFloat(s ?? "");
  return Number.isFinite(n) ? n : 0;
};

/** Net payout for one scenario: tax applies to the winnings only. */
export function scenarioNetPayout(stake: number, odds: number, taxRate: number): number {
  const gross = stake * odds;
  return gross - Math.max(0, gross - stake) * taxRate;
}

export interface BetFigures {
  stakes: number[];
  totalStaked: number;
  taxRate: number;
  /** null = pending, LOST = marked lost, otherwise the winning row index. */
  wonScenario: number | null;
  returned: number;
  net: number;
}

export function computeBet(bet: SavedPlan): BetFigures {
  const stakes = bet.rows.map((r) => (r.excluded ? 0 : Math.max(0, num(r.stake))));
  const totalStaked = round2(stakes.reduce((a, b) => a + b, 0));
  const taxRate = Math.min(Math.max(num(bet.tax), 0), 99) / 100;
  const wonScenario = bet.wonScenario ?? null;
  let returned = 0;
  if (wonScenario !== null && wonScenario >= 0) {
    returned = round2(
      scenarioNetPayout(stakes[wonScenario] ?? 0, bet.odds[wonScenario] ?? 0, taxRate),
    );
  }
  const net = wonScenario === null ? 0 : round2(returned - totalStaked);
  return { stakes, totalStaked, taxRate, wonScenario, returned, net };
}

export function outcomeOf(f: BetFigures): BetOutcome {
  if (f.wonScenario === null) return "pending";
  if (f.wonScenario === LOST || f.net < 0) return "lost";
  if (f.net > 0) return "won";
  return "breakeven";
}

export const betOutcome = (bet: SavedPlan) => outcomeOf(computeBet(bet));

export const OUTCOME_LABEL: Record<BetOutcome, string> = {
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  breakeven: "Break-even",
};

const teamName = (bet: SavedPlan, k: number) =>
  bet.events[k]?.name.trim() || `Team ${EVENT_LETTERS[k]}`;

/** e.g. "Arsenal W + Chelsea L". */
export function scenarioName(bet: SavedPlan, index: number): string {
  const sc = buildScenarios(bet.eventCount)[index];
  if (!sc) return `Scenario ${index + 1}`;
  return sc.map((o, k) => `${teamName(bet, k)} ${o}`).join(" + ");
}

export function winnerLabel(bet: SavedPlan): string {
  const w = bet.wonScenario ?? null;
  if (w === null) return "—";
  if (w === LOST) return "None (lost)";
  return scenarioName(bet, w);
}

/** Every team named on the bet: event names plus both sides of each matchup. */
export function participants(bet: SavedPlan): string[] {
  const seen = new Map<string, string>();
  for (const e of bet.events) {
    for (const raw of [e.name, ...(e.matchup ? e.matchup.split(/\s+vs\.?\s+/i) : [])]) {
      const t = raw.trim();
      if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
    }
  }
  return [...seen.values()];
}

export interface SettleRowEdit {
  stake: string;
  odds: number;
}

/** Lock in a result. Pass edited rows when what was really staked differs from the plan. */
export function settleBet(
  bet: SavedPlan,
  wonScenario: number,
  edits: SettleRowEdit[] | null,
  now: number,
): SavedPlan {
  const rows: RowDraft[] = edits
    ? bet.rows.map((r, i) => ({
        ...r,
        stake: edits[i]?.stake ?? r.stake,
        odds: edits[i] ? String(edits[i].odds) : r.odds,
      }))
    : bet.rows;
  const odds = edits ? bet.odds.map((o, i) => edits[i]?.odds ?? o) : bet.odds;
  return { ...bet, rows, odds, wonScenario, settledAt: now, status: "Settled" };
}

export function resetBet(bet: SavedPlan): SavedPlan {
  return { ...bet, wonScenario: null, settledAt: null, status: "Pending" };
}

// ---------- Stats ----------

export type Period = 7 | 30 | 90 | "all";

export function filterPeriod(bets: SavedPlan[], period: Period, now: number): SavedPlan[] {
  if (period === "all") return bets;
  const from = now - period * DAY_MS;
  return bets.filter((b) => b.createdAt >= from);
}

export interface Summary {
  total: number;
  staked: number;
  returns: number;
  net: number;
  settledStaked: number;
  /** Net ÷ staked on settled bets only; null with nothing settled. */
  roi: number | null;
  pendingExposure: number;
  wins: number;
  losses: number;
  breakeven: number;
  pending: number;
  /** Wins ÷ (wins + losses); break-even bets left out of both. */
  winRate: number | null;
}

export function summarize(bets: SavedPlan[]): Summary {
  const s = {
    staked: 0,
    returns: 0,
    net: 0,
    settledStaked: 0,
    pendingExposure: 0,
    wins: 0,
    losses: 0,
    breakeven: 0,
    pending: 0,
  };
  for (const b of bets) {
    const f = computeBet(b);
    const o = outcomeOf(f);
    s.staked += f.totalStaked;
    if (o === "pending") {
      s.pending += 1;
      s.pendingExposure += f.totalStaked;
      continue;
    }
    s.settledStaked += f.totalStaked;
    s.returns += f.returned;
    s.net += f.net;
    if (o === "won") s.wins += 1;
    else if (o === "lost") s.losses += 1;
    else s.breakeven += 1;
  }
  const decided = s.wins + s.losses;
  return {
    total: bets.length,
    staked: round2(s.staked),
    returns: round2(s.returns),
    net: round2(s.net),
    settledStaked: round2(s.settledStaked),
    roi: s.settledStaked > 0 ? s.net / s.settledStaked : null,
    pendingExposure: round2(s.pendingExposure),
    wins: s.wins,
    losses: s.losses,
    breakeven: s.breakeven,
    pending: s.pending,
    winRate: decided > 0 ? s.wins / decided : null,
  };
}

export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Staked per day (by saved date, pending included) and net per day (settled only, by settle date). */
export function dailySeries(bets: SavedPlan[]): { day: string; staked: number; net: number }[] {
  const map = new Map<string, { staked: number; net: number }>();
  const at = (k: string) => map.get(k) ?? (map.set(k, { staked: 0, net: 0 }), map.get(k)!);
  for (const b of bets) {
    const f = computeBet(b);
    at(dayKey(b.createdAt)).staked += f.totalStaked;
    if (outcomeOf(f) !== "pending") at(dayKey(b.settledAt ?? b.createdAt)).net += f.net;
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, staked: round2(v.staked), net: round2(v.net) }));
}

/** Running total of net profit across settled bets in settle order. */
export function equityCurve(
  bets: SavedPlan[],
): { at: number; title: string; net: number; cumulative: number }[] {
  let cum = 0;
  return bets
    .filter((b) => betOutcome(b) !== "pending")
    .sort((a, b) => (a.settledAt ?? a.createdAt) - (b.settledAt ?? b.createdAt))
    .map((b) => {
      const { net } = computeBet(b);
      cum = round2(cum + net);
      return { at: b.settledAt ?? b.createdAt, title: b.title, net, cumulative: cum };
    });
}

export interface TeamRow {
  team: string;
  bets: number;
  staked: number;
  net: number;
  roi: number | null;
  winRate: number | null;
}

/** Each bet counts in full toward every team named on it, so column totals can exceed account totals. */
export function aggregateByTeam(bets: SavedPlan[]): TeamRow[] {
  const map = new Map<
    string,
    {
      team: string;
      bets: number;
      staked: number;
      net: number;
      settledStaked: number;
      wins: number;
      losses: number;
    }
  >();
  for (const b of bets) {
    const f = computeBet(b);
    const o = outcomeOf(f);
    for (const team of participants(b)) {
      const key = team.toLowerCase();
      const r = map.get(key) ?? {
        team,
        bets: 0,
        staked: 0,
        net: 0,
        settledStaked: 0,
        wins: 0,
        losses: 0,
      };
      r.bets += 1;
      r.staked += f.totalStaked;
      if (o !== "pending") {
        r.net += f.net;
        r.settledStaked += f.totalStaked;
        if (o === "won") r.wins += 1;
        if (o === "lost") r.losses += 1;
      }
      map.set(key, r);
    }
  }
  return [...map.values()]
    .map((r) => ({
      team: r.team,
      bets: r.bets,
      staked: round2(r.staked),
      net: round2(r.net),
      roi: r.settledStaked > 0 ? r.net / r.settledStaked : null,
      winRate: r.wins + r.losses > 0 ? r.wins / (r.wins + r.losses) : null,
    }))
    .sort((a, b) => b.net - a.net || a.team.localeCompare(b.team));
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(bets: SavedPlan[]): string {
  const head = [
    "Date",
    "Bet",
    "Teams",
    "Invested",
    "Returned",
    "Net",
    "Result",
    "Winning scenario",
  ];
  const lines = [...bets]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((b) => {
      const f = computeBet(b);
      const o = outcomeOf(f);
      return [
        dayKey(b.createdAt),
        b.title,
        participants(b).join("; "),
        f.totalStaked.toFixed(2),
        o === "pending" ? "" : f.returned.toFixed(2),
        o === "pending" ? "" : f.net.toFixed(2),
        OUTCOME_LABEL[o],
        o === "pending" ? "" : winnerLabel(b),
      ];
    });
  return [head, ...lines].map((r) => r.map(csvCell).join(",")).join("\n");
}
