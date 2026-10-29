import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronDown,
  Database,
  Loader2,
  RefreshCw,
  ScanSearch,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BOOKMAKERS,
  bookName,
  booksInGames,
  creditsPerLeague,
  dateKey,
  generateLeagueFixtures,
  parseDateKey,
  registerBookTitles,
  type Game,
  type Region,
} from "@/lib/odds-feed";
import {
  apiBookKey,
  apiIso,
  fetchLeagueOdds,
  fetchLeagues,
  fetchOddsConfigured,
  toFeedGames,
  type League,
} from "@/lib/live-odds";
import {
  filterByPattern,
  freshGames,
  patternsFor,
  scanCombos,
  singleGameArbs,
  sortResults,
  type ComboResult,
  type SortKey,
} from "@/lib/scanner";
import {
  CACHE_MS,
  defaultScannerState,
  loadScannerState,
  storeScanResults,
  storeScannerState,
  type ScanSnapshot,
  type ScannerState,
} from "@/lib/scanner-store";
import { sendToCalculator, type SavedPlan } from "@/lib/calculator-plans";
import { fetchPlans } from "@/lib/plans-db";
import { useAuth } from "@/lib/auth";
import { ComboCard, fmtDay, hhmm } from "./ComboCard";

const PAGE = 30;
/** A league scan keeps this many of the earliest fixtures. */
const MAX_GAMES = 40;
/** A date scan keeps a bigger pool than it combines, so the kickoff window picks from all of it. */
const MAX_DATE_POOL = 150;
/** ...and combines at most this many, shared fairly across leagues. */
const MAX_DATE_GAMES = 30;
/** The demo prices these sample leagues, with no API call. */
const DEMO_LEAGUES = ["epl", "laliga", "seriea", "bundesliga"];
const REGION_PARAM: Record<Region, string> = { eu: "eu", uk: "uk", both: "eu,uk" };

const ago = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

/**
 * Up to `limit` games spread evenly over leagues, one per league per pass, so
 * one early league can't evict every later one (adding leagues would otherwise
 * shrink the results). Returned in kickoff order.
 */
function allocateAcrossLeagues(games: Game[], limit: number): Game[] {
  const byLeague = new Map<string, Game[]>();
  for (const g of [...games].sort((a, b) => a.kickoff - b.kickoff)) {
    const q = byLeague.get(g.leagueId);
    if (q) q.push(g);
    else byLeague.set(g.leagueId, [g]);
  }
  const queues = [...byLeague.values()];
  const out: Game[] = [];
  while (out.length < limit && queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      if (out.length >= limit) break;
      const g = q.shift();
      if (g) out.push(g);
    }
  }
  return out.sort((a, b) => a.kickoff - b.kickoff);
}

