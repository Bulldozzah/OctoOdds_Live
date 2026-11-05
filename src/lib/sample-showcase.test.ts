import { describe, expect, it } from "vitest";
import { SAMPLE_BUDGET, samplePlan, sampleScan } from "./sample-showcase";

describe("sample showcase", () => {
  it("builds a deterministic two-fixture plan that stakes the whole budget", () => {
    const a = samplePlan();
    const b = samplePlan();
    expect(a.matches.map((m) => m.id)).toEqual(b.matches.map((m) => m.id));
    expect(a.matches).toHaveLength(2);
    expect(a.scenarios).toHaveLength(9);
    expect(a.result.totalStaked).toBeCloseTo(SAMPLE_BUDGET, 2);
  });

  it("leaves only the given-up scenario unstaked", () => {
    const p = samplePlan();
    p.result.rows.forEach((r, i) => {
      if (i === p.givenUp) expect(r.stake).toBe(0);
      else expect(r.stake).toBeGreaterThan(0);
    });
  });

  it("returns combos whose legs all come from the sample games", () => {
    const now = new Date(2026, 9, 31, 9, 0).getTime();
    const { games, results } = sampleScan(now);
    const ids = new Set(games.map((g) => g.id));
    expect(results.length).toBeLessThanOrEqual(4);
    for (const r of results) for (const l of r.legs) expect(ids.has(l.gameId)).toBe(true);
  });
});
