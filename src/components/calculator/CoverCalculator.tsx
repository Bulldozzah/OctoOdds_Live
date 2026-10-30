import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eraser,
  FileDown,
  FolderOpen,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { deletePlan, fetchPlans, insertPlan, updatePlan } from "@/lib/plans-db";
import {
  EVENT_LETTERS,
  applyCoverPlan,
  balanceProfitStakes,
  balanceWinStakes,
  bestCoverPlan,
  buildScenarios,
  computeRows,
  coverPlans,
  deriveScenarioOdds,
  findExposure,
  isStakeable,
  maxWin,
  round2,
  scenarioLabel,
  turboBalanceStakes,
  type CalcRow,
  type Outcome,
} from "@/lib/calculator";
import {
  defaultTab,
  emptyRow,
  takeHandoff,
  takeOpenPlan,
  type CalculatorHandoff,
  type EventDraft,
  type SavedPlan,
  type TabState,
} from "@/lib/calculator-plans";
import { readScanResults } from "@/lib/scanner-store";
import { ComboCard } from "@/components/scanner/ComboCard";
import type { ComboResult } from "@/lib/scanner";
import { Link } from "@tanstack/react-router";
import { OUTCOME_LABEL, betOutcome } from "@/lib/bets";

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const clean = (v: string) => v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
const money = (n: number) =>
  `${n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const WORD: Record<Outcome, string> = { W: "win", D: "draw", L: "lose" };

const initialTabs = (): Record<number, TabState> => ({
  1: defaultTab(1),
  2: defaultTab(2),
  3: defaultTab(3),
  4: defaultTab(4),
});

export function CoverCalculator() {
  const { user } = useAuth();
  const [count, setCount] = useState(1);
  const [tabs, setTabs] = useState<Record<number, TabState>>(initialTabs);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [betTitle, setBetTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<SavedPlan | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  // Sidebar view: "plans" or a combo size ("1".."4") showing that scan's results.
  const [side, setSide] = useState("plans");
  // Which scenario the give-up plan sacrifices: a row index, "all" to cover
  // everything, or "best" for whichever pays most (OctoOdds' default).
  const [sacrifice, setSacrifice] = useState("best");
  // The plan My Bets asked to open. Taken once (the key is one-shot) and held
  // until the plan list arrives, so a re-run of the effect can't lose it.
  const pendingOpen = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (pendingOpen.current === undefined) pendingOpen.current = takeOpenPlan();
    let live = true;
    fetchPlans()
      .then((saved) => {
        if (!live) return;
        setPlans(saved);
        const openId = pendingOpen.current;
        pendingOpen.current = null;
        if (!openId) return;
        const toOpen = saved.find((p) => p.id === openId);
        if (toOpen) load(toOpen);
        else toast.error("That plan couldn't be found");
      })
      .catch(
        (e: Error) => live && toast.error("Couldn't load your plans", { description: e.message }),
      )
      .finally(() => live && setPlansLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const applyHandoff = (h: CalculatorHandoff) => {
    if (h.events.length < 1 || h.events.length > 4) return;
    const n = h.events.length;
    const base = defaultTab(n);
    const odds = deriveScenarioOdds(
      h.events.map((e) => ({ W: num(e.W), D: num(e.D), L: num(e.L) })),
      buildScenarios(n),
    );
    const stakes = balanceProfitStakes(
      odds.map((o, i) => ({ stake: 0, odds: o, excluded: i === h.excluded })),
      num(base.budget),
      0,
    );
    setCount(n);
    setSacrifice("best");
    setTabs((prev) => ({
      ...prev,
      [n]: {
        ...base,
        events: h.events,
        rows: base.rows.map((r, i) => ({
          ...r,
          odds: String(odds[i] ?? 0),
          excluded: i === h.excluded,
          stake: stakes[i] ? stakes[i]!.toFixed(2) : "",
        })),
      },
    }));
    setBetTitle("");
    toast(`Loaded from ${h.source}`, {
      description: "Stakes are balanced across the covered scenarios.",
    });
  };

  useEffect(() => {
    const h = takeHandoff();
    if (h) applyHandoff(h);
  }, []);

  // Latest scan results for the combine count picked in the sidebar dropdown —
  // read fresh on selection so a scan done in another tab shows up.
  const scanResults = useMemo(
    () => (side === "plans" ? null : readScanResults(Number(side))),
    [side],
  );
  const scanGames = useMemo(
    () => new Map((scanResults?.games ?? []).map((g) => [g.id, g])),
    [scanResults],
  );
  const loadScanResult = (r: ComboResult) => {
    applyHandoff({
      source: "Scanner",
      excluded: r.excluded,
      events: r.legs.map((l) => {
        const g = scanGames.get(l.gameId);
        return {
          name: g?.home ?? "",
          matchup: g ? `${g.home} vs ${g.away}` : "",
          W: l.odds.W.toFixed(2),
          D: l.odds.D.toFixed(2),
          L: l.odds.L.toFixed(2),
        };
      }),
    });
  };

  const tab = tabs[count] ?? defaultTab(count);
  const update = (fn: (t: TabState) => Partial<TabState>) =>
    setTabs((prev) => ({
      ...prev,
      [count]: { ...(prev[count] ?? defaultTab(count)), ...fn(prev[count] ?? defaultTab(count)) },
    }));

  const scenarios = useMemo(() => buildScenarios(count), [count]);
  // Scenario odds live on the rows (editable), same as OctoOdds.
  const odds = useMemo(() => tab.rows.map((r) => num(r.odds)), [tab.rows]);
  const budget = num(tab.budget);
  const tax = Math.min(Math.max(num(tab.tax), 0), 99) / 100;
  const calcRows: CalcRow[] = tab.rows.map((r) => ({
    stake: num(r.stake),
    odds: num(r.odds),
    excluded: r.excluded,
    unlikely: r.unlikely,
  }));
  const result = computeRows(calcRows, budget, tax);
  const giveUps = coverPlans(calcRows, budget, tax);
  const coverAll = giveUps.find((p) => p.index === null) ?? null;
  const dropPlans = giveUps.filter((p) => p.index !== null);
  const bestPlan = bestCoverPlan(giveUps);
  const chosenPlan =
    sacrifice === "best"
      ? bestPlan
      : sacrifice === "all"
        ? coverAll
        : (dropPlans.find((p) => p.index === Number(sacrifice)) ?? null);
  const maxW = maxWin(calcRows, budget);
  const winTarget = num(tab.winTarget);
  const overLimit = winTarget > maxW;
  // OctoOdds' winDiff: requested win vs the budget — or vs the stake the
  // balance would actually need when no budget is set.
  const winDiff = useMemo(() => {
    const w = winTarget;
    if (!(w > 0)) return null;
    if (budget > 0) return ((w - budget) / budget) * 100;
    const sumInv = calcRows.filter(isStakeable).reduce((a, r) => a + 1 / r.odds, 0);
    if (!(sumInv > 0)) return null;
    return ((w - w * sumInv) / (w * sumInv)) * 100;
  }, [winTarget, budget, calcRows]);
  const hasStakeable = calcRows.some(isStakeable);

  const names = (events: EventDraft[]) =>
    events.flatMap((e) => [e.name, ...(e.matchup ? e.matchup.split(" vs ") : [])]);
  const exposure = findExposure(
    names(tab.events),
    plans
      .filter((p) => p.status === "Pending" && p.id !== tab.loadedPlanId)
      .map((p) => ({ id: p.id, title: p.title, names: names(p.events) })),
  );

  const describe = (i: number) =>
    scenarios[i]!.map(
      (o, k) => `${tab.events[k]?.name || `Team ${EVENT_LETTERS[k]}`} ${WORD[o]}`,
    ).join(" · ");

  const setStakes = (stakes: number[]) =>
    update((t) => ({
      rows: t.rows.map((r, i) => ({ ...r, stake: stakes[i] ? stakes[i].toFixed(2) : "" })),
    }));
  const setEvent = (k: number, patch: Partial<EventDraft>) =>
    update((t) => {
      const events = t.events.map((e, i) => (i === k ? { ...e, ...patch } : e));
      // Editing W/D/L re-derives every scenario's odds, like OctoOdds — that
      // also overwrites any hand-edited odds in the grid.
      if (count > 1 && ("W" in patch || "D" in patch || "L" in patch)) {
        const derived = deriveScenarioOdds(
          events.map((e) => ({ W: num(e.W), D: num(e.D), L: num(e.L) })),
          scenarios,
        );
        return { events, rows: t.rows.map((r, i) => ({ ...r, odds: String(derived[i] ?? 0) })) };
      }
      return { events };
    });
  const setRow = (i: number, patch: Partial<TabState["rows"][number]>) =>
    update((t) => ({ rows: t.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));

  const needOdds = () => {
    if (!hasStakeable)
      toast.error("Enter odds first", { description: "Every row needs odds above 1.00." });
    if (budget <= 0) toast.error("Enter a target stake");
    return hasStakeable && budget > 0;
  };

  const balance = () => needOdds() && setStakes(balanceProfitStakes(calcRows, budget, tax));
  const turbo = () => {
    if (!needOdds()) return;
    if (!calcRows.some((r) => isStakeable(r) && r.unlikely)) {
      toast.error("Tick Unlikely on at least one row", {
        description: "Turbo gives those rows money back only and loads the rest.",
      });
      return;
    }
    const { stakes, error } = turboBalanceStakes(calcRows, budget, tax);
    if (error) toast.error(error);
    else setStakes(stakes);
  };
  const applyWin = () => {
    if (!needOdds()) return;
    if (!(winTarget > 0)) {
      toast.error("Enter a total win amount");
      return;
    }
    if (overLimit) {
      setLimitHit(true);
      return;
    }
    setStakes(balanceWinStakes(calcRows, winTarget));
  };
  const stepWin = (dir: 1 | -1) => {
    const next = round2(Math.max(0, (winTarget || maxW) + dir));
    if (dir === 1 && next > maxW) {
      setLimitHit(true);
      update(() => ({ winTarget: maxW.toFixed(2) }));
      return;
    }
    setLimitHit(false);
    update(() => ({ winTarget: next.toFixed(2) }));
  };
  const signedPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  const calculateCover = () => {
    if (!chosenPlan) {
      toast.error("Nothing to calculate", {
        description: "Set a budget and give at least two scenarios odds above 1.",
      });
      return;
    }
    const { excluded, stakes } = applyCoverPlan(calcRows, budget, tax, chosenPlan.index);
    update((t) => ({
      rows: t.rows.map((r, i) => ({
        ...r,
        excluded: excluded[i]!,
        unlikely: excluded[i] ? false : r.unlikely,
        stake: stakes[i] ? stakes[i]!.toFixed(2) : "",
      })),
    }));
    const each = `each covered scenario returns ${money(chosenPlan.profit)} (${signedPct(chosenPlan.profitPct)})`;
    toast(
      chosenPlan.index === null
        ? `Covered ${chosenPlan.coveredCount} of ${scenarios.length}`
        : `Covered ${chosenPlan.coveredCount} of ${scenarios.length} — gave up ${scenarioLabel(scenarios[chosenPlan.index]!)}`,
      {
        description:
          chosenPlan.index === null
            ? `${each}.`
            : `${each}. If ${describe(chosenPlan.index)} happens, the whole ${money(budget)} is lost.`,
      },
    );
  };

  const clearOdds = () =>
    update((t) => ({
      events: t.events.map((e) => ({ ...e, W: "", D: "", L: "" })),
      rows: t.rows.map((r) => ({ ...r, odds: "0" })),
    }));
  const reset = () => {
    setSacrifice("best");
    setTabs((prev) => ({ ...prev, [count]: defaultTab(count) }));
    setBetTitle("");
    setLimitHit(false);
  };

  // A loaded plan that is still pending is updated in place; anything else
  // (nothing loaded, or a settled bet) is saved as a new bet so a result is
  // never overwritten.
  const editing = plans.find((p) => p.id === tab.loadedPlanId && p.wonScenario == null) ?? null;

  const save = async () => {
    if (!user || saving) return;
    if (result.totalStaked <= 0) {
      toast.error("Add stakes before saving");
      return;
    }
    const title =
      betTitle.trim() || tab.events.map((e, k) => e.name || `Team ${EVENT_LETTERS[k]}`).join(" / ");
    const draft: SavedPlan = {
      id: editing?.id ?? "",
      createdAt: Date.now(),
      title,
      eventCount: count,
      events: tab.events,
      rows: tab.rows,
      odds,
      budget: tab.budget,
      tax: tab.tax,
      status: "Pending",
      wonScenario: null,
      settledAt: null,
    };
    setSaving(true);
    try {
      const saved = editing ? await updatePlan(draft) : await insertPlan(draft, user.id);
      setPlans((prev) =>
        editing ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev],
      );
      update(() => ({ loadedPlanId: saved.id }));
      setBetTitle(saved.title);
      toast.success(editing ? "Plan updated" : "Plan saved", {
        description: `${saved.title} · Pending — settle it under My Bets.`,
      });
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (p: SavedPlan) => {
    setConfirmDelete(null);
    try {
      await deletePlan(p.id);
      setPlans((prev) => prev.filter((x) => x.id !== p.id));
      if (p.id === tab.loadedPlanId) update(() => ({ loadedPlanId: null }));
      toast(`Deleted “${p.title}”`);
    } catch (e) {
      toast.error("Delete failed", { description: (e as Error).message });
    }
  };

  const load = (p: SavedPlan) => {
    setSacrifice("best");
    setBetTitle(p.title);
    setCount(p.eventCount);
    setTabs((prev) => ({
      ...prev,
      [p.eventCount]: {
        events: p.events,
        rows:
          p.rows.length === 3 ** p.eventCount
            ? p.rows
            : Array.from({ length: 3 ** p.eventCount }, emptyRow),
        budget: p.budget,
        tax: p.tax,
        winTarget: "",
        loadedPlanId: p.id,
      },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast(`Loaded “${p.title}”`);
  };

  const exportPdf = async () => {
    const [{ jsPDF }, { autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("OctoOdds - Cover plan", 14, 16);
    doc.setFontSize(10);
    tab.events.forEach((e, k) => {
      doc.text(
        `${EVENT_LETTERS[k]}: ${e.name || "-"}${e.matchup ? ` (${e.matchup})` : ""}   W ${e.W || "-"}  D ${e.D || "-"}  L ${e.L || "-"}`,
        14,
        24 + k * 5,
      );
    });
    const y = 26 + count * 5;
    doc.text(
      `Budget ${money(budget)}   Tax ${round2(tax * 100)}%   Total staked ${money(result.totalStaked)}   Remaining ${money(result.remaining)}`,
      14,
      y,
    );
    autoTable(doc, {
      startY: y + 4,
      head: [
        [
          "#",
          "Scenario",
          "Outcome",
          "Odds",
          "Stake",
          "Net payout",
          "Profit",
          "Profit %",
          "Covered",
        ],
      ],
      body: result.rows.map((r, i) => [
        i + 1,
        scenarioLabel(scenarios[i]!),
        describe(i),
        odds[i] ? odds[i]!.toFixed(2) : "-",
        tab.rows[i]?.excluded ? "Excluded" : money(r.stake),
        money(r.net),
        money(r.profit),
        `${r.profitPct.toFixed(1)}%`,
        result.totalStaked > 0 ? (r.covered ? "Yes" : "No") : "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 74, 140] },
    });
    doc.save(`octoodds-cover-plan-${count}-events.pdf`);
  };

  return (
    <main className="mx-auto max-w-[1600px] space-y-3 px-2 py-3 sm:px-3">
      {/* Setup */}
      <section className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 bg-gradient-header px-4 py-3 text-header-foreground">
          <div className="mr-auto">
            <h1 className="font-display text-xl font-black uppercase italic tracking-tight">
              Cover <span className="text-cta">calculator</span>
            </h1>
            <p className="text-xs text-header-muted">
              Spread one budget across every outcome of 1–4 events.
            </p>
          </div>
          <input
            value={betTitle}
            onChange={(e) => setBetTitle(e.target.value)}
            placeholder="Bet name"
            aria-label="Bet name"
            className="h-9 w-44 rounded-md bg-header-deep/70 px-3 text-xs text-header-foreground outline-none placeholder:text-header-muted focus:ring-2 focus:ring-cta"
          />
          <button
            onClick={() => void save()}
            disabled={saving}
            className="btn-cta h-9 px-3 text-xs disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? "Update" : "Save"}
          </button>
          <button onClick={exportPdf} className="btn-ghost-header h-9 px-3 text-xs">
            <FileDown className="h-4 w-4" /> Export PDF
          </button>
          <button onClick={reset} className="btn-ghost-header h-9 px-3 text-xs">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[380px_1fr] xl:grid-cols-[380px_1fr_320px]">
        {/* Left panel */}
        <aside className="min-w-0 space-y-3">
          {/* Setup */}
          <div className="space-y-1.5 rounded-md border bg-muted/50 p-2.5">
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Teams" className="min-w-0 flex-1">
                <Select
                  value={String(count)}
                  onValueChange={(v) => {
                    setCount(Number(v));
                    // Row indices mean something different on another tab.
                    setSacrifice("best");
                  }}
                >
                  <SelectTrigger className="h-9 bg-card text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? "event" : "events"} · {3 ** n} scenarios
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Stake" className="w-24">
                <NumInput value={tab.budget} onChange={(v) => update(() => ({ budget: v }))} />
              </Field>
              <Field label="Tax %" className="w-16">
                <NumInput value={tab.tax} onChange={(v) => update(() => ({ tax: v }))} />
              </Field>
            </div>
          </div>

          {/* Balance win */}
          <div className="space-y-1.5 rounded-md border bg-muted/50 p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-secondary-foreground">
                Balance win
                {maxW > 0 && (
                  <span className="font-normal normal-case text-muted-foreground">
                    {" "}
                    · max <b className="text-down">{money(Math.floor(maxW * 100) / 100)}</b>
                  </span>
                )}
              </span>
              <div className="space-y-1">
                <div className="relative">
                  <input
                    inputMode="decimal"
                    aria-label="Total win"
                    placeholder="Total win"
                    value={tab.winTarget}
                    onChange={(ev) => {
                      setLimitHit(false);
                      const v = clean(ev.target.value);
                      update(() => ({
                        winTarget:
                          maxW > 0 && num(v) > maxW ? (Math.floor(maxW * 100) / 100).toFixed(2) : v,
                      }));
                    }}
                    className={`h-9 w-36 rounded-md border border-input bg-card pl-2 pr-16 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-ring ${
                      overLimit && winTarget > 0 ? "border-destructive text-destructive" : ""
                    }`}
                  />
                  <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                    {winDiff !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          winDiff >= 0 ? "bg-up/15 text-up" : "bg-down/15 text-down"
                        }`}
                        title="Difference between your budget and the requested Total win"
                      >
                        {winDiff >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {Math.abs(winDiff).toFixed(0)}%
                      </span>
                    )}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Increase total win"
                        onClick={() => stepWin(1)}
                        disabled={maxW > 0 && winTarget >= maxW - 1e-9}
                        className="text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Decrease total win"
                        onClick={() => stepWin(-1)}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={applyWin} className="btn-cta ml-auto h-9 w-24 shrink-0 text-xs">
                Apply
              </button>
            </div>
            <p className="flex items-baseline justify-end gap-x-4 text-sm font-semibold text-muted-foreground">
              <span>
                Total staked{" "}
                <b className="font-display text-lg font-black tabular-nums text-down">
                  {money(result.totalStaked)}
                </b>
              </span>
              <span>
                Remaining{" "}
                <b className="font-display text-lg font-black tabular-nums text-down">
                  {money(result.remaining)}
                </b>
              </span>
            </p>
            {(limitHit || overLimit) && winTarget > 0 && (
              <p className="flex items-center gap-1 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Limit reached — the budget can't cover a
                bigger win.
              </p>
            )}
          </div>

          {/* Scenario to give up */}
          <div className="space-y-1.5 rounded-md border bg-muted/50 p-2.5">
            <p className="text-xs font-bold uppercase text-secondary-foreground">
              Scenario to give up{" "}
              <span className="font-normal normal-case text-muted-foreground">
                (the rest share the budget for equal profit)
              </span>
            </p>
            <div className="flex gap-2">
              <Select
                value={sacrifice}
                onValueChange={setSacrifice}
                disabled={giveUps.length === 0}
              >
                <SelectTrigger className="h-9 min-w-0 flex-1 bg-card text-xs font-semibold">
                  <SelectValue placeholder="Enter a budget and odds first" />
                </SelectTrigger>
                <SelectContent>
                  {bestPlan && bestPlan.index !== null && (
                    <SelectItem value="best" className="text-xs">
                      ★ Best · {scenarioLabel(scenarios[bestPlan.index]!)} ·{" "}
                      {signedPct(bestPlan.profitPct)}
                    </SelectItem>
                  )}
                  {coverAll && (
                    <SelectItem value="all" className="text-xs">
                      Give up nothing · cover {coverAll.coveredCount} ·{" "}
                      {signedPct(coverAll.profitPct)}
                    </SelectItem>
                  )}
                  {dropPlans.map((g) => (
                    <SelectItem key={g.index} value={String(g.index)} className="text-xs">
                      {scenarioLabel(scenarios[g.index!]!)} · {signedPct(g.profitPct)} ·{" "}
                      {describe(g.index!)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={calculateCover}
                disabled={!chosenPlan}
                className="btn-cta h-9 shrink-0 px-3 text-xs disabled:opacity-50"
              >
                Calculate
              </button>
            </div>
            {chosenPlan && chosenPlan.profitPct < 0 && (
              <p className="text-[11px] font-semibold text-destructive">
                This plan loses {signedPct(chosenPlan.profitPct)} on every covered scenario.
                {bestPlan && bestPlan.index !== null && bestPlan.profitPct > 0
                  ? ` The best available is ${scenarioLabel(scenarios[bestPlan.index]!)} at ${signedPct(bestPlan.profitPct)}.`
                  : " No give-up scenario turns a profit at these odds."}
              </p>
            )}
          </div>

          {/* Fill stakes */}
          <div className="space-y-1.5 rounded-md border bg-muted/50 p-2.5">
            <p className="text-xs font-bold uppercase text-secondary-foreground">Fill stakes</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={balance}
                className="btn-cta h-9 flex-1 px-3 text-xs"
                title="Same profit on every included row"
              >
                Balance
              </button>
              <button
                onClick={turbo}
                className="btn-cta h-9 flex-1 px-3 text-xs"
                title="Unlikely rows get money back only; the rest share the budget"
              >
                Turbo
              </button>
            </div>
          </div>

          {/* Teams & odds */}
          <section className="overflow-hidden rounded-md bg-card shadow-card">
            <PanelHead title="Teams & odds">
              <button
                onClick={clearOdds}
                className="flex h-7 items-center gap-1 rounded px-2 text-xs font-semibold text-secondary-foreground hover:bg-card"
              >
                <Eraser className="h-3.5 w-3.5" /> Clear odds
              </button>
            </PanelHead>
            <div className="grid gap-2 p-3">
              {tab.events.map((e, k) => (
                <div key={k} className="space-y-1 rounded-md border bg-muted/50 p-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={e.name}
                      onChange={(ev) => setEvent(k, { name: ev.target.value })}
                      placeholder={`Team ${EVENT_LETTERS[k]}`}
                      className="h-9 min-w-0 flex-1 rounded border border-input bg-card px-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex shrink-0 gap-1">
                      {(["W", "D", "L"] as const).map((o, oi) => (
                        <input
                          key={o}
                          aria-label={`${EVENT_LETTERS[k]} ${WORD[o]} odds`}
                          inputMode="decimal"
                          placeholder={o}
                          // 1 event: the input IS the scenario row's odds, exactly
                          // like OctoOdds — raw text, no rounding.
                          value={count === 1 ? (tab.rows[oi]?.odds ?? "") : e[o]}
                          onChange={(ev) => {
                            const v = clean(ev.target.value);
                            if (count === 1)
                              update((t) => ({
                                events: t.events.map((x, j) => (j === k ? { ...x, [o]: v } : x)),
                                rows: t.rows.map((r, j) => (j === oi ? { ...r, odds: v } : r)),
                              }));
                            else setEvent(k, { [o]: v });
                          }}
                          className="odd-btn h-9 w-14 border border-input px-1.5 text-center text-sm tabular-nums outline-none placeholder:font-black placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
                        />
                      ))}
                    </div>
                  </div>
                  {e.matchup && (
                    <p className="truncate text-[11px] text-muted-foreground">{e.matchup}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Main column */}
        <div className="min-w-0 space-y-3">
          {/* Scenario table */}
          <section className="overflow-hidden rounded-md bg-card shadow-card">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 bg-gradient-header px-3 py-2.5 text-header-foreground">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                Scenarios · {scenarios.length}
              </h2>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[720px] text-[12px]">
                <thead className="sticky top-0 z-10 bg-panel-head text-[10px] font-bold uppercase text-secondary-foreground">
                  <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:text-left">
                    <th>#</th>
                    <th>Scenario</th>
                    <th>Odds</th>
                    <th>Stake</th>
                    <th>Net payout</th>
                    <th>Profit</th>
                    <th></th>
                    <th>Min to cover</th>
                    <th className="text-center">Unlikely</th>
                    <th className="text-center">Exclude</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {result.rows.map((r, i) => {
                    const row = tab.rows[i] ?? emptyRow();
                    return (
                      <tr
                        key={i}
                        className={`[&>td]:px-2 [&>td]:py-1.5 ${row.excluded ? "bg-muted/60 opacity-50" : "hover:bg-muted/40"}`}
                      >
                        <td className="text-muted-foreground tabular-nums">{i + 1}</td>
                        <td>
                          <p className="font-bold text-primary">{scenarioLabel(scenarios[i]!)}</p>
                        </td>
                        <td>
                          <input
                            inputMode="decimal"
                            aria-label={`Odds for ${scenarioLabel(scenarios[i]!)}`}
                            value={row.odds}
                            onChange={(ev) => setRow(i, { odds: clean(ev.target.value) })}
                            className="h-7 w-14 rounded border border-input bg-card px-1.5 text-right text-xs font-bold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                          />
                        </td>
                        <td>
                          <input
                            inputMode="decimal"
                            aria-label={`Stake for ${scenarioLabel(scenarios[i]!)}`}
                            value={row.stake}
                            placeholder="0.00"
                            onChange={(ev) => setRow(i, { stake: clean(ev.target.value) })}
                            className="h-7 w-20 rounded border border-input bg-card px-1.5 text-right text-xs font-semibold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                          />
                        </td>
                        <td className="tabular-nums">{money(r.net)}</td>
                        <td
                          className={`font-bold tabular-nums ${r.profit >= 0 ? "text-up" : "text-down"}`}
                        >
                          {r.profit >= 0 ? "+" : ""}
                          {money(r.profit)}
                          <span className="ml-1 text-[10px] font-semibold opacity-80">
                            {r.gross > 0 ? `${r.profitPct.toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="text-center text-sm">
                          {r.covered ? (
                            <span className="text-up" title="Covered">
                              ▲
                            </span>
                          ) : (
                            <span className="text-down" title="Loss">
                              ▼
                            </span>
                          )}
                        </td>
                        <td>
                          {r.covered ? (
                            <span className="text-muted-foreground">—</span>
                          ) : r.minToCover === null ? (
                            <span
                              className="text-[11px] text-muted-foreground"
                              title="Odds ≤ 1 can never cover the stake"
                            >
                              n/a
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                setRow(i, {
                                  stake: String(Math.ceil((r.stake + r.minToCover!) * 100) / 100),
                                })
                              }
                              title={
                                r.canAffordCover
                                  ? `Click to stake +${money(r.minToCover)} (within Remaining)`
                                  : `Needs +${money(r.minToCover)} — exceeds Remaining`
                              }
                              className={`h-7 rounded border px-2 text-[11px] font-bold ${
                                r.canAffordCover
                                  ? "border-cta/40 bg-cta/15 text-up hover:bg-cta/25"
                                  : "border-destructive/40 text-destructive hover:bg-destructive/10"
                              }`}
                            >
                              +{money(r.minToCover)}
                            </button>
                          )}
                        </td>
                        <td className="text-center">
                          <Checkbox
                            aria-label="Unlikely"
                            checked={row.unlikely}
                            disabled={row.excluded}
                            onCheckedChange={(c) => setRow(i, { unlikely: c === true })}
                          />
                        </td>
                        <td className="text-center">
                          <Checkbox
                            aria-label="Exclude"
                            checked={row.excluded}
                            onCheckedChange={(c) =>
                              setRow(
                                i,
                                c === true
                                  ? { excluded: true, stake: "", unlikely: false }
                                  : { excluded: false },
                              )
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Side panel */}
        <aside className="space-y-3 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-[8.5rem] xl:self-start">
          {exposure.length > 0 && (
            <section className="rounded-md border border-gold bg-gold/15 p-3 text-[12px] shadow-card">
              <p className="mb-1.5 flex items-center gap-1.5 font-bold uppercase text-secondary-foreground">
                <AlertTriangle className="h-4 w-4 text-gold" /> Exposure warning
              </p>
              <ul className="space-y-1">
                {exposure.map((x) => (
                  <li key={x.name}>
                    <b>{x.name}</b> is already in {x.plans.map((p) => `“${p}”`).join(", ")}.
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="overflow-hidden rounded-md bg-card shadow-card">
            <div className="flex items-center gap-2 bg-gradient-header px-3 py-2.5 text-header-foreground">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                {side === "plans" ? "My plans" : "Matches"}
              </h2>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cta px-1 text-[10px] font-bold text-cta-foreground">
                {side === "plans" ? plans.length : (scanResults?.results.length ?? 0)}
              </span>
              <Select value={side} onValueChange={setSide}>
                <SelectTrigger className="ml-auto h-7 w-36 border-header-foreground/20 bg-header-deep/60 text-[11px] font-semibold text-header-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plans" className="text-xs">
                    My plans
                  </SelectItem>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">
                      Matches · {n} {n === 1 ? "game" : "games"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {side !== "plans" ? (
              !scanResults || scanResults.results.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  No {side}-game results yet — run a scan on the Scanner page and the top results
                  will show up here.
                </p>
              ) : (
                <div className="max-h-[34rem] space-y-3 overflow-y-auto p-3">
                  <p className="text-[11px] text-muted-foreground">
                    Last scan ·{" "}
                    {scanResults.oddsSource === "best"
                      ? "best odds across books"
                      : "same bookmaker"}{" "}
                    · min {scanResults.minProfit}% · odds from{" "}
                    {new Date(scanResults.at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {scanResults.results.map((r) => (
                    <ComboCard
                      key={r.id}
                      result={r}
                      games={scanGames}
                      plans={plans}
                      onLoad={loadScanResult}
                    />
                  ))}
                </div>
              )
            ) : plansLoading ? (
              <p className="flex items-center justify-center gap-2 px-4 py-8 text-[13px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
              </p>
            ) : plans.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                Saved plans show up here as Pending.
              </p>
            ) : (
              <ul className="max-h-[28rem] divide-y overflow-y-auto">
                {plans.map((p) => {
                  const staked = p.rows.reduce((a, r) => a + num(r.stake), 0);
                  return (
                    <li
                      key={p.id}
                      className={`space-y-1.5 px-3 py-2.5 text-[12px] ${p.id === tab.loadedPlanId ? "bg-accent/60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold leading-tight">{p.title}</p>
                        <span
                          className={`shrink-0 rounded px-1.5 py-px text-[10px] font-bold uppercase ${
                            {
                              pending: "bg-gold/25 text-secondary-foreground",
                              won: "bg-up/15 text-up",
                              lost: "bg-down/15 text-down",
                              breakeven: "bg-muted text-muted-foreground",
                            }[betOutcome(p)]
                          }`}
                        >
                          {OUTCOME_LABEL[betOutcome(p)]}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        {p.eventCount} {p.eventCount === 1 ? "event" : "events"} · staked{" "}
                        <b className="text-foreground">{money(staked)}</b>
                      </p>
                      <div className="flex gap-1">
                        <SmallButton onClick={() => load(p)}>
                          <FolderOpen className="h-3.5 w-3.5" /> Load
                        </SmallButton>
                        {p.status === "Pending" && (
                          <Link
                            to="/my-bets"
                            className="flex h-7 items-center gap-1 rounded bg-muted px-2 text-[11px] font-semibold text-secondary-foreground hover:bg-accent"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Settle
                          </Link>
                        )}
                        <SmallButton danger onClick={() => setConfirmDelete(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </SmallButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-md bg-card p-3 text-[12px] text-muted-foreground shadow-card">
            <p className="mb-1.5 font-bold uppercase text-secondary-foreground">How it works</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Each row is one possible result; only one of them will happen.</li>
              <li>Tax is taken from winnings only, never from the stake you get back.</li>
              <li>▲ means that row pays back at least everything you staked.</li>
              <li>Mark rows you don't believe in as Unlikely, then press Turbo.</li>
            </ul>
            <p className="mt-2 text-[11px]">
              Plans are saved to your account and also open in OctoOdds.
            </p>
          </section>
        </aside>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirmDelete?.title}” will be removed permanently, along with any settlement and
              the stats derived from it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && void removePlan(confirmDelete)}
            >
              Delete plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block whitespace-nowrap text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(clean(e.target.value))}
      className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function PanelHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between bg-panel-head px-3 py-2">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-secondary-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SmallButton({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-7 items-center gap-1 rounded bg-muted px-2 text-[11px] font-semibold ${
        danger
          ? "ml-auto text-muted-foreground hover:text-destructive"
          : "text-secondary-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
