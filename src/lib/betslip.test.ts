import { describe, expect, it } from "vitest";
import {
  accumulatorOdds,
  potentialWin,
  singlesTotals,
  stakeError,
  toggleSelection,
  type Selection,
} from "./betslip";

const sel = (matchId: string, market: Selection["market"], odd: number): Selection => ({
  matchId,
  market,
  odd,
  label: market,
  matchName: matchId,
});

describe("bet slip", () => {
  it("adds, replaces within the same match, and removes on second click", () => {
    let slip = toggleSelection([], sel("a", "1", 2));
    slip = toggleSelection(slip, sel("b", "X", 3));
    expect(slip).toHaveLength(2);
    slip = toggleSelection(slip, sel("a", "2", 4));
    expect(slip.find((s) => s.matchId === "a")?.market).toBe("2");
    expect(slip).toHaveLength(2);
    slip = toggleSelection(slip, sel("a", "2", 4));
    expect(slip.map((s) => s.matchId)).toEqual(["b"]);
  });

  it("multiplies odds for an accumulator", () => {
    expect(accumulatorOdds([sel("a", "1", 2.45), sel("b", "1", 1.38)])).toBe(3.38);
  });

  it("computes potential win as stake x odds", () => {
    expect(potentialWin(100, 3.38)).toBe(338);
  });

  it("sums singles with the same stake on each pick", () => {
    expect(singlesTotals([sel("a", "1", 2), sel("b", "1", 3)], 10)).toEqual({
      totalStake: 20,
      totalWin: 50,
    });
  });

  it("enforces K1 minimum and K50,000 maximum stake", () => {
    expect(stakeError(0.5)).not.toBeNull();
    expect(stakeError(1)).toBeNull();
    expect(stakeError(50000)).toBeNull();
    expect(stakeError(50001)).not.toBeNull();
  });
});
