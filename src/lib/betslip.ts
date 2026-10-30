export type MarketKey = "1" | "X" | "2" | "O" | "U";

export interface Selection {
  matchId: string;
  market: MarketKey;
  label: string;
  matchName: string;
  odd: number;
}

export const MIN_STAKE = 1;
export const MAX_STAKE = 50000;

/**
 * Clicking an odd: same odd again removes it, another odd from the same match
 * replaces the previous pick, otherwise the pick is added.
 */
export function toggleSelection(slip: Selection[], sel: Selection): Selection[] {
  const existing = slip.find((s) => s.matchId === sel.matchId);
  if (existing && existing.market === sel.market) {
    return slip.filter((s) => s.matchId !== sel.matchId);
  }
  if (existing) {
    return slip.map((s) => (s.matchId === sel.matchId ? sel : s));
  }
  return [...slip, sel];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Accumulator: all odds multiplied together. */
export function accumulatorOdds(slip: Selection[]): number {
  if (slip.length === 0) return 0;
  return round2(slip.reduce((acc, s) => acc * s.odd, 1));
}

export function potentialWin(stake: number, odds: number): number {
  if (!(stake > 0) || !(odds > 0)) return 0;
  return round2(stake * odds);
}

/** Singles: the same stake on every selection; returns total stake and total possible win. */
export function singlesTotals(slip: Selection[], stakePerBet: number) {
  const totalStake = round2(stakePerBet * slip.length);
  const totalWin = round2(slip.reduce((acc, s) => acc + potentialWin(stakePerBet, s.odd), 0));
  return { totalStake, totalWin };
}

export function stakeError(stake: number): string | null {
  if (!Number.isFinite(stake) || stake <= 0) return "Enter a stake";
  if (stake < MIN_STAKE) return `Minimum stake is ${MIN_STAKE}`;
  if (stake > MAX_STAKE) return `Maximum stake is ${MAX_STAKE.toLocaleString()}`;
  return null;
}
