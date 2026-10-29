import { describe, expect, it } from "vitest";
import type { SavedPlan } from "./calculator-plans";
import {
  DAY_MS,
  LOST,
  aggregateByTeam,
  betOutcome,
  computeBet,
  filterPeriod,
  resetBet,
  scenarioName,
  scenarioNetPayout,
  settleBet,
  summarize,
  toCsv,
} from "./bets";

const NOW = Date.UTC(2026, 9, 25, 12);

function bet(p: Partial<SavedPlan> & { stakes: string[]; odds: number[] }): SavedPlan {
  const { stakes, ...rest } = p;
  return {
    id: "b",
    createdAt: NOW,
    title: "Arsenal",
    eventCount: 1,
    events: [{ name: "Arsenal", matchup: "Arsenal vs Chelsea", W: "", D: "", L: "" }],
    rows: stakes.map((s, i) => ({
      stake: s,
      odds: String(rest.odds[i] ?? ""),
      excluded: false,
      unlikely: false,
    })),
    budget: "",
    tax: "0",
    status: "Pending",
    wonScenario: null,
    settledAt: null,
    ...rest,
  };
}

describe("bet results", () => {
  it("taxes winnings only: K100 at 3.00 with 15% tax nets K270", () => {
    expect(scenarioNetPayout(100, 3, 0.15)).toBeCloseTo(270);
  });

  it("is pending until a scenario is chosen", () => {
    expect(betOutcome(bet({ stakes: ["100", "100", "100"], odds: [2, 3, 4] }))).toBe("pending");
  });

  it("net profit = winner's payout minus everything staked", () => {
    const b = bet({ stakes: ["100", "50", "0"], odds: [2.5, 3, 4], wonScenario: 0 });
    const f = computeBet(b);
    expect(f.totalStaked).toBe(150);
    expect(f.returned).toBe(250);
    expect(f.net).toBe(100);
    expect(betOutcome(b)).toBe("won");
  });

  it("a winning scenario that doesn't cover the total staked is a loss", () => {
    const b = bet({ stakes: ["100", "100", "100"], odds: [2, 3, 4], wonScenario: 0 });
    expect(computeBet(b).net).toBe(-100);
    expect(betOutcome(b)).toBe("lost");
  });

  it("marked lost returns nothing and loses the whole stake", () => {
    const b = bet({ stakes: ["100", "100", "0"], odds: [2, 3, 4], wonScenario: LOST });
    expect(computeBet(b).net).toBe(-200);
    expect(betOutcome(b)).toBe("lost");
  });

  it("net of exactly zero is break-even", () => {
    expect(
      betOutcome(bet({ stakes: ["100", "100", "0"], odds: [2, 3.4, 4], wonScenario: 0 })),
    ).toBe("breakeven");
  });

  it("settling with corrected stakes/odds uses the corrected figures; reset makes it pending", () => {
    const b = bet({ stakes: ["100", "100", "0"], odds: [2, 3, 4] });
    const s = settleBet(
      b,
      1,
      [
        { stake: "100", odds: 2 },
        { stake: "120", odds: 3.1 },
        { stake: "0", odds: 4 },
      ],
      NOW,
    );
    expect(computeBet(s).returned).toBe(372);
    expect(computeBet(s).net).toBe(152);
    expect(s.settledAt).toBe(NOW);
    expect(betOutcome(resetBet(s))).toBe("pending");
  });

  it("names scenarios by team and outcome", () => {
    const b = bet({
      stakes: Array(9).fill("1"),
      odds: Array(9).fill(2),
      eventCount: 2,
      events: [
        { name: "Arsenal", matchup: "", W: "", D: "", L: "" },
        { name: "Chelsea", matchup: "", W: "", D: "", L: "" },
      ],
    });
    expect(scenarioName(b, 2)).toBe("Arsenal W + Chelsea L");
  });
});

describe("stats", () => {
  const won = bet({ id: "w", stakes: ["100", "0", "0"], odds: [3, 3, 3], wonScenario: 0 }); // +200
  const lost = bet({ id: "l", stakes: ["100", "0", "0"], odds: [3, 3, 3], wonScenario: LOST }); // -100
  const even = bet({ id: "e", stakes: ["100", "100", "0"], odds: [2, 3, 3], wonScenario: 0 }); // 0
  const pend = bet({ id: "p", stakes: ["300", "0", "0"], odds: [3, 3, 3] });

  it("ROI uses settled stakes only and pending stake is exposure", () => {
    const s = summarize([won, lost, even, pend]);
    expect(s.staked).toBe(700);
    expect(s.settledStaked).toBe(400);
    expect(s.net).toBe(100);
    expect(s.roi).toBeCloseTo(0.25);
    expect(s.pendingExposure).toBe(300);
  });

  it("win rate leaves break-even bets out", () => {
    expect(summarize([won, lost, even, pend]).winRate).toBe(0.5);
  });

  it("filters by period from the saved date", () => {
    const old = { ...won, id: "old", createdAt: NOW - 40 * DAY_MS };
    expect(filterPeriod([won, old], 30, NOW).map((b) => b.id)).toEqual(["w"]);
    expect(filterPeriod([won, old], "all", NOW)).toHaveLength(2);
  });

  it("counts a bet in full for every team named on it", () => {
    const rows = aggregateByTeam([won, lost]);
    const arsenal = rows.find((r) => r.team === "Arsenal")!;
    const chelsea = rows.find((r) => r.team === "Chelsea")!;
    expect(arsenal.bets).toBe(2);
    expect(arsenal.net).toBe(100);
    expect(chelsea.net).toBe(100);
  });

  it("exports one CSV line per bet", () => {
    const csv = toCsv([won, pend]).split("\n");
    expect(csv).toHaveLength(3);
    expect(csv[0]).toBe("Date,Bet,Teams,Invested,Returned,Net,Result,Winning scenario");
  });
});
