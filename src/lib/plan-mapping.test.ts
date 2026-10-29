import { describe, expect, it } from "vitest";
import { betToPlan, LOST_NAME, planToBet, wonScenarioName, type BetRecord } from "./plan-mapping";
import { defaultTab, type SavedPlan } from "./calculator-plans";
import { LOST } from "./bets";

const plan = (): SavedPlan => {
  const tab = defaultTab(2);
  tab.events = [
    { name: "Arsenal", matchup: "Arsenal vs Chelsea", W: "2.00", D: "3.40", L: "4.00" },
    { name: "Inter", matchup: "Inter vs Napoli", W: "2.10", D: "3.20", L: "3.70" },
  ];
  const odds = [4.2, 6.72, 7.77, 7.14, 10.88, 12.58, 8.4, 12.8, 14.8];
  tab.rows = tab.rows.map((r, i) => ({
    ...r,
    stake: i === 8 ? "" : "10.50",
    odds: String(odds[i]),
    excluded: i === 8,
    unlikely: i === 0,
  }));
  return {
    id: "x",
    createdAt: 0,
    title: "Arsenal / Inter",
    eventCount: 2,
    events: tab.events,
    rows: tab.rows,
    odds,
    budget: "1000",
    tax: "15",
    status: "Pending",
    wonScenario: null,
    settledAt: null,
  };
};

const record = (
  write: ReturnType<typeof planToBet>,
  extra: Partial<BetRecord> = {},
): BetRecord => ({
  id: "db-1",
  user_id: "u",
  created_at: "2026-10-01T10:00:00.000Z",
  won_scenario: null,
  settled_at: null,
  ...write,
  ...extra,
});

describe("planToBet", () => {
  it("writes OctoOdds row names, a tax rate and per-event odds and games", () => {
    const b = planToBet(plan());
    expect(b.rows.map((r) => r.name).slice(0, 3)).toEqual(["AW + BW", "AW + BD", "AW + BL"]);
    expect(b.tax).toBeCloseTo(0.15);
    expect(b.target_stake).toBe(1000);
    expect(b.rows[8]).toMatchObject({ stake: "0", excluded: true });
    expect(b.rows[0]).toMatchObject({ stake: "10.5", odds: "4.2", unlikely: true });
    expect(b.team_names).toEqual(["Arsenal", "Inter"]);
    expect(b.outcome_odds?.[1]).toEqual({ W: "2.10", D: "3.20", L: "3.70" });
    expect(b.games).toEqual([
      { home: "Arsenal", away: "Chelsea" },
      { home: "Inter", away: "Napoli" },
    ]);
  });

  it("drops games unless every event has a matchup", () => {
    const p = plan();
    p.events[1] = { ...p.events[1]!, matchup: "" };
    expect(planToBet(p).games).toBeNull();
  });
});

describe("betToPlan", () => {
  it("round-trips a plan", () => {
    const back = betToPlan(record(planToBet(plan())));
    const p = plan();
    expect(back.id).toBe("db-1");
    expect(back.events).toEqual(p.events);
    expect(back.rows).toEqual(p.rows);
    expect(back.odds).toEqual(p.odds);
    expect(back.tax).toBe("15");
    expect(back.budget).toBe("1000");
    expect(back.status).toBe("Pending");
  });

  it("maps won_scenario names, LOST, and unknown names", () => {
    const w = planToBet(plan());
    expect(
      betToPlan(record(w, { won_scenario: "AD + BL", settled_at: "2026-10-02T00:00:00Z" }))
        .wonScenario,
    ).toBe(5);
    const lost = betToPlan(
      record(w, { won_scenario: LOST_NAME, settled_at: "2026-10-02T00:00:00Z" }),
    );
    expect(lost.wonScenario).toBe(LOST);
    expect(lost.status).toBe("Settled");
    const unknown = betToPlan(
      record(w, { won_scenario: "ZZ", settled_at: "2026-10-02T00:00:00Z" }),
    );
    expect(unknown).toMatchObject({ wonScenario: null, status: "Pending", settledAt: null });
  });

  it("writes won_scenario as the row name, __LOST__ or null", () => {
    const p = plan();
    expect(wonScenarioName(p)).toBeNull();
    expect(wonScenarioName({ ...p, wonScenario: 5 })).toBe("AD + BL");
    expect(wonScenarioName({ ...p, wonScenario: LOST })).toBe(LOST_NAME);
    const back = betToPlan(
      record(planToBet(p), { won_scenario: wonScenarioName({ ...p, wonScenario: 5 }) }),
    );
    expect(back.wonScenario).toBe(5);
  });

  it("reads a bet saved by OctoOdds (no outcome_odds, games or unlikely)", () => {
    const p = betToPlan({
      id: "o",
      user_id: "u",
      title: null,
      team_count: 1,
      tax: 0,
      target_stake: 100,
      rows: [
        { name: "AW", stake: "50", odds: "2" },
        { name: "AD", stake: "30", odds: "3.4" },
        { name: "AL", stake: "0", odds: "4.2", excluded: true },
      ],
      team_names: ["Arsenal"],
      outcome_odds: null,
      games: null,
      won_scenario: null,
      settled_at: null,
      created_at: "2026-10-01T10:00:00.000Z",
    });
    expect(p.title).toBe("Arsenal");
    expect(p.odds).toEqual([2, 3.4, 4.2]);
    expect(p.rows.map((r) => r.stake)).toEqual(["50.00", "30.00", ""]);
    expect(p.rows[2]!.excluded).toBe(true);
    expect(p.events[0]).toMatchObject({
      name: "Arsenal",
      W: "2.00",
      D: "3.40",
      L: "4.20",
      matchup: "",
    });
  });
});
