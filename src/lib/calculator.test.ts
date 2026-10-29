import { describe, expect, it } from "vitest";
import {
  applyCoverPlan,
  bestCoverPlan,
  balanceProfitStakes,
  balanceWinStakes,
  buildScenarios,
  computeRows,
  coverPlans,
  deriveScenarioOdds,
  findExposure,
  maxWin,
  multiplier,
  scenarioLabel,
  turboBalanceStakes,
  type CalcRow,
} from "./calculator";

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;
const rows = (odds: number[], extra: Partial<CalcRow>[] = []): CalcRow[] =>
  odds.map((o, i) => ({ stake: 0, odds: o, ...extra[i] }));

describe("scenarios", () => {
  it("builds 3, 9, 27, 81 rows with the last event cycling fastest", () => {
    expect([1, 2, 3, 4].map((n) => buildScenarios(n).length)).toEqual([3, 9, 27, 81]);
    expect(buildScenarios(2).map(scenarioLabel)).toEqual([
      "AW+BW",
      "AW+BD",
      "AW+BL",
      "AD+BW",
      "AD+BD",
      "AD+BL",
      "AL+BW",
      "AL+BD",
      "AL+BL",
    ]);
  });

  it("multiplies each event's outcome odds", () => {
    const odds = deriveScenarioOdds(
      [
        { W: 2, D: 3.5, L: 4 },
        { W: 1.5, D: 3.5, L: 6 },
      ],
      buildScenarios(2),
    );
    expect(odds[1]).toBe(7); // AW+BD = 2.00 × 3.50
    expect(deriveScenarioOdds([{ W: 2, D: 0, L: 4 }], buildScenarios(1))).toEqual([2, 0, 4]);
  });
});

describe("computeRows", () => {
  it("taxes only the winnings and measures profit against the total staked", () => {
    const {
      rows: r,
      totalStaked,
      remaining,
    } = computeRows(
      [
        { stake: 100, odds: 2 },
        { stake: 50, odds: 4 },
        { stake: 0, odds: 3 },
      ],
      200,
      0.2,
    );
    expect(totalStaked).toBe(150);
    expect(remaining).toBe(50);
    expect(r[0]!.net).toBe(180); // 200 − (200 − 100) × 0.2
    expect(r[0]!.profit).toBe(30);
    expect(r[0]!.profitPct).toBe(15); // of the 200 budget
    expect(r[1]!.net).toBe(170);
    expect(r[2]!.covered).toBe(false);
  });

  it("gives the exact extra stake to break even and whether the budget allows it", () => {
    const { rows: r } = computeRows(
      [
        { stake: 100, odds: 2 },
        { stake: 0, odds: 3 },
      ],
      200,
      0,
    );
    // x × 3 ≥ 100 + x → x = 50
    expect(r[1]!.minToCover).toBe(50);
    expect(r[1]!.canAffordCover).toBe(true);
    const tight = computeRows(
      [
        { stake: 100, odds: 2 },
        { stake: 0, odds: 3 },
      ],
      120,
      0,
    );
    expect(tight.rows[1]!.canAffordCover).toBe(false);
  });
});

