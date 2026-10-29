/**
 * Cover-betting calculator math. Money is handled in cents internally so
 * totals land exactly on the budget.
 */

export type Outcome = "W" | "D" | "L";
export const OUTCOMES: Outcome[] = ["W", "D", "L"];
export const EVENT_LETTERS = ["A", "B", "C", "D"] as const;
export const MAX_EVENTS = 4;

export type EventOdds = Record<Outcome, number>;

export interface CalcRow {
  stake: number;
  odds: number;
  excluded?: boolean;
  unlikely?: boolean;
}

export interface ComputedRow {
  stake: number;
  gross: number;
  net: number;
  profit: number;
  profitPct: number;
  covered: boolean;
  /** Extra stake needed on this row to break even; null when not needed, Infinity when impossible. */
  minToCover: number | null;
  canAffordCover: boolean;
}

const EPS = 1e-9;
export const round2 = (n: number) => Math.round(n * 100) / 100;
const toCents = (n: number) => Math.round(n * 100);
const ceilCents = (n: number) => Math.ceil(n * 100 - EPS);

/** Every combination of W/D/L for n events, cycling the last event fastest. */
export function buildScenarios(n: number): Outcome[][] {
  let out: Outcome[][] = [[]];
  for (let i = 0; i < n; i++) out = out.flatMap((p) => OUTCOMES.map((o) => [...p, o]));
  return out;
}

export function scenarioLabel(scenario: Outcome[]): string {
  return scenario.map((o, i) => `${EVENT_LETTERS[i]}${o}`).join("+");
}

/** Scenario odds = product of each event's odds for that outcome; 0 if any odd is missing. */
export function deriveScenarioOdds(events: EventOdds[], scenarios: Outcome[][]): number[] {
  return scenarios.map((sc) => {
    let product = 1;
    for (let i = 0; i < sc.length; i++) {
      const o = events[i]?.[sc[i]!];
      if (o === undefined || !Number.isFinite(o) || !(o > 0)) return 0;
      product *= o;
    }
    return round2(product);
  });
}

/** Payout per unit staked after tax on the winnings only. */
export const multiplier = (odds: number, tax: number) => odds * (1 - tax) + tax;

export const isStakeable = (r: CalcRow) => !r.excluded && r.odds > 1;

/**
 * Per-row figures for the whole table — same math as OctoOdds.
 *   gross      = stake * odds
 *   net        = gross - (gross - stake) * tax          (tax on winnings only)
 *   profit     = net - total staked across ALL rows
 *   covered    = total <= net
 *   minToCover = (total - stake * m) / (m - 1), m > 1 only
 *
 * Values are kept as raw floats; the grid formats them for display. Excluded
 * rows' stakes still count — Exclude only removes a row from the auto-staking
 * buttons (Balance/Turbo/give-up), it does not un-place a bet. Profit % is
 * of the committed budget, or of the total staked when no budget is set.
 */
export function computeRows(rows: CalcRow[], budget: number, tax: number) {
  const stakes = rows.map((r) => Math.max(0, r.stake || 0));
  const totalStaked = stakes.reduce((a, b) => a + b, 0);
  const remaining = budget - totalStaked;

  const computed: ComputedRow[] = rows.map((r, i) => {
    const stake = stakes[i]!;
    const gross = stake * r.odds;
    const net = gross - (gross - stake) * tax;
    const profit = net - totalStaked;
    const covered = totalStaked <= net;
    const m = multiplier(r.odds, tax);
    const minToCover = !covered && m > 1 ? (totalStaked - stake * m) / (m - 1) : null;
    const pctBase = budget > 0 ? budget : totalStaked;
    return {
      stake,
      gross,
      net,
      profit,
      profitPct: pctBase > 0 ? (profit / pctBase) * 100 : 0,
      covered,
      minToCover,
      canAffordCover: minToCover !== null && minToCover <= remaining,
    };
  });

  return { rows: computed, totalStaked, remaining };
}

/**
 * Split amountCents across indices proportional to 1/m. Each stake is rounded
 * to the nearest cent and the rounding difference lands on the largest stake —
 * OctoOdds' roundStakes, so both apps produce identical stakes.
 */
function dutch(indices: number[], ms: number[], amountCents: number, out: number[]) {
  if (indices.length === 0 || amountCents <= 0) return;
  const weights = indices.map((i) => 1 / ms[i]!);
  const sum = weights.reduce((a, b) => a + b, 0);
  const cents = weights.map((w) => Math.round((amountCents * w) / sum));
  const remainder = amountCents - cents.reduce((a, b) => a + b, 0);
  let largest = 0;
  cents.forEach((c, k) => {
    if (c > cents[largest]!) largest = k;
  });
  cents[largest] = cents[largest]! + remainder;
  indices.forEach((i, k) => (out[i] = cents[k]!));
}

/** Equal-profit dutching across every included, stakeable row using the full budget. */
export function balanceProfitStakes(rows: CalcRow[], budget: number, tax: number): number[] {
  const out = rows.map(() => 0);
  const ms = rows.map((r) => multiplier(r.odds, tax));
  const idx = rows.map((r, i) => (isStakeable(r) ? i : -1)).filter((i) => i >= 0);
  dutch(idx, ms, toCents(budget), out);
  return out.map((c) => c / 100);
}

