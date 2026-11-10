import { describe, expect, it } from "vitest";
import { leagueFlag, normalizeEvents, sportOfLeague, toFeedGames } from "./live-odds";

const event = (markets: { key: string; outcomes: { name: string; price: number }[] }[]) => ({
  id: "e1",
  home_team: "Home",
  away_team: "Away",
  commence_time: "2026-11-10T19:00:00Z",
  bookmakers: [{ key: "bk", title: "Book", markets }],
});

describe("normalizeEvents", () => {
  it("prefers the explicit 3-way market over a 2-way h2h", () => {
    const [g] = normalizeEvents([
      event([
        {
          key: "h2h",
          outcomes: [
            { name: "Home", price: 1.6 },
            { name: "Away", price: 2.4 },
          ],
        },
        {
          key: "h2h_3_way",
          outcomes: [
            { name: "Home", price: 2.1 },
            { name: "Draw", price: 4.2 },
            { name: "Away", price: 2.9 },
          ],
        },
      ]),
    ]);
    expect(g!.books[0]).toMatchObject({ W: 2.1, D: 4.2, L: 2.9 });
  });

  it("drops a 2-way h2h with no draw", () => {
    const games = normalizeEvents([
      event([
        {
          key: "h2h",
          outcomes: [
            { name: "Home", price: 1.6 },
            { name: "Away", price: 2.4 },
          ],
        },
      ]),
    ]);
    expect(games).toEqual([]);
  });

  it("keeps an h2h that carries a draw (football, rugby)", () => {
    const [g] = normalizeEvents([
      event([
        {
          key: "h2h",
          outcomes: [
            { name: "Home", price: 2.0 },
            { name: "Draw", price: 3.5 },
            { name: "Away", price: 3.8 },
          ],
        },
      ]),
    ]);
    expect(g!.books[0]).toMatchObject({ W: 2.0, D: 3.5, L: 3.8 });
  });
});

describe("sports", () => {
  it("maps league keys to their 3-way sport", () => {
    expect(sportOfLeague("soccer_epl")?.id).toBe("soccer");
    expect(sportOfLeague("icehockey_nhl")?.id).toBe("icehockey");
    expect(sportOfLeague("rugbyleague_nrl")?.id).toBe("rugbyleague");
    expect(sportOfLeague("basketball_nba")).toBeUndefined();
    expect(sportOfLeague("tennis_atp_paris")).toBeUndefined();
  });

  it("flags converted games by sport", () => {
    expect(leagueFlag("icehockey_nhl")).toBe("🏒");
    const [g] = toFeedGames(
      normalizeEvents([
        event([
          {
            key: "h2h_3_way",
            outcomes: [
              { name: "Home", price: 2.1 },
              { name: "Draw", price: 4.2 },
              { name: "Away", price: 2.9 },
            ],
          },
        ]),
      ]),
      { key: "icehockey_nhl", title: "NHL" },
      1,
    ).games;
    expect(g!.flag).toBe("🏒");
  });
});