describe("filling stakes", () => {
  it("Balance uses the full budget and gives every row the same net payout", () => {
    const r = rows([2.45, 2.9, 3.6]);
    const stakes = balanceProfitStakes(r, 1000, 0.1);
    expect(sum(stakes)).toBe(1000);
    const nets = stakes.map((s, i) => s * multiplier(r[i]!.odds, 0.1));
    expect(Math.max(...nets) - Math.min(...nets)).toBeLessThan(0.1);
  });

  it("Balance skips excluded rows", () => {
    const stakes = balanceProfitStakes(rows([2, 3, 4], [{}, { excluded: true }]), 100, 0);
    expect(stakes[1]).toBe(0);
    expect(sum(stakes)).toBe(100);
  });

  it("Balance win stakes win ÷ odds rounded up so every return reaches the target", () => {
    expect(balanceWinStakes(rows([2, 3, 7]), 100)).toEqual([50, 33.34, 14.29]);
  });

  it("max win is budget ÷ Σ1/odds, floored to the cent (OctoOdds' formula)", () => {
    const r = rows([2, 3, 7]);
    const w = maxWin(r, 100);
    expect(w).toBe(Math.floor((100 / (1 / 2 + 1 / 3 + 1 / 7)) * 100) / 100);
    // Stakes are rounded up per row, so at the cap they overshoot by cents at most.
    expect(sum(balanceWinStakes(r, w))).toBeLessThanOrEqual(100.03);
    expect(maxWin(rows([2, 3, 7], [{ excluded: true }]), 100)).toBeGreaterThan(w);
  });

  it("Turbo gives unlikely rows their money back and dutches the rest", () => {
    const r = rows([1.5, 4, 8], [{}, {}, { unlikely: true }]);
    const { stakes, error } = turboBalanceStakes(r, 100, 0);
    expect(error).toBeNull();
    expect(sum(stakes)).toBe(100);
    expect(stakes[2]).toBe(12.5); // 12.50 × 8 = 100 back
    expect(stakes[0]! * 1.5).toBeCloseTo(stakes[1]! * 4, 0);
  });

  it("Turbo refuses when every row is unlikely", () => {
    const r = rows([2, 3], [{ unlikely: true }, { unlikely: true }]);
    expect(turboBalanceStakes(r, 100, 0).error).not.toBeNull();
  });
});

describe("give-up plans and exposure", () => {
  it("lists give up nothing first, then each scenario; the favourite frees the most profit", () => {
    const plans = coverPlans(rows([1.4, 4.5, 8]), 100, 0);
    expect(plans.map((p) => p.index)).toEqual([null, 0, 1, 2]);
    const S = 1 / 1.4 + 1 / 4.5 + 1 / 8;
    expect(plans[0]!.profit).toBeCloseTo(100 / S - 100, 9);
    expect(plans[1]!.profit).toBeCloseTo(100 / (S - 1 / 1.4) - 100, 9);
    expect(plans[1]!.coveredCount).toBe(2);
    expect(bestCoverPlan(plans)!.index).toBe(0);
  });

  it("ignores the Exclude ticks, like OctoOdds — picking a plan is what sets them", () => {
    const r = rows([1.4, 4.5, 8]);
    const ticked = rows([1.4, 4.5, 8], [{ excluded: true }]);
    expect(coverPlans(ticked, 100, 0)).toEqual(coverPlans(r, 100, 0));
  });

  it("applying a give-up excludes that row, so Max win stops counting it", () => {
    const r = rows([2.0, 3.4, 4.0, 3.1, 3.3, 3.6, 2.6, 3.5, 7.0]);
    const before = maxWin(r, 100);
    const plan = bestCoverPlan(coverPlans(r, 100, 0))!;
    const { excluded, stakes } = applyCoverPlan(r, 100, 0, plan.index);
    expect(excluded.filter(Boolean)).toHaveLength(1);
    expect(excluded[plan.index!]).toBe(true);
    expect(stakes[plan.index!]).toBe(0);
    expect(sum(stakes)).toBe(100);
    const after = maxWin(
      r.map((x, i) => ({ ...x, excluded: excluded[i] === true })),
      100,
    );
    const invRest = r.reduce((a, x, i) => (i === plan.index ? a : a + 1 / x.odds), 0);
    expect(after).toBeGreaterThan(before);
    expect(after).toBeCloseTo(100 / invRest, 1);
  });

  it("flags names already used in other open plans", () => {
    const hits = findExposure(
      ["Arsenal", " chelsea", ""],
      [{ id: "1", title: "Weekend", names: ["Chelsea", "Inter"] }],
    );
    expect(hits).toEqual([{ name: "chelsea", plans: ["Weekend"] }]);
  });
});
