import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRightLeft, Database, Gauge, Layers, LineChart as LineIcon, Percent, Trophy } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BOOKMAKERS,
  DEMO_SETTLED_BETS,
  bookName,
  generateLeagueFixtures,
  type BookId,
  type Game,
} from "@/lib/odds-feed";
import { freshGames, margin, patternsFor, scenariosFor } from "@/lib/scanner";
import { POOL_SIZE, expectedVsActual, rankMargins, structureLadder, valueRanking, type PoolItem, type ValueRow } from "@/lib/edge";
import { CACHE_MS, loadScannerState, type ScanSnapshot } from "@/lib/scanner-store";
import { sendToCalculator } from "@/lib/calculator-plans";
import { EVENT_LETTERS } from "@/lib/calculator";
import { fmtDay, hhmm, money, outcomeText } from "@/components/scanner/ComboCard";

const ALL_BOOKS = BOOKMAKERS.map((b) => b.id);
const DEMO_LEAGUES = ["epl", "laliga", "seriea", "bundesliga"];
const SHOW = 40;
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;
const ago = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

export function Edge() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [scan, setScan] = useState<ScanSnapshot | null>(null);
  const [mode, setMode] = useState<"best" | "book">("best");
  const [book, setBook] = useState<BookId>("1xbet");
  const [useWindow, setUseWindow] = useState(false);
  const [from, setFrom] = useState("12:00");
  const [to, setTo] = useState("22:00");
  const [legs, setLegs] = useState(2);
  const [minProfit, setMinProfit] = useState("0");
  const [pattern, setPattern] = useState("any");
  const [picked, setPicked] = useState<string[] | null>(null);

  useEffect(() => {
    setScan(loadScannerState().scan);
    setNow(Date.now());
    setReady(true);
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const loadDemo = () => {
    const t = Date.now();
    setScan({
      source: "demo",
      key: "edge-demo",
      label: "Demo odds · 4 leagues",
      fetchedAt: t,
      games: DEMO_LEAGUES.flatMap((id) => generateLeagueFixtures(id, t, "demo")).sort((a, b) => a.kickoff - b.kickoff),
    });
    setNow(t);
    setPicked(null);
  };

  const data = useMemo(() => {
    if (!scan || !now) return null;
    const fresh = freshGames(scan.games, now, ALL_BOOKS);
    const games = useWindow
      ? fresh.games.filter((g) => {
          const t = hhmm(g.kickoff);
          return (!from || t >= from) && (!to || t <= to);
        })
      : fresh.games;
    const ranked = rankMargins(games, mode, book);
    return { fresh, games, ranked, pool: ranked.slice(0, POOL_SIZE) };
  }, [scan, now, useWindow, from, to, mode, book]);

  const gamesById = useMemo(() => new Map((scan?.games ?? []).map((g) => [g.id, g])), [scan]);
  const floor = Number(minProfit) || 0;
  const values = useMemo(
    () => (data ? valueRanking(data.pool, legs, floor, pattern) : []),
    [data, legs, floor, pattern],
  );
  const ladderItems = useMemo(() => {
    if (!data) return [];
    const ids = picked ?? data.pool.slice(0, 4).map((p) => p.game.id);
    return data.pool.filter((p) => ids.includes(p.game.id)).slice(0, 4);
  }, [data, picked]);
  const ladder = useMemo(() => structureLadder(ladderItems, floor), [ladderItems, floor]);
  const history = useMemo(() => expectedVsActual(DEMO_SETTLED_BETS), []);

  const load = (row: ValueRow) => {
    sendToCalculator({
      source: "Edge",
      excluded: row.excluded,
      events: row.items.map((it) => {
        const g = gamesById.get(it.game.id);
        return {
          name: g?.home ?? "",
          matchup: g ? `${g.home} vs ${g.away}` : "",
          W: it.leg.odds.W.toFixed(2),
          D: it.leg.odds.D.toFixed(2),
          L: it.leg.odds.L.toFixed(2),
        };
      }),
    });
    navigate({ to: "/calculator" });
  };

  return (
    <main className="mx-auto max-w-[1600px] space-y-3 px-2 py-3 sm:px-3">
      {/* Shared data bar */}
      <section className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 bg-gradient-header px-4 py-3 text-header-foreground">
          <div className="mr-auto">
            <h1 className="font-display text-xl font-black uppercase italic tracking-tight">
              <span className="text-cta">Edge</span> · what is it actually worth
            </h1>
            <p className="text-xs text-header-muted">
              A free second opinion on the Scanner's odds. Reads its last scan and never fetches prices itself.
            </p>
          </div>
          <button onClick={loadDemo} className="btn-ghost-header h-9 px-3 text-xs">
            <Database className="h-4 w-4" /> Load demo odds
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 text-xs">
          <span className="text-muted-foreground">
            Source:{" "}
            <b className="text-foreground">
              {scan ? (scan.source === "demo" ? scan.label : `Scanner · ${scan.label}`) : ready ? "nothing cached yet" : "…"}
            </b>
            {scan && now > 0 && (
              <>
                {" "}
                · {scan.games.length} games · {ago(now - scan.fetchedAt)}
                {now - scan.fetchedAt > CACHE_MS && <span className="text-destructive"> (old — rescan in the Scanner)</span>}
              </>
            )}
          </span>
          <div className="flex rounded-md bg-muted p-0.5">
            {(["best", "book"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`h-7 rounded px-2.5 text-[11px] font-bold uppercase ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:bg-card"
                }`}
              >
                {m === "best" ? "Best across books" : "One bookmaker"}
              </button>
            ))}
          </div>
          {mode === "book" && (
            <Select value={book} onValueChange={(v) => setBook(v as BookId)}>
              <SelectTrigger className="h-8 w-36 bg-card text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOKMAKERS.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <label className="flex items-center gap-2 font-semibold text-secondary-foreground">
            <Checkbox checked={useWindow} onCheckedChange={(c) => setUseWindow(c === true)} />
            Kickoff window
          </label>
          {(["from", "to"] as const).map((k) => (
            <input
              key={k}
              type="time"
              aria-label={k === "from" ? "Window from" : "Window to"}
              disabled={!useWindow}
              value={k === "from" ? from : to}
              onChange={(e) => (k === "from" ? setFrom : setTo)(e.target.value)}
              className="h-8 rounded-md border border-input bg-card px-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          ))}
          {data && (
            <span className="ml-auto text-muted-foreground">
              Pool: <b className="text-foreground">{data.pool.length}</b> tightest of {data.ranked.length} markets
              {data.fresh.started + data.fresh.stale > 0 && (
                <> · ignored {data.fresh.started} started, {data.fresh.stale} stale</>
              )}
            </span>
          )}
        </div>
      </section>

      <Tabs defaultValue="value" className="space-y-3">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-card p-1 shadow-card">
          <Tab value="value" icon={Trophy} label="Value ranking" />
          <Tab value="ladder" icon={Layers} label="Structure ladder" />
          <Tab value="margins" icon={Percent} label="Market margins" />
          <Tab value="actual" icon={LineIcon} label="Expected vs actual" />
        </TabsList>

        {/* Value ranking */}
        <TabsContent value="value" className="mt-0">
          <NeedsData data={data} onDemo={loadDemo} ready={ready}>
            <Panel
              title={`Value ranking · ${values.length}`}
              hint="Expected return per K100 staked, at fair (margin-free) chances. Ties go to the combo that lands more often."
            >
              <div className="flex flex-wrap items-end gap-3 border-b px-3 py-2.5">
                <Labeled label="Legs">
                  <div className="flex rounded-md bg-muted p-0.5">
                    {[2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setLegs(n);
                          setPattern("any");
                        }}
                        className={`h-8 w-10 rounded text-xs font-bold ${legs === n ? "bg-primary text-primary-foreground" : "hover:bg-card"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Labeled>
                <Labeled label="Profit floor %">
                  <input
                    inputMode="decimal"
                    value={minProfit}
                    onChange={(e) => setMinProfit(e.target.value.replace(/[^0-9.-]/g, ""))}
                    className="h-9 w-24 rounded-md border border-input bg-card px-2 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                  />
                </Labeled>
                <Labeled label="Uncovered scenario">
                  <Select value={pattern} onValueChange={setPattern}>
                    <SelectTrigger className="h-9 w-32 bg-card text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="any">Any</SelectItem>
                      {patternsFor(legs).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Labeled>
              </div>
              {values.length === 0 ? (
                <Empty>No combos clear a {floor}% floor in this pool. Try a lower floor or another pattern.</Empty>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-[12px]">
                    <thead className="bg-panel-head text-[10px] font-bold uppercase text-secondary-foreground">
                      <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                        <th>#</th>
                        <th>Games</th>
                        <th>Uncovered</th>
                        <th className="text-right">Profit if covered</th>
                        <th className="text-right">Lands</th>
                        <th className="text-right">EV per K100</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {values.slice(0, SHOW).map((v, i) => (
                        <ValueRowView key={v.id} rank={i + 1} row={v} games={gamesById} onLoad={load} />
                      ))}
                    </tbody>
                  </table>
                  {values.length > SHOW && (
                    <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
                      Showing the top {SHOW} of {values.length}.
                    </p>
                  )}
                </div>
              )}
            </Panel>
          </NeedsData>
        </TabsContent>

        {/* Structure ladder */}
        <TabsContent value="ladder" className="mt-0">
          <NeedsData data={data} onDemo={loadDemo} ready={ready}>
            <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
              <Panel title="Games on the ladder" hint="Pick up to 4 from the pool.">
                <div className="space-y-0.5 p-2">
                  {data?.pool.map((p) => {
                    const g = gamesById.get(p.game.id);
                    const on = ladderItems.some((x) => x.game.id === p.game.id);
                    const ids = ladderItems.map((x) => x.game.id);
                    return (
                      <label key={p.game.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-muted">
                        <Checkbox
                          checked={on}
                          disabled={!on && ids.length >= 4}
                          onCheckedChange={(c) => setPicked(c ? [...ids, p.game.id] : ids.filter((x) => x !== p.game.id))}
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{g ? `${g.home} – ${g.away}` : p.game.id}</span>
                        <span className="tabular-nums text-muted-foreground">{pct(p.margin)}</span>
                      </label>
                    );
                  })}
                </div>
              </Panel>
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {ladder.length === 0 && <Empty>Pick at least one game.</Empty>}
                {ladder.map((step) => (
                  <Panel key={step.legs} title={["Singles", "Doubles", "Trebles", "Quads"][step.legs - 1]!} hint={`${step.legs}-leg · ${3 ** step.legs} scenarios each`}>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 text-[12px]">
                      <Stat label="Combos" value={`${step.qualifying} / ${step.combos} qualify`} />
                      <Stat label="Avg profit if covered" value={`+${step.avgProfitPct.toFixed(2)}%`} />
                      <Stat label="Avg chance it lands" value={pct(step.avgCoverProb)} />
                      <Stat
                        label="Avg EV per K100"
                        value={step.qualifying ? money(step.avgEv) : "—"}
                        tone={step.avgEv >= 100 ? "up" : "down"}
                      />
                    </dl>
                    {step.best && (
                      <div className="border-t bg-muted/50 px-3 py-2 text-[11px]">
                        <p className="font-bold uppercase text-secondary-foreground">Best EV</p>
                        <p className="truncate font-semibold">
                          {step.best.items.map((it) => gamesById.get(it.game.id)?.home ?? "?").join(" / ")}
                        </p>
                        <p className="text-muted-foreground">
                          {step.best.full ? "Full cover" : `Leaves ${step.best.pattern} uncovered`} · {money(step.best.evPer100)} per K100
                        </p>
                        <button onClick={() => load(step.best!)} className="btn-cta mt-2 h-7 px-2 text-[11px]">
                          <ArrowRightLeft className="h-3 w-3" /> Load into Calculator
                        </button>
                      </div>
                    )}
                  </Panel>
                ))}
              </div>
            </div>
          </NeedsData>
        </TabsContent>

        {/* Market margins */}
        <TabsContent value="margins" className="mt-0">
          <NeedsData data={data} onDemo={loadDemo} ready={ready}>
            <Panel
              title={`Market margins · ${data?.ranked.length ?? 0}`}
              hint="The house edge on each game, tightest first. Lower margins are where the books are weakest."
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-[12px]">
                  <thead className="bg-panel-head text-[10px] font-bold uppercase text-secondary-foreground">
                    <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                      <th>#</th>
                      <th>Game</th>
                      <th>Kickoff</th>
                      <th className="text-right">{mode === "best" ? "Best across books" : bookName(book)}</th>
                      {BOOKMAKERS.map((b) => (
                        <th key={b.id} className="text-right">
                          {b.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.ranked.map((r, i) => (
                      <MarginRow key={r.game.id} rank={i + 1} item={r} game={gamesById.get(r.game.id)} inPool={i < POOL_SIZE} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </NeedsData>
        </TabsContent>

        {/* Expected vs actual */}
        <TabsContent value="actual" className="mt-0 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Tile label="Total staked" value={money(history.staked)} />
            <Tile label="Expected return" value={money(history.expected)} />
            <Tile label="Actual return" value={money(history.actual)} />
            <Tile
              label="Actual − expected"
              value={money(history.actual - history.expected)}
              tone={history.actual >= history.expected ? "up" : "down"}
            />
            <Tile label="Distance from the math" value={`${history.z >= 0 ? "+" : ""}${history.z.toFixed(2)} σ`} />
          </div>
          <p
            className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold shadow-card ${
              history.verdict === "tracking" ? "bg-card" : history.verdict === "ahead" ? "bg-up/10 text-up" : "bg-down/10 text-down"
            }`}
          >
            <Gauge className="h-4 w-4 shrink-0" />
            {history.verdict === "tracking"
              ? "Your results are within normal variance of what the odds said they were worth — no sign of a real edge or a misread yet."
              : history.verdict === "ahead"
                ? "You're running well above the math — either a real edge or a lucky streak. Keep tracking."
                : "You're running well below the math — check for misread markets or stale prices."}
          </p>
          <Panel title="Cumulative returns" hint="Sample settled-bet history.">
            <div className="h-72 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history.rows.map((r) => ({ date: r.date.slice(5), expected: Math.round(r.cumExpected), actual: Math.round(r.cumActual) }))}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={60} />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="expected" name="Expected" stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="var(--cta)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={`Settled bets · ${history.rows.length}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-[12px]">
                <thead className="bg-panel-head text-[10px] font-bold uppercase text-secondary-foreground">
                  <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                    <th>Date</th>
                    <th>Bet</th>
                    <th className="text-right">Stake</th>
                    <th className="text-right">Chance it lands</th>
                    <th className="text-right">Worth (expected)</th>
                    <th className="text-right">Returned</th>
                    <th className="text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.rows.map((r) => (
                    <tr key={r.id} className="[&>td]:px-3 [&>td]:py-1.5">
                      <td className="tabular-nums text-muted-foreground">{fmtDay(new Date(r.date).getTime())}</td>
                      <td className="font-semibold">
                        {r.title} <span className="text-[11px] font-normal text-muted-foreground">· {r.legs} legs</span>
                      </td>
                      <td className="text-right tabular-nums">{money(r.stake)}</td>
                      <td className="text-right tabular-nums">{pct(r.coverProb)}</td>
                      <td className="text-right tabular-nums">{money(r.expected)}</td>
                      <td className={`text-right font-bold tabular-nums ${r.won ? "text-up" : "text-down"}`}>{money(r.actual)}</td>
                      <td className={`text-right tabular-nums ${r.actual - r.expected >= 0 ? "text-up" : "text-down"}`}>
                        {money(r.actual - r.expected)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function ValueRowView({
  rank,
  row,
  games,
  onLoad,
}: {
  rank: number;
  row: ValueRow;
  games: Map<string, Game>;
  onLoad: (r: ValueRow) => void;
}) {
  const n = row.items.length;
  const sc = row.excluded === null ? null : scenariosFor(n)[row.excluded]!;
  const gs = row.items.map((it) => games.get(it.game.id));
  return (
    <tr className="align-top [&>td]:px-3 [&>td]:py-2 hover:bg-muted/40">
      <td className="font-bold tabular-nums text-muted-foreground">{rank}</td>
      <td>
        {row.items.map((it, k) => (
          <p key={it.game.id} className="truncate">
            <b className="text-primary">{EVENT_LETTERS[k]}</b> {gs[k] ? `${gs[k]!.home} – ${gs[k]!.away}` : it.game.id}{" "}
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {it.leg.odds.W.toFixed(2)} / {it.leg.odds.D.toFixed(2)} / {it.leg.odds.L.toFixed(2)}
            </span>
          </p>
        ))}
      </td>
      <td className="max-w-56">
        {sc ? (
          <>
            <b>{sc.join("+")}</b>
            <p className="truncate text-[11px] text-muted-foreground">{sc.map((o, k) => outcomeText(gs[k], o)).join(" + ")}</p>
          </>
        ) : (
          <span className="rounded bg-cta px-1.5 py-0.5 text-[10px] font-bold uppercase text-cta-foreground">Full cover</span>
        )}
      </td>
      <td className="text-right font-semibold tabular-nums">+{row.profitPct.toFixed(2)}%</td>
      <td className="text-right tabular-nums">{pct(row.coverProb)}</td>
      <td className={`text-right font-display text-base font-black tabular-nums ${row.evPer100 >= 100 ? "text-up" : "text-down"}`}>
        {money(row.evPer100)}
      </td>
      <td className="text-right">
        <button onClick={() => onLoad(row)} className="btn-cta h-7 px-2 text-[11px]" aria-label={`Load combo ${rank} into Calculator`}>
          <ArrowRightLeft className="h-3 w-3" /> Load
        </button>
      </td>
    </tr>
  );
}

function MarginRow({ rank, item, game, inPool }: { rank: number; item: PoolItem; game: Game | undefined; inPool: boolean }) {
  return (
    <tr className={`[&>td]:px-3 [&>td]:py-1.5 ${inPool ? "" : "text-muted-foreground"}`}>
      <td className="tabular-nums">{rank}</td>
      <td className="font-semibold">
        {game ? `${game.home} – ${game.away}` : item.game.id}
        {game && <span className="ml-1 text-[11px] font-normal text-muted-foreground">{game.flag} {game.league}</span>}
        {inPool && (
          <span className="ml-2 rounded bg-primary/10 px-1.5 py-px text-[9px] font-bold uppercase text-primary">Pool</span>
        )}
      </td>
      <td className="tabular-nums">
        {fmtDay(item.game.kickoff)} {hhmm(item.game.kickoff)}
      </td>
      <td className={`text-right font-bold tabular-nums ${item.margin < 0 ? "text-up" : ""}`}>{pct(item.margin, 2)}</td>
      {BOOKMAKERS.map((b) => {
        const q = item.game.quotes[b.id];
        return (
          <td key={b.id} className="text-right tabular-nums">
            {q ? pct(margin(q), 2) : "—"}
          </td>
        );
      })}
    </tr>
  );
}

function NeedsData({
  data,
  ready,
  onDemo,
  children,
}: {
  data: unknown;
  ready: boolean;
  onDemo: () => void;
  children: React.ReactNode;
}) {
  if (data) return <>{children}</>;
  return (
    <div className="rounded-md bg-card px-6 py-14 text-center shadow-card">
      <Database className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-3 font-display text-lg font-bold uppercase">No odds to read yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Edge reads the Scanner's last scan. Run a scan there, or load the demo odds to look around.
      </p>
      <button onClick={onDemo} disabled={!ready} className="btn-cta mx-auto mt-4 h-10 px-5 text-sm">
        <Database className="h-4 w-4" /> Load demo odds
      </button>
    </div>
  );
}

function Tab({ value, icon: Icon, label }: { value: string; icon: typeof Trophy; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="gap-1.5 px-3 py-2 text-xs font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </TabsTrigger>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-md bg-card shadow-card">
      <div className="flex flex-wrap items-baseline gap-x-2 bg-panel-head px-3 py-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">{title}</h2>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="block text-[11px] font-bold uppercase text-secondary-foreground">{label}</span>
      {children}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase text-muted-foreground">{label}</dt>
      <dd className={`font-bold tabular-nums ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`}>{value}</dd>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-md bg-card px-3 py-2.5 shadow-card">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className={`font-display text-xl font-black tabular-nums ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