/** Stake each stakeable row so its gross return is at least `win` (rounded up to the cent). */
export function balanceWinStakes(rows: CalcRow[], win: number): number[] {
  return rows.map((r) => (isStakeable(r) && win > 0 ? ceilCents(win / r.odds) / 100 : 0));
}

/**
 * Largest Total win the budget can deliver: W × Σ1/odds ≤ budget, floored to
 * the cent — OctoOdds' formula. Balance-win stakes are rounded up per row, so
 * at exactly this target they can overshoot the budget by a few cents.
 */
export function maxWin(rows: CalcRow[], budget: number): number {
  const inv = rows.filter(isStakeable).reduce((a, r) => a + 1 / r.odds, 0);
  if (inv === 0 || budget <= 0) return 0;
  return Math.floor((budget / inv) * 100 + EPS) / 100;
}

/**
 * Unlikely rows get just enough to return the whole budget if they land;
 * the rest of the budget is dutched across the likely rows for equal profit.
 */
export function turboBalanceStakes(
  rows: CalcRow[],
  budget: number,
  tax: number,
): { stakes: number[]; error: string | null } {
  const ms = rows.map((r) => multiplier(r.odds, tax));
  const unlikely = rows
    .map((r, i) => (isStakeable(r) && r.unlikely ? i : -1))
    .filter((i) => i >= 0);
  const likely = rows.map((r, i) => (isStakeable(r) && !r.unlikely ? i : -1)).filter((i) => i >= 0);
  const out = rows.map(() => 0);
  if (likely.length === 0)
    return { stakes: out, error: "Leave at least one row not marked Unlikely" };
  const budgetCents = toCents(budget);
  unlikely.forEach((i) => (out[i] = Math.ceil(budgetCents / ms[i]! - EPS)));
  const freed = budgetCents - unlikely.reduce((a, i) => a + out[i]!, 0);
  if (freed <= 0) {
    return {
      stakes: rows.map(() => 0),
      error: "Budget is too small to give money back on the unlikely rows",
    };
  }
  dutch(likely, ms, freed, out);
  return { stakes: out.map((c) => c / 100), error: null };
}

export interface CoverPlan {
  /** Row left unstaked, or null for "give up nothing" (cover every scenario). */
  index: number | null;
  /** How many scenarios carry a stake under this plan. */
  coveredCount: number;
  /** What each covered scenario nets, in currency. */
  profit: number;
  /** ...as a percentage of the budget. */
  profitPct: number;
}

/**
 * What every "which scenario do I give up" choice is worth (same as OctoOdds).
 * Under equal-profit dutching over a covered set C each covered scenario nets
 * B/S − B, where S = Σ_{i∈C} 1/m_i — so a sacrifice only drops its own 1/m out
 * of S. The Exclude ticks are deliberately ignored: picking a plan is what sets
 * them. Order: "give up nothing" first, then each scenario in row order.
 */
export function coverPlans(rows: CalcRow[], budget: number, tax: number): CoverPlan[] {
  if (!(budget > 0)) return [];
  const pool = rows
    .map((r, i) => (r.odds > 1 && multiplier(r.odds, tax) > 0 ? i : -1))
    .filter((i) => i >= 0);
  if (pool.length === 0) return [];
  const inv = new Map(pool.map((i) => [i, 1 / multiplier(rows[i]!.odds, tax)]));
  const sumAll = pool.reduce((a, i) => a + inv.get(i)!, 0);
  const plan = (index: number | null, S: number): CoverPlan => {
    const profit = budget / S - budget;
    return {
      index,
      coveredCount: pool.length - (index === null ? 0 : 1),
      profit,
      profitPct: (profit / budget) * 100,
    };
  };
  const plans = [plan(null, sumAll)];
  // Giving up the only stakeable scenario would leave nothing to stake.
  if (pool.length > 1) for (const i of pool) plans.push(plan(i, sumAll - inv.get(i)!));
  return plans;
}

/** The give-up plan that pays the most (never "give up nothing"). */
export function bestCoverPlan(plans: CoverPlan[]): CoverPlan | null {
  return plans.reduce<CoverPlan | null>(
    (best, p) => (p.index !== null && (!best || p.profitPct > best.profitPct) ? p : best),
    null,
  );
}

/**
 * Rows restaked to a plan, as OctoOdds does: the sacrificed row is marked
 * excluded (every other row is included), and the budget is balanced across
 * the rest for equal profit. Marking it excluded is what keeps Max win,
 * Balance and Turbo from counting the scenario you gave up.
 */
export function applyCoverPlan(
  rows: CalcRow[],
  budget: number,
  tax: number,
  sacrifice: number | null,
): { excluded: boolean[]; stakes: number[] } {
  const marked = rows.map((r, i) => ({ ...r, excluded: sacrifice !== null && i === sacrifice }));
  return {
    excluded: marked.map((r) => r.excluded),
    stakes: balanceProfitStakes(marked, budget, tax),
  };
}

const norm = (s: string) => s.trim().toLowerCase();

/** Names in the current draft that already appear in other open plans. */
export function findExposure(
  draftNames: string[],
  openPlans: { id: string; title: string; names: string[] }[],
): { name: string; plans: string[] }[] {
  const seen = new Set<string>();
  const result: { name: string; plans: string[] }[] = [];
  for (const raw of draftNames) {
    const n = norm(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    const plans = openPlans.filter((p) => p.names.some((x) => norm(x) === n)).map((p) => p.title);
    if (plans.length) result.push({ name: raw.trim(), plans });
  }
  return result;
}
