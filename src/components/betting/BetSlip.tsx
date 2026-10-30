import { useState } from "react";
import { Ticket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  accumulatorOdds,
  potentialWin,
  singlesTotals,
  stakeError,
  type Selection,
} from "@/lib/betslip";

export interface PlacedBet {
  id: string;
  type: "Single" | "Accumulator";
  picks: Selection[];
  stake: number;
  odds: number;
  win: number;
}

const QUICK = [10, 50, 100, 500];
const money = (n: number) =>
  `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function BetSlip({
  slip,
  onRemove,
  onClear,
  placed,
  onPlace,
}: {
  slip: Selection[];
  onRemove: (matchId: string) => void;
  onClear: () => void;
  placed: PlacedBet[];
  onPlace: (bets: PlacedBet[]) => void;
}) {
  const [tab, setTab] = useState<"slip" | "mine">("slip");
  const [mode, setMode] = useState<"single" | "acca">("acca");
  const [stakeText, setStakeText] = useState("50");
  const stake = Number(stakeText);

  const effectiveMode = slip.length < 2 ? "single" : mode;
  const accOdds = accumulatorOdds(slip);
  const singles = singlesTotals(slip, stake || 0);
  const totalStake = effectiveMode === "acca" ? stake || 0 : singles.totalStake;
  const totalWin = effectiveMode === "acca" ? potentialWin(stake, accOdds) : singles.totalWin;
  const error = slip.length ? stakeError(stake) : null;

  const place = () => {
    if (error || slip.length === 0) return;
    const now = Date.now();
    const bets: PlacedBet[] =
      effectiveMode === "acca"
        ? [
            {
              id: `${now}`,
              type: "Accumulator",
              picks: slip,
              stake,
              odds: accOdds,
              win: potentialWin(stake, accOdds),
            },
          ]
        : slip.map((s, i) => ({
            id: `${now}-${i}`,
            type: "Single",
            picks: [s],
            stake,
            odds: s.odd,
            win: potentialWin(stake, s.odd),
          }));
    onPlace(bets);
    toast.success("Bet accepted", { description: `Possible win ${money(totalWin)}` });
    setTab("mine");
  };

  return (
    <div className="overflow-hidden rounded-md bg-card shadow-card">
      <div className="grid grid-cols-2 bg-gradient-header text-header-foreground">
        {(["slip", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex h-11 items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide ${
              tab === t ? "text-header-foreground" : "text-header-muted"
            }`}
          >
            {t === "slip" ? "Bet slip" : "My bets"}
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] ${
                tab === t ? "bg-cta text-cta-foreground" : "bg-header-deep text-header-muted"
              }`}
            >
              {t === "slip" ? slip.length : placed.length}
            </span>
            {tab === t && <span className="absolute inset-x-6 bottom-0 h-0.5 bg-cta" />}
          </button>
        ))}
      </div>

      {tab === "slip" ? (
        slip.length === 0 ? (
          <EmptyState text="Add events to the bet slip by clicking on the odds." />
        ) : (
          <div>
            <div className="flex items-center gap-1 border-b p-2">
              {(["single", "acca"] as const).map((m) => (
                <button
                  key={m}
                  disabled={m === "acca" && slip.length < 2}
                  onClick={() => setMode(m)}
                  className={`h-8 flex-1 rounded text-xs font-semibold transition-colors disabled:opacity-40 ${
                    effectiveMode === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {m === "single" ? "Single" : "Accumulator"}
                </button>
              ))}
              <button
                onClick={onClear}
                aria-label="Clear bet slip"
                className="grid h-8 w-8 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-80 divide-y overflow-y-auto">
              {slip.map((s) => (
                <li key={s.matchId} className="flex gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-muted-foreground">{s.matchName}</p>
                    <p className="text-[13px] font-semibold">{s.label}</p>
                  </div>
                  <span className="self-center text-sm font-bold tabular-nums text-primary">
                    {s.odd.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemove(s.matchId)}
                    aria-label={`Remove ${s.matchName}`}
                    className="self-start text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-2.5 border-t bg-muted/60 p-3">
              {effectiveMode === "acca" && (
                <Row label="Total odds" value={accOdds.toFixed(2)} strong />
              )}
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase text-muted-foreground">
                  {effectiveMode === "acca" ? "Stake" : "Stake per bet"}
                </span>
                <input
                  inputMode="decimal"
                  value={stakeText}
                  onChange={(e) => setStakeText(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <div className="grid grid-cols-4 gap-1">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => setStakeText(String(q))}
                    className="h-7 rounded bg-card text-xs font-semibold text-secondary-foreground hover:bg-accent"
                  >
                    {q}
                  </button>
                ))}
              </div>
              {error && <p className="text-xs font-medium text-destructive">{error}</p>}
              <Row label="Total stake" value={money(totalStake)} />
              <Row label="Possible win" value={money(totalWin)} strong />
              <button onClick={place} disabled={!!error} className="btn-cta h-11 w-full text-sm">
                Place a bet
              </button>
            </div>
          </div>
        )
      ) : placed.length === 0 ? (
        <EmptyState text="You haven't placed any bets yet." />
      ) : (
        <ul className="max-h-[32rem] divide-y overflow-y-auto">
          {placed.map((b) => (
            <li key={b.id} className="space-y-1 px-3 py-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-primary">{b.type}</span>
                <span className="rounded bg-gold/25 px-1.5 py-px text-[10px] font-bold uppercase text-secondary-foreground">
                  Pending
                </span>
              </div>
              {b.picks.map((p) => (
                <p key={p.matchId} className="truncate text-muted-foreground">
                  {p.matchName} · <span className="font-semibold text-foreground">{p.label}</span>{" "}
                  @ {p.odd.toFixed(2)}
                </p>
              ))}
              <div className="flex justify-between pt-1">
                <span>
                  Stake <b>{money(b.stake)}</b> · Odds <b>{b.odds.toFixed(2)}</b>
                </span>
                <span className="font-bold text-up">{money(b.win)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${strong ? "text-base font-bold text-foreground" : "font-semibold"}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <Ticket className="h-10 w-10 text-input" />
      <p className="text-[13px] text-muted-foreground">{text}</p>
    </div>
  );
}
