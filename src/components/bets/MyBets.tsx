import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Calculator,
  CheckCircle2,
  Circle,
  Clock,
  FolderOpen,
  Loader2,
  RotateCcw,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { openInCalculator, type SavedPlan } from "@/lib/calculator-plans";
import { deletePlan, fetchPlans, savePlanResult } from "@/lib/plans-db";
import {
  LOST,
  OUTCOME_LABEL,
  betOutcome,
  computeBet,
  participants,
  resetBet,
  scenarioName,
  settleBet,
  winnerLabel,
  type BetOutcome,
} from "@/lib/bets";
import { money, signedMoney, toneOf, when } from "./format";

type Filter = "all" | BetOutcome;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All bets" },
  { key: "pending", label: "Pending" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "breakeven", label: "Break-even" },
];

export const STATUS_STYLE: Record<BetOutcome, { icon: typeof Clock; cls: string }> = {
  pending: { icon: Clock, cls: "bg-gold/25 text-secondary-foreground" },
  won: { icon: CheckCircle2, cls: "bg-up/15 text-up" },
  lost: { icon: XCircle, cls: "bg-down/15 text-down" },
  breakeven: { icon: Circle, cls: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ outcome }: { outcome: BetOutcome }) {
  const { icon: Icon, cls } = STATUS_STYLE[outcome];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${cls}`}
    >
      <Icon className="h-3 w-3" /> {OUTCOME_LABEL[outcome]}
    </span>
  );
}

export function MyBets() {
  const navigate = useNavigate();
  const [bets, setBets] = useState<SavedPlan[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = () => {
    setLoadError("");
    fetchPlans()
      .then(setBets)
      .catch((e: Error) => setLoadError(e.message));
  };
  useEffect(load, []);

  const sorted = useMemo(() => [...(bets ?? [])].sort((a, b) => b.createdAt - a.createdAt), [bets]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: sorted.length,
      pending: 0,
      won: 0,
      lost: 0,
      breakeven: 0,
    };
    for (const b of sorted) c[betOutcome(b)] += 1;
    return c;
  }, [sorted]);
  const shown = filter === "all" ? sorted : sorted.filter((b) => betOutcome(b) === filter);

  /** Save a settle/reset to the database; the card only changes once it lands. */
  const saveResult = async (next: SavedPlan): Promise<boolean> => {
    try {
      const saved = await savePlanResult(next);
      setBets((prev) => (prev ?? []).map((b) => (b.id === saved.id ? saved : b)));
      return true;
    } catch (e) {
      toast.error("Couldn't save the result", { description: (e as Error).message });
      return false;
    }
  };
  const remove = async (b: SavedPlan) => {
    try {
      await deletePlan(b.id);
      setBets((prev) => (prev ?? []).filter((x) => x.id !== b.id));
      toast("Bet deleted");
    } catch (e) {
      toast.error("Delete failed", { description: (e as Error).message });
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] space-y-3 px-2 py-3 sm:px-3">
      <section className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 bg-gradient-header px-4 py-3 text-header-foreground">
          <div className="mr-auto">
            <h1 className="font-display text-xl font-black uppercase italic tracking-tight">
              My <span className="text-cta">bets</span>
            </h1>
            <p className="text-xs text-header-muted">
              Every bet saved to your account, most recent first — including ones saved in OctoOdds.
            </p>
          </div>
          <Link to="/stats" className="btn-cta h-9 px-3 text-xs">
            <Trophy className="h-4 w-4" /> Stats
          </Link>
        </div>
        <div className="scrollbar-none flex gap-1 overflow-x-auto bg-panel-head px-2 py-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded px-3 text-xs font-bold uppercase ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground hover:bg-accent"
              }`}
            >
              {f.label}
              <span
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] ${
                  filter === f.key
                    ? "bg-cta text-cta-foreground"
                    : "bg-card text-secondary-foreground"
                }`}
              >
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {loadError ? (
        <section className="rounded-md bg-card px-4 py-10 text-center shadow-card">
          <p className="font-semibold">Couldn't load your bets</p>
          <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          <button onClick={load} className="btn-cta mx-auto mt-4 h-9 px-4 text-xs">
            Try again
          </button>
        </section>
      ) : bets === null ? (
        <p className="flex items-center justify-center gap-2 rounded-md bg-card px-4 py-10 text-sm text-muted-foreground shadow-card">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading bets…
        </p>
      ) : sorted.length === 0 ? (
        <section className="rounded-md bg-card px-4 py-12 text-center shadow-card">
          <p className="font-semibold">No bets saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a plan in the Calculator and press Save — it shows up here as Pending.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/calculator" className="btn-cta h-9 px-4 text-xs">
              <Calculator className="h-4 w-4" /> Open Calculator
            </Link>
          </div>
        </section>
      ) : shown.length === 0 ? (
        <p className="rounded-md bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-card">
          No {FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} bets.
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((b) => (
            <BetCard
              key={b.id}
              bet={b}
              onChange={saveResult}
              onDelete={() => void remove(b)}
              onOpen={() => {
                openInCalculator(b.id);
                navigate({ to: "/calculator" });
              }}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function BetCard({
  bet,
  onChange,
  onDelete,
  onOpen,
}: {
  bet: SavedPlan;
  onChange: (b: SavedPlan) => Promise<boolean>;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const f = computeBet(bet);
  const outcome = betOutcome(bet);
  const [pick, setPick] = useState<string>("");
  const [confirm, setConfirm] = useState<number | null>(null);
  const [askDelete, setAskDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const staked = bet.rows.map((r, i) => ({ i, r })).filter(({ r }) => !r.excluded);

  return (
    <li className="overflow-hidden rounded-md bg-card shadow-card">
      <div className="flex flex-wrap items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <StatusBadge outcome={outcome} />
            <span>Saved {when(bet.createdAt)}</span>
          </div>
          <p className="font-display text-base font-bold leading-tight">{bet.title}</p>
          <p className="text-xs text-muted-foreground">
            {participants(bet).join(" · ")} · {bet.eventCount}{" "}
            {bet.eventCount === 1 ? "event" : "events"} · tax {bet.tax || 0}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Staked</p>
          <p className="font-display text-lg font-bold tabular-nums">{money(f.totalStaked)}</p>
        </div>
      </div>

      {outcome !== "pending" && (
        <div className="grid grid-cols-2 gap-px border-y bg-border sm:grid-cols-4">
          <Tile label="Winner" value={winnerLabel(bet)} />
          <Tile label="Returned" value={money(f.returned)} />
          <Tile label="Net" value={signedMoney(f.net)} tone={toneOf(f.net)} />
          <Tile label="Total staked" value={money(f.totalStaked)} />
        </div>
      )}

      {confirm !== null && (
        <SettleConfirm
          bet={bet}
          initialWinner={confirm}
          saving={saving}
          onCancel={() => setConfirm(null)}
          onConfirm={async (next) => {
            setSaving(true);
            const ok = await onChange(next);
            setSaving(false);
            if (!ok) return;
            setConfirm(null);
            setPick("");
            toast.success(`Settled · ${OUTCOME_LABEL[betOutcome(next)]}`, {
              description: `Net ${signedMoney(computeBet(next).net)}`,
            });
          }}
        />
      )}

      <div className="flex flex-wrap items-center gap-2 bg-muted/50 px-4 py-2.5">
        {outcome === "pending" ? (
          <>
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger className="h-8 w-64 bg-card text-xs">
                <SelectValue placeholder="Which scenario won?" />
              </SelectTrigger>
              <SelectContent>
                {staked.map(({ i }) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">
                    {scenarioName(bet, i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ActionButton
              primary
              disabled={pick === "" || confirm !== null}
              onClick={() => setConfirm(Number(pick))}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark winner
            </ActionButton>
            <ActionButton disabled={confirm !== null} onClick={() => setConfirm(LOST)}>
              <XCircle className="h-3.5 w-3.5" /> Mark lost
            </ActionButton>
          </>
        ) : (
          <ActionButton
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const ok = await onChange(resetBet(bet));
              setSaving(false);
              if (ok) toast("Back to pending");
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </ActionButton>
        )}
        <div className="ml-auto flex gap-2">
          <ActionButton onClick={onOpen}>
            <FolderOpen className="h-3.5 w-3.5" /> Open
          </ActionButton>
          <ActionButton danger onClick={() => setAskDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </ActionButton>
        </div>
      </div>

      <AlertDialog open={askDelete} onOpenChange={setAskDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{bet.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Stats is worked out from your saved bets, so this bet will
              disappear from your totals, charts and team table too.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete bet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

function SettleConfirm({
  bet,
  initialWinner,
  saving,
  onCancel,
  onConfirm,
}: {
  bet: SavedPlan;
  initialWinner: number;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (b: SavedPlan) => void;
}) {
  const [winner, setWinner] = useState(initialWinner);
  const [edits, setEdits] = useState(() =>
    bet.rows.map((r, i) => ({
      stake: r.excluded ? "0" : r.stake || "0",
      odds: r.odds || (bet.odds[i] ?? 0).toFixed(2),
    })),
  );
  const parsed = edits.map((e) => ({ stake: e.stake, odds: parseFloat(e.odds) || 0 }));
  const preview = settleBet(bet, winner, parsed, Date.now());
  const pf = computeBet(preview);
  const rows = bet.rows.map((r, i) => ({ r, i })).filter(({ r }) => !r.excluded);
  const set = (i: number, patch: Partial<(typeof edits)[number]>) =>
    setEdits((prev) => prev.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const clean = (v: string) => v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

  return (
    <div className="space-y-3 border-t bg-accent/40 px-4 py-3">
      <div>
        <p className="text-sm font-bold">Confirm the result</p>
        <p className="text-xs text-muted-foreground">
          Click the row that actually won. Fix any stake or odds that differ from what you placed at
          the bookmaker.
        </p>
      </div>
      <div className="max-h-80 overflow-auto rounded-md border bg-card">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-panel-head text-[10px] uppercase text-secondary-foreground">
            <tr>
              <th className="px-3 py-1.5 text-left">Scenario</th>
              <th className="w-28 px-2 py-1.5 text-right">Stake</th>
              <th className="w-24 px-2 py-1.5 text-right">Odds</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr
              onClick={() => setWinner(LOST)}
              className={`cursor-pointer ${winner === LOST ? "bg-down/10" : "hover:bg-muted"}`}
            >
              <td className="px-3 py-2 font-semibold" colSpan={3}>
                <span className="inline-flex items-center gap-1.5">
                  <XCircle
                    className={`h-3.5 w-3.5 ${winner === LOST ? "text-down" : "text-muted-foreground"}`}
                  />
                  None of these (lost)
                </span>
              </td>
            </tr>
            {rows.map(({ i }) => (
              <tr
                key={i}
                onClick={() => setWinner(i)}
                className={`cursor-pointer ${winner === i ? "bg-up/10" : "hover:bg-muted"}`}
              >
                <td className="px-3 py-1.5">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${winner === i ? "text-up" : "text-muted-foreground/40"}`}
                    />
                    {scenarioName(bet, i)}
                  </span>
                </td>
                <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    inputMode="decimal"
                    aria-label={`Stake for ${scenarioName(bet, i)}`}
                    value={edits[i]!.stake}
                    onChange={(e) => set(i, { stake: clean(e.target.value) })}
                    className="h-7 w-full rounded border border-input bg-card px-2 text-right tabular-nums outline-none focus:ring-2 focus:ring-ring"
                  />
                </td>
                <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    inputMode="decimal"
                    aria-label={`Odds for ${scenarioName(bet, i)}`}
                    value={edits[i]!.odds}
                    onChange={(e) => set(i, { odds: clean(e.target.value) })}
                    className="h-7 w-full rounded border border-input bg-card px-2 text-right tabular-nums outline-none focus:ring-2 focus:ring-ring"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span>
          Total staked <b className="tabular-nums">{money(pf.totalStaked)}</b>
        </span>
        <span>
          Return <b className="tabular-nums">{money(pf.returned)}</b>
        </span>
        <span>
          Net <b className={`tabular-nums ${toneOf(pf.net)}`}>{signedMoney(pf.net)}</b>
        </span>
        <StatusBadge outcome={betOutcome(preview)} />
        <div className="ml-auto flex gap-2">
          <ActionButton onClick={onCancel}>Cancel</ActionButton>
          <ActionButton
            primary
            disabled={saving}
            onClick={() => onConfirm(settleBet(bet, winner, parsed, Date.now()))}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}{" "}
            Confirm
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: string | undefined }) {
  return (
    <div className="bg-card px-4 py-2">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className={`truncate text-sm font-bold tabular-nums ${tone ?? ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  onClick,
  primary,
  danger,
  disabled,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center gap-1 rounded px-3 text-[11px] font-bold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-cta text-cta-foreground hover:bg-cta-hover"
          : danger
            ? "bg-card text-muted-foreground hover:text-destructive"
            : "bg-card text-secondary-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
