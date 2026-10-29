/** Saved calculator plans, kept in this browser (demo only — no accounts). */

export interface EventDraft {
  name: string;
  matchup: string;
  W: string;
  D: string;
  L: string;
}

export interface RowDraft {
  stake: string;
  /** Raw odds string, exactly as OctoOdds stores it — derived on multi-event tabs, typed on 1-event. */
  odds: string;
  excluded: boolean;
  unlikely: boolean;
}

export interface TabState {
  events: EventDraft[];
  rows: RowDraft[];
  budget: string;
  tax: string;
  winTarget: string;
  loadedPlanId: string | null;
}

export interface SavedPlan {
  id: string;
  createdAt: number;
  title: string;
  eventCount: number;
  events: EventDraft[];
  rows: RowDraft[];
  odds: number[];
  budget: string;
  tax: string;
  /** Kept in step with wonScenario; the real result comes from `betOutcome` in bets.ts. */
  status: "Pending" | "Settled";
  /** null while pending; -1 when marked lost; otherwise the winning row index. */
  wonScenario?: number | null;
  settledAt?: number | null;
}

const KEY = "octoodds.calculator.plans";

export function loadPlans(): SavedPlan[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const plans = raw ? (JSON.parse(raw) as SavedPlan[]) : [];
    return plans.map((p) => ({
      ...p,
      wonScenario: p.wonScenario ?? null,
      settledAt: p.settledAt ?? null,
      status: p.wonScenario == null ? "Pending" : "Settled",
    }));
  } catch {
    return [];
  }
}

export function storePlans(plans: SavedPlan[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(plans));
  } catch {
    // storage full or blocked — plans just won't persist
  }
}

export const emptyEvent = (): EventDraft => ({ name: "", matchup: "", W: "", D: "", L: "" });
export const emptyRow = (): RowDraft => ({
  stake: "",
  odds: "",
  excluded: false,
  unlikely: false,
});

export function defaultTab(n: number): TabState {
  return {
    events: Array.from({ length: n }, emptyEvent),
    rows: Array.from({ length: 3 ** n }, emptyRow),
    budget: "100",
    tax: "0",
    winTarget: "",
    loadedPlanId: null,
  };
}

/** A combo handed over from the Scanner, picked up once by the Calculator. */
export interface CalculatorHandoff {
  events: EventDraft[];
  excluded: number | null;
  source: string;
}

const HANDOFF_KEY = "octoodds.calculator.handoff";

export function sendToCalculator(h: CalculatorHandoff) {
  try {
    window.localStorage.setItem(HANDOFF_KEY, JSON.stringify(h));
  } catch {
    // ignore — the calculator just opens empty
  }
}

export function takeHandoff(): CalculatorHandoff | null {
  try {
    const raw = window.localStorage.getItem(HANDOFF_KEY);
    window.localStorage.removeItem(HANDOFF_KEY);
    return raw ? (JSON.parse(raw) as CalculatorHandoff) : null;
  } catch {
    return null;
  }
}

const OPEN_KEY = "octoodds.calculator.open";

/** Ask the Calculator to open a saved plan on its next load (used by My Bets). */
export function openInCalculator(planId: string) {
  try {
    window.localStorage.setItem(OPEN_KEY, planId);
  } catch {
    // ignore
  }
}

export function takeOpenPlan(): string | null {
  try {
    const id = window.localStorage.getItem(OPEN_KEY);
    window.localStorage.removeItem(OPEN_KEY);
    return id;
  } catch {
    return null;
  }
}
