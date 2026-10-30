/**
 * Scanner math: dutching n-game combinations across all 3ⁿ scenarios,
 * full covers, safest single exclusions and single-game arbitrage.
 */
import { buildScenarios, type Outcome } from "./calculator";

export type Odds3 = Record<Outcome, number>;
const OUT: Outcome[] = ["W", "D", "L"];
const EPS = 1e-9;

export interface QuotedGame {
  id: string;
  kickoff: number;
  fetchedAt: number;
  quotes: Partial<Record<string, Odds3 & { updatedAt: number }>>;
}

export interface PricedLeg {
  gameId: string;
  odds: Odds3;
  /** Which book each outcome is priced at. */
  books: Record<Outcome, string>;
}

const scenarioCache = new Map<number, Outcome[][]>();
export function scenariosFor(n: number) {
  let s = scenarioCache.get(n);
  if (!s) scenarioCache.set(n, (s = buildScenarios(n)));
  return s;
}

export const patternOf = (sc: Outcome[]) => sc.join("+");
export const patternsFor = (n: number) => scenariosFor(n).map(patternOf);

/** Bookmaker overround minus 1 (the house edge): 0.05 = 5%. */
export const margin = (o: Odds3) => 1 / o.W + 1 / o.D + 1 / o.L - 1;

/** Implied chances with the margin removed proportionally. */
export function impliedProbs(o: Odds3): Odds3 {
  const s = margin(o) + 1;
  return { W: 1 / o.W / s, D: 1 / o.D / s, L: 1 / o.L / s };
}

export function scenarioOdds(legs: Odds3[]): number[] {
  return scenariosFor(legs.length).map((sc) => sc.reduce((p, o, i) => p * legs[i]![o], 1));
}

export function scenarioProbs(probs: Odds3[]): number[] {
  return scenariosFor(probs.length).map((sc) => sc.reduce((p, o, i) => p * probs[i]![o], 1));
}

export interface Cover {
  full: boolean;
  /** Profit on the whole stake if a covered scenario lands, in percent. */
  profitPct: number;
  excluded: number | null;
  /** Chance the excluded scenario happens (0 for full covers). */
  excludedProb: number;
  /** Return per unit staked when covered. */
  payout: number;
}

/**
 * Every qualifying way to dutch these legs: the full cover when it clears the
 * floor, plus each single exclusion that clears it. `probs` defaults to the
 * legs' own margin-free implied chances.
 */
export function coverVariants(legs: Odds3[], minProfitPct: number, probs?: Odds3[]): Cover[] {
  const odds = scenarioOdds(legs);
  const inv = odds.map((o) => 1 / o);
  const S = inv.reduce((a, b) => a + b, 0);
  const floor = minProfitPct / 100;
  const out: Cover[] = [];
  if (1 / S - 1 >= floor - EPS) {
    out.push({
      full: true,
      profitPct: (1 / S - 1) * 100,
      excluded: null,
      excludedProb: 0,
      payout: 1 / S,
    });
  }
  const p = scenarioProbs(probs ?? legs.map(impliedProbs));
  inv.forEach((v, k) => {
    const rest = S - v;
    if (rest <= 0) return;
    const profit = 1 / rest - 1;
    if (profit >= floor - EPS) {
      out.push({
        full: false,
        profitPct: profit * 100,
        excluded: k,
        excludedProb: p[k]!,
        payout: 1 / rest,
      });
    }
  });
  return out;
}

/** Full cover if possible, otherwise the exclusion least likely to happen (ties → higher profit). */
export function evaluateCover(legs: Odds3[], minProfitPct: number, probs?: Odds3[]): Cover | null {
  const vs = coverVariants(legs, minProfitPct, probs);
  const full = vs.find((v) => v.full);
  if (full) return full;
  let best: Cover | null = null;
  for (const v of vs) {
    if (
      !best ||
      v.excludedProb < best.excludedProb - EPS ||
      (Math.abs(v.excludedProb - best.excludedProb) <= EPS && v.profitPct > best.profitPct)
    )
      best = v;
  }
  return best;
}

export function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  const n = arr.length;
  if (k > n || k <= 0) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idx.map((i) => arr[i]!);
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) return;
    idx[i]!++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1]! + 1;
  }
}

export const POOL_CAP: Record<number, number> = { 1: Infinity, 2: Infinity, 3: 20, 4: 12 };
/**
 * How old a quote may be (against the clock) before it is no longer bettable —
 * the same 15 minutes OctoOdds uses. Measured from `now`, not from the fetch,
 * so a scan restored from storage hours later ages out instead of looking fresh.
 */
export const STALE_MS = 15 * 60 * 1000;

/**
 * Drops started games and stale quotes; keeps only the allowed books.
 * With `keepStale`, stale quotes are kept instead so the last scan stays on
 * screen until the next one — callers must surface the `stale` count.
 */
