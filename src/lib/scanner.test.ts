import { describe, expect, it } from "vitest";
import {
  POOL_CAP,
  capPool,
  combinations,
  evaluateCover,
  filterByPattern,
  freshGames,
  patternOf,
  scanCombos,
  scenariosFor,
  singleGameArbs,
  type PricedLeg,
} from "./scanner";

const leg = { W: 2.0, D: 3.4, L: 4.0 };

describe("scanner cover math", () => {
  it("flags a full cover when every scenario is profitable", () => {
    const c = evaluateCover(
      [
        { W: 3.3, D: 3.3, L: 3.3 },
        { W: 3.3, D: 3.3, L: 3.3 },
      ],
      1,
    )!;
    expect(c.full).toBe(true);
    expect(c.excluded).toBeNull();
    expect(c.profitPct).toBeCloseTo(((3.3 * 3.3) / 9) * 100 - 100, 6);
  });

  it("otherwise excludes the least likely scenario that still clears the profit floor", () => {
    const c = evaluateCover([leg, leg], 1)!;
    expect(c.full).toBe(false);
    // W+L (inverse 0.125) is the least likely exclusion that clears 1%; D+D etc. are too small.
    expect(patternOf(scenariosFor(2)[c.excluded!]!)).toBe("W+L");
    const S = (1 / 2 + 1 / 3.4 + 1 / 4) ** 2;
    expect(c.profitPct).toBeCloseTo((1 / (S - 1 / 8) - 1) * 100, 6);
  });

  it("returns nothing when no single exclusion reaches the floor", () => {
    expect(evaluateCover([leg, leg], 30)).toBeNull();
  });
});

describe("single-game arbitrage", () => {
  it("combines each outcome's best price across books", () => {
    const game = {
      id: "g",
      kickoff: 2,
      fetchedAt: 1,
      quotes: {
        a: { W: 2.2, D: 3.2, L: 3.5, updatedAt: 1 },
        b: { W: 1.9, D: 3.6, L: 4.2, updatedAt: 1 },
      },
    };
    const [arb] = singleGameArbs([game]);
    expect(arb!.leg.books).toEqual({ W: "a", D: "b", L: "b" });
    expect(arb!.profitPct).toBeCloseTo((1 / (1 / 2.2 + 1 / 3.6 + 1 / 4.2) - 1) * 100, 6);
  });
});

describe("pool, freshness and filters", () => {
  it("caps the pool at 20 games for 3-game combos and 12 for 4-game combos", () => {
    const legs: PricedLeg[] = Array.from({ length: 30 }, (_, i) => ({
      gameId: `g${i}`,
      odds: { W: 2 + i * 0.01, D: 3.3, L: 3.8 },
      books: { W: "x", D: "x", L: "x" },
    }));
    expect(POOL_CAP[2]).toBe(Infinity);
    expect(capPool(legs, 2)).toHaveLength(30);
    expect(capPool(legs, 3)).toHaveLength(20);
    expect(capPool(legs, 4)).toHaveLength(12);
  });

  it("drops games that kicked off and games whose quotes are over 15 minutes old", () => {
    const now = 100_000_000;
    const base = { fetchedAt: now - 1000 };
    const games = [
      {
        ...base,
        id: "ok",
        kickoff: now + 1,
        quotes: { a: { W: 2, D: 3, L: 4, updatedAt: now - 2000 } },
      },
      {
        ...base,
        id: "started",
        kickoff: now - 1,
        quotes: { a: { W: 2, D: 3, L: 4, updatedAt: now - 2000 } },
      },
      {
        ...base,
        id: "stale",
        kickoff: now + 1,
        quotes: { a: { W: 2, D: 3, L: 4, updatedAt: now - 16 * 60000 } },
      },
    ];
    const r = freshGames(games, now, ["a"]);
    expect(r.games.map((g) => g.id)).toEqual(["ok"]);
    expect(r.started).toBe(1);
    expect(r.stale).toBe(1);
  });

  it("ages a stored scan against the clock, not against when it was fetched", () => {
    const fetchedAt = 100_000_000;
    const game = {
      id: "g",
      fetchedAt,
      kickoff: fetchedAt + 10 * 3600_000,
      quotes: { a: { W: 2, D: 3, L: 4, updatedAt: fetchedAt } },
    };
    expect(freshGames([game], fetchedAt + 60_000, ["a"]).games).toHaveLength(1);
    expect(freshGames([game], fetchedAt + 2 * 3600_000, ["a"]).stale).toBe(1);
  });

  it("never hides full covers with the uncovered-scenario filter", () => {
    const rows = [
      { full: true, pattern: null },
      { full: false, pattern: "W+L" },
      { full: false, pattern: "D+D" },
    ];
    expect(filterByPattern(rows, "W+L")).toEqual([rows[0], rows[1]]);
  });

  it("builds one slip per bookmaker in same-bookmaker mode", () => {
    const g = (id: string) => ({
      id,
      kickoff: 2,
      fetchedAt: 1,
      quotes: { a: { ...leg, updatedAt: 1 }, b: { ...leg, updatedAt: 1 } },
    });
    const r = scanCombos([g("x"), g("y")], {
      combine: 2,
      minProfitPct: 1,
      oddsSource: "same",
      books: ["a", "b"],
    });
    expect(r.map((x) => x.book)).toEqual(["a", "b"]);
    expect([...combinations([1, 2, 3, 4], 3)]).toHaveLength(4);
  });

  it("combine 1 prices each game on its own 3 W/D/L scenarios", () => {
    const g = (id: string, odds: typeof leg) => ({
      id,
      kickoff: 2,
      fetchedAt: 1,
      quotes: { a: { ...odds, updatedAt: 1 } },
    });
    // x is a same-book arb (Σ1/odds < 1) → full cover; y only clears 1% by giving up a scenario.
    const r = scanCombos([g("x", { W: 3.4, D: 3.4, L: 3.4 }), g("y", leg)], {
      combine: 1,
      minProfitPct: 1,
      oddsSource: "same",
      books: ["a"],
    });
    const x = r.find((c) => c.legs[0]!.gameId === "x")!;
    const y = r.find((c) => c.legs[0]!.gameId === "y")!;
    expect(x.full).toBe(true);
    expect(x.profitPct).toBeCloseTo((1 / (3 / 3.4) - 1) * 100, 6);
    expect(y.full).toBe(false);
    // The longest-odds outcome (L, implied ~24%) is the least likely exclusion.
    expect(patternOf(scenariosFor(1)[y.excluded!]!)).toBe("L");
    expect(y.legs).toHaveLength(1);
    expect(r.every((c) => scenariosFor(1).length === 3)).toBe(true);
  });
});
