import { describe, expect, it } from "vitest";
import { consensusProbs, expectedVsActual, rankMargins, valueOf } from "./edge";

const game = (id: string, quotes: Record<string, { W: number; D: number; L: number }>) => ({
  id,
  kickoff: 2,
  fetchedAt: 1,
  quotes: Object.fromEntries(Object.entries(quotes).map(([b, q]) => [b, { ...q, updatedAt: 1 }])),
});

describe("edge valuation", () => {
  it("uses the margin-free consensus of every book as the fair chance", () => {
    const p = consensusProbs(game("g", { a: { W: 2, D: 4, L: 4 }, b: { W: 2, D: 4, L: 4 } }));
    expect(p.W).toBeCloseTo(0.5, 9);
    expect(p.D).toBeCloseTo(0.25, 9);
  });

  it("ranks markets tightest margin first", () => {
    const rows = rankMargins(
      [game("wide", { a: { W: 1.8, D: 3.2, L: 3.8 } }), game("tight", { a: { W: 2.05, D: 3.5, L: 4.1 } })],
      "book",
      "a",
    );
    expect(rows.map((r) => r.game.id)).toEqual(["tight", "wide"]);
  });

  it("values a slip as expected return per 100 staked", () => {
    const g = game("g", { a: { W: 2.1, D: 3.6, L: 4.3 } });
    const [item] = rankMargins([g], "best", "a");
    const fair = { W: 0.5, D: 0.27, L: 0.23 };
    const v = valueOf([{ ...item!, fair }], -100)!;
    // Best single exclusion is Draw: covering W + L returns 1/(1/2.1+1/4.3) per unit, landing 73% of the time.
    expect(v.pattern).toBe("D");
    expect(v.evPer100).toBeCloseTo(100 * 0.73 * (1 / (1 / 2.1 + 1 / 4.3)), 6);
  });

  it("compares expected with actual returns on settled bets", () => {
    const r = expectedVsActual([
      { id: "1", stake: 100, payout: 1.1, coverProb: 0.9, won: true },
      { id: "2", stake: 100, payout: 1.1, coverProb: 0.9, won: false },
    ]);
    expect(r.expected).toBeCloseTo(198, 6);
    expect(r.actual).toBeCloseTo(110, 6);
    expect(r.staked).toBe(200);
  });
});