export function freshGames<G extends QuotedGame>(
  games: G[],
  now: number,
  books: string[],
  opts: { keepStale?: boolean } = {},
) {
  let started = 0;
  let stale = 0;
  const kept: G[] = [];
  for (const g of games) {
    const allowed = Object.entries(g.quotes).filter(([b, q]) => q && books.includes(b));
    if (allowed.length === 0) continue;
    if (g.kickoff <= now) {
      started++;
      continue;
    }
    const fresh = allowed.filter(([, q]) => now - q!.updatedAt <= STALE_MS);
    if (fresh.length === 0) stale++;
    if (fresh.length === 0 && !opts.keepStale) continue;
    kept.push({ ...g, quotes: Object.fromEntries(opts.keepStale ? allowed : fresh) });
  }
  return { games: kept, started, stale };
}

export function bookLeg(game: QuotedGame, book: string): PricedLeg | null {
  const q = game.quotes[book];
  if (!q) return null;
  return {
    gameId: game.id,
    odds: { W: q.W, D: q.D, L: q.L },
    books: { W: book, D: book, L: book },
  };
}

export function bestLeg(game: QuotedGame): PricedLeg | null {
  const entries = Object.entries(game.quotes).filter(([, q]) => q) as [string, Odds3][];
  if (!entries.length) return null;
  const odds = { W: 0, D: 0, L: 0 } as Odds3;
  const books = { W: "", D: "", L: "" } as Record<Outcome, string>;
  for (const o of OUT) {
    for (const [b, q] of entries) {
      if (q[o] > odds[o]) {
        odds[o] = q[o];
        books[o] = b;
      }
    }
  }
  return { gameId: game.id, odds, books };
}

/** Keeps the tightest-margin legs up to the pool cap for n-game combos. */
export function capPool(legs: PricedLeg[], n: number) {
  const cap = POOL_CAP[n] ?? 12;
  return [...legs].sort((a, b) => margin(a.odds) - margin(b.odds)).slice(0, cap);
}

export interface ComboResult extends Cover {
  id: string;
  legs: PricedLeg[];
  /** Book id for same-bookmaker slips, null for best odds across books. */
  book: string | null;
  pattern: string | null;
}

export interface ScanOptions {
  combine: number;
  minProfitPct: number;
  oddsSource: "same" | "best";
  books: string[];
}

function combosFrom(legs: PricedLeg[], opts: ScanOptions, book: string | null, out: ComboResult[]) {
  for (const combo of combinations(capPool(legs, opts.combine), opts.combine)) {
    const c = evaluateCover(
      combo.map((l) => l.odds),
      opts.minProfitPct,
    );
    if (!c) continue;
    out.push({
      ...c,
      id: `${book ?? "best"}:${combo.map((l) => l.gameId).join("|")}`,
      legs: combo,
      book,
      pattern: c.excluded === null ? null : patternOf(scenariosFor(opts.combine)[c.excluded]!),
    });
  }
}

export function scanCombos(games: QuotedGame[], opts: ScanOptions): ComboResult[] {
  const out: ComboResult[] = [];
  if (opts.oddsSource === "best") {
    combosFrom(
      games.map(bestLeg).filter((l): l is PricedLeg => !!l),
      opts,
      null,
      out,
    );
  } else {
    for (const b of opts.books) {
      combosFrom(
        games.map((g) => bookLeg(g, b)).filter((l): l is PricedLeg => !!l),
        opts,
        b,
        out,
      );
    }
  }
  return out;
}

export interface SingleArb {
  gameId: string;
  leg: PricedLeg;
  profitPct: number;
}

/** Games where backing W, D and L at the best books costs less than it returns. */
export function singleGameArbs(games: QuotedGame[]): SingleArb[] {
  return games
    .map((g) => bestLeg(g))
    .filter((l): l is PricedLeg => !!l)
    .map((leg) => ({ gameId: leg.gameId, leg, profitPct: (1 / (margin(leg.odds) + 1) - 1) * 100 }))
    .filter((a) => a.profitPct > EPS)
    .sort((a, b) => b.profitPct - a.profitPct);
}

/** Pattern filter: full covers are never hidden. */
export function filterByPattern<T extends { full: boolean; pattern: string | null }>(
  rows: T[],
  pattern: string,
) {
  return pattern === "any" ? rows : rows.filter((r) => r.full || r.pattern === pattern);
}

export type SortKey = "profit" | "safest";

export function sortResults<T extends Cover>(rows: T[], sort: SortKey) {
  return [...rows].sort((a, b) =>
    sort === "profit"
      ? b.profitPct - a.profitPct || a.excludedProb - b.excludedProb
      : a.excludedProb - b.excludedProb || b.profitPct - a.profitPct,
  );
}

/** Stakes for a budget: proportional to 1/odds over covered scenarios. */
export function dutchStakes(legs: Odds3[], excluded: number | null, budget: number) {
  const odds = scenarioOdds(legs);
  const inv = odds.map((o, i) => (i === excluded ? 0 : 1 / o));
  const S = inv.reduce((a, b) => a + b, 0);
  return odds.map((o, i) => ({
    odds: o,
    stake: S ? (budget * inv[i]!) / S : 0,
    excluded: i === excluded,
  }));
}
