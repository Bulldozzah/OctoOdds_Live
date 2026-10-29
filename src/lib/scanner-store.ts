/** Scanner settings and last scan, kept in this browser so leaving the page loses nothing. */
import { registerBookTitles, type Game, type Region } from "./odds-feed";
import type { ComboResult, SortKey } from "./scanner";

export interface ScanSnapshot {
  source: "league" | "date" | "demo";
  /** Identifies what was scanned, so a quick rescan can reuse it. */
  key: string;
  label: string;
  fetchedAt: number;
  games: Game[];
  /** Live bookmaker titles by id, so names survive a reload. */
  bookTitles?: Record<string, string>;
  /** Odds API credits left this month after the scan (live scans only). */
  credits?: string | null;
  /** True when the server answered from its shared cache — no credits spent. */
  cached?: boolean;
  /** Games the date scan fetched before the pool cap. */
  fetched?: number;
  /** Leagues whose request failed in a date scan. */
  failed?: string[];
}

export interface ScannerState {
  mode: "league" | "date";
  /** Odds API league key, e.g. "soccer_epl". */
  leagueId: string;
  date: string;
  /** Odds API league keys for the date scan. Empty until the league list loads. */
  leagueIds: string[];
  /** Specific bookmakers; empty = every book in the region. */
  books: string[];
  region: Region;
  combine: 1 | 2 | 3 | 4;
  pattern: string;
  sort: SortKey;
  minProfit: string;
  timeFrom: string;
  timeTo: string;
  rangeFrom: string;
  rangeTo: string;
  oddsSource: "same" | "best";
  scan: ScanSnapshot | null;
}

/** Same window as the server's shared cache — repeat scans inside it are free. */
export const CACHE_MS = 3 * 60 * 1000;

export const defaultScannerState = (): ScannerState => ({
  mode: "date",
  leagueId: "",
  date: "",
  leagueIds: [],
  books: [],
  region: "both",
  combine: 2,
  pattern: "any",
  sort: "profit",
  minProfit: "1",
  timeFrom: "",
  timeTo: "",
  rangeFrom: "",
  rangeTo: "",
  oddsSource: "same",
  scan: null,
});

const KEY = "octoodds.scanner.state.v2";

export function loadScannerState(): ScannerState {
  try {
    const raw = window.localStorage.getItem(KEY);
    const state = raw
      ? { ...defaultScannerState(), ...(JSON.parse(raw) as Partial<ScannerState>) }
      : defaultScannerState();
    registerBookTitles(state.scan?.bookTitles);
    return state;
  } catch {
    return defaultScannerState();
  }
}

export function storeScannerState(state: ScannerState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked — the scan just won't persist
  }
}

/**
 * The last computed combo results per combine count, kept in this browser so
 * the Calculator's sidebar can offer them for loading without re-scanning.
 */
export interface StoredScanResults {
  /** When the underlying odds were fetched. */
  at: number;
  combine: number;
  oddsSource: "same" | "best";
  minProfit: number;
  results: ComboResult[];
  /** Only the games the results reference — enough for the cards. */
  games: Game[];
  /** Live bookmaker titles by id, so names resolve off the Scanner page too. */
  bookTitles?: Record<string, string>;
}

const RESULTS_KEY = "octoodds.scanner.results.v1";
/** Most recent results kept per combine count — enough to pick from, small enough for storage. */
const RESULTS_PER_COUNT = 15;

function readResultsBook(): Record<string, StoredScanResults> {
  try {
    return (JSON.parse(window.localStorage.getItem(RESULTS_KEY) ?? "{}") ?? {}) as Record<
      string,
      StoredScanResults
    >;
  } catch {
    return {};
  }
}

export function storeScanResults(
  snap: ScanSnapshot,
  results: ComboResult[],
  opts: { combine: number; oddsSource: "same" | "best"; minProfit: number },
) {
  try {
    const kept = results.slice(0, RESULTS_PER_COUNT);
    const ids = new Set(kept.flatMap((r) => r.legs.map((l) => l.gameId)));
    const games = snap.games.filter((g) => ids.has(g.id));
    const book = readResultsBook();
    book[String(opts.combine)] = {
      at: snap.fetchedAt,
      combine: opts.combine,
      oddsSource: opts.oddsSource,
      minProfit: opts.minProfit,
      results: kept,
      games,
      bookTitles: snap.bookTitles ?? {},
    };
    window.localStorage.setItem(RESULTS_KEY, JSON.stringify(book));
  } catch {
    // storage full or blocked — results just won't carry over
  }
}

export function readScanResults(combine: number): StoredScanResults | null {
  try {
    const stored = readResultsBook()[String(combine)] ?? null;
    registerBookTitles(stored?.bookTitles);
    return stored;
  } catch {
    return null;
  }
}