export function Scanner() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const [s, setS] = useState<ScannerState>(defaultScannerState);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [shown, setShown] = useState(PAGE);
  // The key lives on the server; assume absent until it says otherwise so the
  // live controls never flash enabled.
  const [hasKey, setHasKey] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);

  useEffect(() => {
    const stored = loadScannerState();
    const today = dateKey(new Date());
    setS({ ...stored, date: !stored.date || stored.date < today ? today : stored.date });
    setNow(Date.now());
    setReady(true);
    const id = setInterval(() => setNow(Date.now()), 30000);
    fetchOddsConfigured()
      .then(setHasKey)
      .catch(() => setHasKey(false));
    // Saved bets, for the "already exposed" flag on each combo. A failure only
    // loses the warning, never the scan.
    fetchPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (ready) storeScannerState(s);
  }, [s, ready]);

  // The league list is free (no credits), but a token rotation must not
  // re-request it, so the token is read through a ref.
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const hasToken = !!token;
  useEffect(() => {
    if (!ready || !hasKey || !tokenRef.current) return;
    fetchLeagues(tokenRef.current)
      .then((ls) => {
        setLeagues(ls);
        setS((p) => {
          const valid = (k: string) => ls.some((l) => l.key === k);
          const kept = p.leagueIds.filter(valid);
          return {
            ...p,
            leagueId: valid(p.leagueId) ? p.leagueId : (ls[0]?.key ?? ""),
            // No valid prior selection — scan every in-season league by default.
            leagueIds: kept.length ? kept : ls.map((l) => l.key),
          };
        });
      })
      .catch((e: Error) => toast.error("Couldn't load leagues", { description: e.message }));
  }, [ready, hasKey, hasToken]);

  const set = (patch: Partial<ScannerState>) => {
    setS((p) => ({ ...p, ...patch }));
    setShown(PAGE);
  };
  const today = now ? dateKey(new Date(now)) : "";
  // Specific books if picked, otherwise every book the scan returned.
  const books = useMemo(
    () => (s.books.length ? s.books : booksInGames(s.scan?.games ?? [])),
    [s.books, s.scan],
  );
  const booksKey = books.join(",");
  const leagueTitle = (key: string) => leagues.find((l) => l.key === key)?.title ?? key;

  const computed = useMemo(() => {
    if (!s.scan || !now) return null;
    const allowed = booksKey.split(",");
    const fresh = freshGames(s.scan.games, now, allowed);
    let games = fresh.games;
    if (s.timeFrom || s.timeTo) {
      games = games.filter((g) => {
        const t = hhmm(g.kickoff);
        return (!s.timeFrom || t >= s.timeFrom) && (!s.timeTo || t <= s.timeTo);
      });
    }
    if (s.scan.source !== "date" && (s.rangeFrom || s.rangeTo)) {
      games = games.filter((g) => {
        const d = dateKey(new Date(g.kickoff));
        return (!s.rangeFrom || d >= s.rangeFrom) && (!s.rangeTo || d <= s.rangeTo);
      });
    }
    // The time window narrows the date pool first, then the cap is shared out.
    if (s.scan.source === "date") games = allocateAcrossLeagues(games, MAX_DATE_GAMES);
    const minProfitPct = Number(s.minProfit) || 0;
    const all = scanCombos(games, {
      combine: s.combine,
      minProfitPct,
      oddsSource: s.oddsSource,
      books: allowed,
    });
    const results = sortResults(filterByPattern(all, s.pattern), s.sort);
    const arbs: ComboResult[] =
      s.oddsSource === "best"
        ? singleGameArbs(games).map((a) => ({
            id: `arb:${a.gameId}`,
            legs: [a.leg],
            book: null,
            pattern: null,
            full: true,
            profitPct: a.profitPct,
            excluded: null,
            excludedProb: 0,
            payout: 1 + a.profitPct / 100,
          }))
        : [];
    return { fresh, games, results, arbs, guaranteed: results.filter((r) => r.full).length };
  }, [
    s.scan,
    s.timeFrom,
    s.timeTo,
    s.rangeFrom,
    s.rangeTo,
    s.minProfit,
    s.combine,
    s.oddsSource,
    s.pattern,
    s.sort,
    booksKey,
    now,
  ]);

  const gamesById = useMemo(() => new Map((s.scan?.games ?? []).map((g) => [g.id, g])), [s.scan]);

  // Keep the latest results per combine count so the Calculator's sidebar can
  // offer them under "My plans" without the user re-scanning.
  useEffect(() => {
    if (!computed || !s.scan) return;
    storeScanResults(s.scan, computed.results, {
      combine: s.combine,
      oddsSource: s.oddsSource,
      minProfit: Number(s.minProfit) || 0,
    });
  }, [computed, s.scan, s.combine, s.oddsSource, s.minProfit]);

  const bookParam = s.books.map(apiBookKey).join(",");
  const scanKey = `${
    s.mode === "league"
      ? `league:${s.leagueId}`
      : `date:${s.date}:${[...s.leagueIds].sort().join(",")}`
  }|${bookParam || s.region}`;
  const creditCost =
    (s.mode === "league" ? 1 : s.leagueIds.length) * creditsPerLeague(s.region, s.books);

  const commit = (scan: ScanSnapshot) => {
    registerBookTitles(scan.bookTitles);
    setS((p) => ({ ...p, scan, rangeFrom: "", rangeTo: "" }));
    setShown(PAGE);
    setNow(Date.now());
  };

  const scanDemo = () => {
    const t = Date.now();
    const games = DEMO_LEAGUES.flatMap((id) => generateLeagueFixtures(id, t, "demo")).sort(
      (a, b) => a.kickoff - b.kickoff,
    );
    commit({
      source: "demo",
      key: "demo",
      label: "Demo · sample odds, 4 leagues",
      fetchedAt: t,
      games,
    });
    toast.success(`${games.length} demo games priced`, { description: "No API credits spent." });
  };

  const scanLeague = async (refresh: boolean) => {
    const r = await fetchLeagueOdds({
      accessToken: token,
      sportKey: s.leagueId,
      regions: REGION_PARAM[s.region],
      bookmakers: bookParam,
      refresh,
    });
    const league = { key: s.leagueId, title: leagueTitle(s.leagueId) };
    const { games, bookTitles } = toFeedGames(r.games, league, r.fetchedAt);
    const upcoming = games.sort((a, b) => a.kickoff - b.kickoff).slice(0, MAX_GAMES);
    commit({
      source: "league",
      key: scanKey,
      label: `⚽ ${league.title}`,
      fetchedAt: r.fetchedAt,
      games: upcoming,
      bookTitles,
      credits: r.remaining,
      cached: r.cached,
      fetched: games.length,
    });
    if (upcoming.length === 0)
      toast.error("No upcoming games with 3-way odds in this league right now.");
    else toast.success(`${upcoming.length} games priced`, { description: league.title });
  };

  /**
   * Every selected league, restricted to the chosen local day, merged so
   * pairing works across leagues. The feed only prices fixtures that haven't
   * kicked off, so today's window starts at "now" — rounded to the minute so
   * scans seconds apart share the server's cache.
   */
  const scanDate = async (refresh: boolean) => {
    const midnight = parseDateKey(s.date);
    const end = new Date(midnight.getTime() + 24 * 3600 * 1000);
    const start = new Date(Math.floor(Math.max(+midnight, Date.now()) / 60_000) * 60_000);
    const settled = await Promise.allSettled(
      s.leagueIds.map((k) =>
        fetchLeagueOdds({
          accessToken: token,
          sportKey: k,
          regions: REGION_PARAM[s.region],
          bookmakers: bookParam,
          from: apiIso(start),
          to: apiIso(end),
          refresh,
        }),
      ),
    );
    const all: Game[] = [];
    const bookTitles: Record<string, string> = {};
    const failed: string[] = [];
    let remaining: string | null = null;
    let allCached = true;
    // A merged scan is only as fresh as its oldest part.
    let oldest: number | null = null;
    settled.forEach((r, i) => {
      const key = s.leagueIds[i]!;
      if (r.status === "rejected") {
        failed.push(leagueTitle(key));
        return;
      }
      if (!r.value.cached) allCached = false;
      oldest = oldest == null ? r.value.fetchedAt : Math.min(oldest, r.value.fetchedAt);
      const conv = toFeedGames(r.value.games, { key, title: leagueTitle(key) }, r.value.fetchedAt);
      all.push(...conv.games);
      Object.assign(bookTitles, conv.bookTitles);
      // Requests run in parallel; the smallest counter is the freshest.
      const rem = parseFloat(String(r.value.remaining));
      if (!Number.isNaN(rem))
        remaining = String(remaining == null ? rem : Math.min(Number(remaining), rem));
    });
    if (failed.length === settled.length) {
      const reason = settled.find((r) => r.status === "rejected") as
        PromiseRejectedResult | undefined;
      throw new Error(
        (reason?.reason as Error | undefined)?.message ?? "Every league request failed",
      );
    }
    const games = allocateAcrossLeagues(all, MAX_DATE_POOL);
    commit({
      source: "date",
      key: scanKey,
      label: `${fmtDay(midnight.getTime())} · ${s.leagueIds.length} leagues`,
      fetchedAt: oldest ?? Date.now(),
      games,
      bookTitles,
      credits: remaining,
      cached: allCached,
      fetched: all.length,
      failed,
    });
    if (failed.length) {
      toast.error(`Couldn't fetch ${failed.join(", ")}`, {
        description: "Results cover the leagues that worked.",
      });
    } else if (all.length === 0) {
      toast.error(
        s.date === today
          ? "Nothing left to scan today — every fixture in these leagues has kicked off."
          : "No games with 3-way odds on that date in the selected leagues.",
      );
    } else {
      toast.success(`${games.length} games priced`, {
        description: `${s.leagueIds.length} leagues`,
      });
    }
  };

  /** Scans spend from a paid quota, so they only ever run from a button. */
  const runScan = async (kind: "scan" | "force" | "demo") => {
    if (busy) return;
    if (kind === "demo") return scanDemo();
    if (!hasKey) {
      toast.error("No odds API key on the server", {
        description: "Use Demo to try the workflow.",
      });
      return;
    }
    if (s.mode === "league" && !s.leagueId) {
      toast.error("Pick a league first");
      return;
    }
    if (s.mode === "date") {
      if (!s.date || s.date < today) {
        toast.error("Pick today or a later date", {
          description: "Only games that haven't kicked off are priced.",
        });
        return;
      }
      if (s.leagueIds.length === 0) {
        toast.error("Select at least one league");
        return;
      }
    }
    const t = Date.now();
    if (kind === "scan" && s.scan && s.scan.key === scanKey && t - s.scan.fetchedAt < CACHE_MS) {
      setNow(t);
      toast("Using recent prices", {
        description: `Same scan from ${ago(t - s.scan.fetchedAt)} — use Force for fresh prices.`,
      });
      return;
    }
    setBusy(true);
    try {
      if (s.mode === "league") await scanLeague(kind === "force");
      else await scanDate(kind === "force");
    } catch (e) {
      toast.error("Scan failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const loadCombo = (r: ComboResult) => {
    sendToCalculator({
      source: "Scanner",
      excluded: r.excluded,
      events: r.legs.map((l) => {
        const g = gamesById.get(l.gameId);
        return {
          name: g?.home ?? "",
          matchup: g ? `${g.home} vs ${g.away}` : "",
          W: l.odds.W.toFixed(2),
          D: l.odds.D.toFixed(2),
          L: l.odds.L.toFixed(2),
        };
      }),
    });
    navigate({ to: "/calculator" });
  };

  const patterns = patternsFor(s.combine);
  const results = computed?.results ?? [];
  const scan = s.scan;

  return (
    <main className="mx-auto max-w-[1600px] space-y-3 px-2 py-3 sm:px-3">
      {/* Top bar */}
      <section className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 bg-gradient-header px-4 py-3 text-header-foreground">
          <div className="mr-auto">
            <h1 className="font-display text-xl font-black uppercase italic tracking-tight">
              Odds <span className="text-cta">scanner</span>
            </h1>
            <p className="text-xs text-header-muted">
              Finds game combos whose odds can be dutched for a guaranteed or near-guaranteed
              profit. Bets are placed manually at the bookmaker; the scanner only reads odds.
            </p>
          </div>
          {scan?.cached && (
            <span
              className="rounded bg-cta/20 px-2 py-1 text-[11px] font-bold uppercase text-cta"
              title="Answered from the server's shared cache — the odds API was not called"
            >
              From cache · no credits spent
            </span>
          )}
          {scan?.credits != null && (
            <span className="rounded bg-header-deep/70 px-2 py-1 text-[11px] font-bold tabular-nums">
              {scan.credits} API credits left
            </span>
          )}
          <div className="flex rounded-md bg-header-deep/70 p-0.5">
            {(["date", "league"] as const).map((m) => (
              <button
                key={m}
                onClick={() => set({ mode: m })}
                className={`h-8 rounded px-3 text-xs font-bold uppercase ${
                  s.mode === m
                    ? "bg-cta text-cta-foreground"
                    : "text-header-muted hover:text-header-foreground"
                }`}
              >
                {m === "date" ? "By date" : "By league"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
          <Field label="Bookmakers">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-card px-3 text-sm font-semibold">
                <span className="truncate">
                  {s.books.length
                    ? s.books.map((b) => bookName(b)).join(", ")
                    : "All in selected region"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onSelect={() => set({ books: [] })}>
                  All in selected region
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {BOOKMAKERS.map((b) => (
                  <DropdownMenuCheckboxItem
                    key={b.id}
                    checked={s.books.includes(b.id)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(c) =>
                      set({ books: c ? [...s.books, b.id] : s.books.filter((x) => x !== b.id) })
                    }
                  >
                    {b.name}
                    <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                      {b.regions.join("/")}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
          <Field label={s.books.length ? "Region (ignored)" : "Region"}>
            <Select
              value={s.region}
              onValueChange={(v) => set({ region: v as Region })}
              disabled={s.books.length > 0}
            >
              <SelectTrigger className="h-9 bg-card font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eu">EU (incl. 1xBet)</SelectItem>
                <SelectItem value="uk">UK (incl. Betway)</SelectItem>
                <SelectItem value="both">EU + UK</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Combine">
            <Select
              value={String(s.combine)}
              onValueChange={(v) => set({ combine: Number(v) as 1 | 2 | 3 | 4, pattern: "any" })}
            >
              <SelectTrigger className="h-9 bg-card font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "game" : "games"} · {3 ** n} scenarios
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Uncovered scenario">
            <Select value={s.pattern} onValueChange={(v) => set({ pattern: v })}>
              <SelectTrigger className="h-9 bg-card font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="any">Any</SelectItem>
                {patterns.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sort">
            <Select value={s.sort} onValueChange={(v) => set({ sort: v as SortKey })}>
              <SelectTrigger className="h-9 bg-card font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Highest profit %</SelectItem>
                <SelectItem value="safest">Safest first</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground sm:col-span-2 lg:col-span-1 lg:text-right">
            <b className="text-base text-foreground tabular-nums">{results.length}</b> results from{" "}
            <b className="text-foreground tabular-nums">{computed?.games.length ?? 0}</b> games ·{" "}
            <b className="text-up tabular-nums">{computed?.guaranteed ?? 0}</b> guaranteed
          </p>
        </div>
        <p className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
          Patterns read W = home win, D = draw, L = away win, in game order. Full covers are never
          hidden by the filter.
        </p>
      </section>

      {ready && !hasKey && (
        <p className="flex items-start gap-2 rounded-md border border-gold bg-gold/15 px-3 py-2 text-xs text-secondary-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          No odds API key is configured on the server, so live scans are off. Add{" "}
          <code className="rounded bg-card px-1">ODDS_API_KEY</code> to the server environment
          (never a VITE_ variable), or press Demo to try the workflow with sample odds.
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        {/* Left column */}
        <aside className="space-y-3">
          <Card title="Scan settings">
            <div className="space-y-3 p-3">
              {s.mode === "league" ? (
                <Field label="League">
                  <Select
                    value={s.leagueId}
                    onValueChange={(v) => set({ leagueId: v })}
                    disabled={!hasKey || leagues.length === 0}
                  >
                    <SelectTrigger className="h-9 bg-card font-semibold">
                      <SelectValue placeholder={hasKey ? "Loading leagues…" : "Needs an API key"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {leagues.map((l) => (
                        <SelectItem key={l.key} value={l.key}>
                          {l.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <Field label="Match date">
                  <input
                    type="date"
                    min={today}
                    value={s.date}
                    onChange={(e) => set({ date: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
              )}
              <Field label="Minimum profit %">
                <input
                  inputMode="decimal"
                  value={s.minProfit}
                  onChange={(e) => set({ minProfit: e.target.value.replace(/[^0-9.-]/g, "") })}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="Kickoff time">
                <div className="grid grid-cols-2 gap-2">
                  {(["timeFrom", "timeTo"] as const).map((k) => (
                    <input
                      key={k}
                      type="time"
                      aria-label={k === "timeFrom" ? "Kickoff from" : "Kickoff to"}
                      disabled={!scan}
                      value={s[k]}
                      onChange={(e) => set({ [k]: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                  ))}
                </div>
                {!scan && (
                  <p className="mt-1 text-[11px] text-muted-foreground">Available after a scan.</p>
                )}
                {s.timeFrom && s.timeTo && s.timeFrom > s.timeTo && (
                  <p className="mt-1 text-[11px] text-destructive">
                    The window ends before it starts. Windows don't wrap past midnight.
                  </p>
                )}
              </Field>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void runScan("scan")}
                  disabled={busy || !hasKey}
                  className="btn-cta h-9 flex-1 px-3 text-xs disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ScanSearch className="h-4 w-4" />
                  )}
                  {scan && scan.source !== "demo" ? "Rescan" : "Scan"}
                </button>
                <button
                  onClick={() => void runScan("force")}
                  disabled={busy || !hasKey}
                  title="Ignore the shared cache and read the feed again — always spends credits"
                  className="flex h-9 items-center gap-1 rounded-md border border-input px-3 text-xs font-bold uppercase text-secondary-foreground hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Force
                </button>
                <button
                  onClick={() => void runScan("demo")}
                  disabled={busy}
                  title="Sample odds — no API credits"
                  className="flex h-9 items-center gap-1 rounded-md border border-input px-3 text-xs font-bold uppercase text-secondary-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Database className="h-3.5 w-3.5" /> Demo
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                ~{creditCost} credit{creditCost === 1 ? "" : "s"} per live scan. Repeat scans within
                3 minutes are served from cache for free.
              </p>
            </div>
          </Card>

          {s.mode === "date" && (
            <Card
              title="Leagues"
              action={
                <div className="flex gap-1">
                  <SmallButton
                    onClick={() => set({ leagueIds: leagues.map((l) => l.key) })}
                    disabled={leagues.length === 0}
                  >
                    Select all
                  </SmallButton>
                  <SmallButton
                    onClick={() => set({ leagueIds: [] })}
                    disabled={s.leagueIds.length === 0}
                  >
                    Clear
                  </SmallButton>
                </div>
              }
            >
              {leagues.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-muted-foreground">
                  {hasKey ? "Loading in-season leagues…" : "The league list needs an API key."}
                </p>
              ) : (
                <div className="max-h-72 space-y-0.5 overflow-y-auto p-2">
                  {leagues.map((l) => (
                    <label
                      key={l.key}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-muted"
                    >
                      <Checkbox
                        checked={s.leagueIds.includes(l.key)}
                        onCheckedChange={(c) =>
                          set({
                            leagueIds: c
                              ? [...s.leagueIds, l.key]
                              : s.leagueIds.filter((x) => x !== l.key),
                          })
                        }
                      />
                      <span className="flex-1 truncate font-medium">{l.title}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
                {s.leagueIds.length} selected · ~{creditCost} credits per scan
              </p>
            </Card>
          )}

          {s.mode === "league" && scan && scan.source !== "date" && (
            <Card title="Kickoff range">
              <div className="grid grid-cols-2 gap-2 p-3">
                {(["rangeFrom", "rangeTo"] as const).map((k) => (
                  <Field key={k} label={k === "rangeFrom" ? "From" : "To"}>
                    <input
                      type="date"
                      value={s[k]}
                      onChange={(e) => set({ [k]: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-card px-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
                    />
                  </Field>
                ))}
              </div>
            </Card>
          )}

          {scan && (
            <Card title="Odds source">
              <div className="space-y-1.5 p-2">
                {(
                  [
                    ["same", "Same bookmaker", "One slip you can place at a single book."],
                    [
                      "best",
                      "Best odds across books",
                      "Best price per result, placed at different books.",
                    ],
                  ] as const
                ).map(([v, label, hint]) => (
                  <button
                    key={v}
                    onClick={() => set({ oddsSource: v })}
                    className={`w-full rounded-md border px-3 py-2 text-left ${
                      s.oddsSource === v ? "border-primary bg-accent" : "hover:bg-muted"
                    }`}
                  >
                    <span className="block text-[13px] font-bold">{label}</span>
                    <span className="block text-[11px] text-muted-foreground">{hint}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </aside>

        {/* Results */}
        <section className="min-w-0 space-y-3">
          {scan && computed ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-card px-3 py-2 text-xs text-muted-foreground shadow-card">
                <span className="font-bold text-foreground">{scan.label}</span>
                <span>
                  {scan.fetched && scan.fetched > scan.games.length
                    ? `${scan.games.length} of ${scan.fetched} games`
                    : `${scan.games.length} games`}{" "}
                  · odds from {ago(now - scan.fetchedAt)}
                </span>
                <span className="max-w-full truncate">
                  Books: {books.map((b) => bookName(b)).join(", ") || "—"}
                </span>
                {computed.fresh.started + computed.fresh.stale > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Ignored {computed.fresh.started} started · {computed.fresh.stale} with stale
                    quotes
                  </span>
                )}
                {scan.failed && scan.failed.length > 0 && (
                  <span className="text-destructive">Failed: {scan.failed.join(", ")}</span>
                )}
              </div>

              {/* Hidden for 1-game combine: the main list already holds these same full covers. */}
              {computed.arbs.length > 0 && s.combine !== 1 && (
                <div className="space-y-2">
                  <SectionTitle
                    icon={Zap}
                    title={`Single-game arbs · ${computed.arbs.length}`}
                    hint="Risk-free, one game at a time"
                  />
                  <div className="grid gap-3 xl:grid-cols-2">
                    {computed.arbs.map((a) => (
                      <ComboCard
                        key={a.id}
                        result={a}
                        games={gamesById}
                        plans={plans}
                        single
                        onLoad={loadCombo}
                      />
                    ))}
                  </div>
                </div>
              )}

              <SectionTitle
                icon={ScanSearch}
                title={`Game ${s.combine === 1 ? "singles" : s.combine === 2 ? "pairs" : s.combine === 3 ? "triples" : "quads"} · ${results.length}`}
                hint={s.sort === "profit" ? "Highest profit first" : "Safest first"}
              />
              {results.length === 0 ? (
                <p className="rounded-md bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-card">
                  {computed.games.length === 0 && scan.games.length > 0
                    ? "This scan has aged out — its fixtures have kicked off or their quotes are over 15 minutes old. Scan again for current prices."
                    : computed.games.length < s.combine
                      ? `Only ${computed.games.length} game${computed.games.length === 1 ? "" : "s"} available — ${s.combine}-game combos need at least ${s.combine}.`
                      : `No combos clear ${s.minProfit || 0}% with these filters. Try a lower minimum profit, fewer games per combo, best odds across books, or more leagues.`}
                </p>
              ) : (
                <div className="grid gap-3 xl:grid-cols-2">
                  {results.slice(0, shown).map((r) => (
                    <ComboCard
                      key={r.id}
                      result={r}
                      games={gamesById}
                      plans={plans}
                      onLoad={loadCombo}
                    />
                  ))}
                </div>
              )}
              {results.length > shown && (
                <button
                  onClick={() => setShown((n) => n + PAGE)}
                  className="mx-auto flex h-9 items-center rounded-md border border-input bg-card px-4 text-xs font-bold uppercase text-secondary-foreground hover:bg-muted"
                >
                  Show more ({results.length - shown} left)
                </button>
              )}
              <p className="px-1 text-[11px] text-muted-foreground">
                “{3 ** s.combine - 1} of {3 ** s.combine} covered” is not risk-free: the excluded
                scenario is usually the bookmaker's favourite, and its stake is lost if it happens.
                Odds move — re-check them at the bookmaker before placing.
              </p>
            </>
          ) : (
            <div className="rounded-md bg-card px-6 py-16 text-center shadow-card">
              <ScanSearch className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-3 font-display text-lg font-bold uppercase">No scan yet</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Pick a {s.mode === "date" ? "date and leagues" : "league"} on the left, then press
                Scan to price every combination of upcoming games — or try Demo to see the workflow
                without spending API credits.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => void runScan("scan")}
                  disabled={busy || !ready || !hasKey}
                  className="btn-cta h-10 px-5 text-sm disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ScanSearch className="h-4 w-4" />
                  )}{" "}
                  Scan now
                </button>
                <button
                  onClick={() => void runScan("demo")}
                  disabled={busy || !ready}
                  className="flex h-10 items-center gap-1 rounded-md border border-input px-4 text-xs font-bold uppercase text-secondary-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Database className="h-3.5 w-3.5" /> Demo
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="block text-[11px] font-bold uppercase text-secondary-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md bg-card shadow-card">
      <div className="flex items-center justify-between bg-panel-head px-3 py-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-secondary-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SmallButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-6 rounded px-2 text-[11px] font-semibold text-primary hover:bg-card disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Zap;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="font-display text-sm font-bold uppercase tracking-wide">{title}</h2>
      <span className="text-xs text-muted-foreground">· {hint}</span>
    </div>
  );
}
