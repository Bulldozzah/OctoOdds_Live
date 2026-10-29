/**
 * Edge math: values the same cached odds by expected return instead of
 * nominal payout. Fair chances come from the margin-free consensus of every
 * bookmaker quoting the game.
 */
import {
  bestLeg,
  bookLeg,
  combinations,
  coverVariants,
  impliedProbs,
  margin,
  patternOf,
  scenariosFor,
  type Odds3,
  type PricedLeg,
  type QuotedGame,
} from "./scanner";

export const POOL_SIZE = 14;

/** Average of each book's margin-free implied chances. */
export function consensusProbs(game: QuotedGame): Odds3 {
  const qs = Object.values(game.quotes).filter(Boolean) as Odds3[];
  const sum = { W: 0, D: 0, L: 0 };
  for (const q of qs) {
    const p = impliedProbs(q);
    sum.W += p.W;
    sum.D += p.D;
    sum.L += p.L;
  }
  const n = qs.length || 1;
  return { W: sum.W / n, D: sum.D / n, L: sum.L / n };
}

export interface PoolItem {
  game: QuotedGame;
  leg: PricedLeg;
  fair: Odds3;
  margin: number;
}

/** Every game priced the chosen way, tightest margin first. */
export function rankMargins(games: QuotedGame[], mode: "best" | "book", book: string): PoolItem[] {
  const items: PoolItem[] = [];
  for (const g of games) {
    const leg = mode === "best" ? bestLeg(g) : bookLeg(g, book);
    if (!leg) continue;
    items.push({ game: g, leg, fair: consensusProbs(g), margin: margin(leg.odds) });
  }
  return items.sort((a, b) => a.margin - b.margin);
}

export interface ValueRow {
  id: string;
  items: PoolItem[];
  full: boolean;
  profitPct: number;
  excluded: number | null;
  pattern: string | null;
  /** Fair chance the slip returns. */
  coverProb: number;
  /** Expected return per 100 staked. */
  evPer100: number;
}

/** Best-EV qualifying variant of one combo, or null. */
export function valueOf(items: PoolItem[], minProfitPct: number, pattern = "any"): ValueRow | null {
  const n = items.length;
  const variants = coverVariants(
    items.map((i) => i.leg.odds),
    minProfitPct,
    items.map((i) => i.fair),
  );
  let best: ValueRow | null = null;
  for (const v of variants) {
    const pat = v.excluded === null ? null : patternOf(scenariosFor(n)[v.excluded]!);
    if (pattern !== "any" && !v.full && pat !== pattern) continue;
    const coverProb = 1 - v.excludedProb;
    const row: ValueRow = {
      id: items.map((i) => i.game.id).join("|"),
      items,
      full: v.full,
      profitPct: v.profitPct,
      excluded: v.excluded,
      pattern: pat,
      coverProb,
      evPer100: 100 * v.payout * coverProb,
    };
    if (!best || row.evPer100 > best.evPer100 + 1e-9 || (Math.abs(row.evPer100 - best.evPer100) <= 1e-9 && row.coverProb > best.coverProb))
      best = row;
  }
  return best;
}

/** Every qualifying n-leg combo from the pool, highest EV first; ties → lands more often. */
export function valueRanking(pool: PoolItem[], n: number, minProfitPct: number, pattern = "any"): ValueRow[] {
  const out: ValueRow[] = [];
  for (const combo of combinations(pool, n)) {
    const v = valueOf(combo, minProfitPct, pattern);
    if (v) out.push(v);
  }
  return out.sort((a, b) => b.evPer100 - a.evPer100 || b.coverProb - a.coverProb);
}

export interface LadderStep {
  legs: number;
  combos: number;
  qualifying: number;
  avgProfitPct: number;
  avgCoverProb: number;
  avgEv: number;
  best: ValueRow | null;
}

/** The same games structured as singles, doubles, trebles and quads. */
export function structureLadder(items: PoolItem[], minProfitPct: number): LadderStep[] {
  const steps: LadderStep[] = [];
  for (let k = 1; k <= Math.min(4, items.length); k++) {
    let combos = 0;
    const rows: ValueRow[] = [];
    for (const c of combinations(items, k)) {
      combos++;
      const v = valueOf(c, minProfitPct);
      if (v) rows.push(v);
    }
    const avg = (f: (r: ValueRow) => number) => (rows.length ? rows.reduce((a, r) => a + f(r), 0) / rows.length : 0);
    steps.push({
      legs: k,
      combos,
      qualifying: rows.length,
      avgProfitPct: avg((r) => r.profitPct),
      avgCoverProb: avg((r) => r.coverProb),
      avgEv: avg((r) => r.evPer100),
      best: rows.sort((a, b) => b.evPer100 - a.evPer100)[0] ?? null,
    });
  }
  return steps;
}

export interface SettledInput {
  id: string;
  stake: number;
  payout: number;
  coverProb: number;
  won: boolean;
}

/** Compares what each settled bet was worth at its odds with what it returned. */
export function expectedVsActual<T extends SettledInput>(bets: T[]) {
  let cumE = 0;
  let cumA = 0;
  let variance = 0;
  const rows = bets.map((b) => {
    const win = b.stake * b.payout;
    const expected = win * b.coverProb;
    const actual = b.won ? win : 0;
    variance += win * win * b.coverProb * (1 - b.coverProb);
    cumE += expected;
    cumA += actual;
    return { ...b, expected, actual, cumExpected: cumE, cumActual: cumA };
  });
  const staked = bets.reduce((a, b) => a + b.stake, 0);
  const sd = Math.sqrt(variance);
  const z = sd > 0 ? (cumA - cumE) / sd : 0;
  const verdict: "tracking" | "ahead" | "behind" = z >= 2 ? "ahead" : z <= -2 ? "behind" : "tracking";
  return { rows, staked, expected: cumE, actual: cumA, sd, z, verdict };
}
