import { useState } from "react";
import { AlertTriangle, ArrowRightLeft, Eye, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CURRENCY } from "@/lib/sample-data";
import { bookName, type Game } from "@/lib/odds-feed";
import { dutchStakes, scenariosFor, type ComboResult } from "@/lib/scanner";
import { EVENT_LETTERS, findExposure, type Outcome } from "@/lib/calculator";
import type { SavedPlan } from "@/lib/calculator-plans";

const PREVIEW_BUDGET = 1000;

export const money = (n: number) =>
  `${n < 0 ? "−" : ""}${CURRENCY}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDay = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const hhmm = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export function outcomeText(g: Game | undefined, o: Outcome) {
  if (!g) return o;
  return o === "W" ? `${g.home} win` : o === "L" ? `${g.away} win` : `${g.home} v ${g.away} draw`;
}

export function ComboCard({
  result: r,
  games,
  plans,
  single,
  onLoad,
}: {
  result: ComboResult;
  games: Map<string, Game>;
  plans: SavedPlan[];
  single?: boolean;
  onLoad: (r: ComboResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const n = r.legs.length;
  const total = 3 ** n;
  const legGames = r.legs.map((l) => games.get(l.gameId));
  const excludedSc = r.excluded === null ? null : scenariosFor(n)[r.excluded]!;
  const exposure = findExposure(
    legGames.flatMap((g) => (g ? [g.home, g.away] : [])),
    plans
      .filter((p) => p.status === "Pending")
      .map((p) => ({
        id: p.id,
        title: p.title,
        names: p.events.flatMap((e) => [e.name, ...(e.matchup ? e.matchup.split(" vs ") : [])]),
      })),
  );
  const mixed = r.book === null;

  return (
    <article className="overflow-hidden rounded-md border bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/60 px-3 py-2">
        {r.full ? (
          <span className="flex items-center gap-1 rounded bg-cta px-2 py-0.5 text-[11px] font-bold uppercase text-cta-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Guaranteed · {total}/{total}
          </span>
        ) : (
          <span className="rounded bg-gold/30 px-2 py-0.5 text-[11px] font-bold uppercase text-secondary-foreground">
            {total - 1}/{total} covered
          </span>
        )}
        <span className="rounded bg-card px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground ring-1 ring-border">
          {single ? "Single-game arb · " : ""}
          {mixed ? "Best odds · several books" : bookName(r.book)}
        </span>
        <span className={`ml-auto font-display text-xl font-black tabular-nums ${r.full ? "text-up" : "text-primary"}`}>
          +{r.profitPct.toFixed(2)}%
        </span>
      </div>

      <ul className="divide-y">
        {r.legs.map((l, k) => {
          const g = legGames[k];
          return (
            <li key={l.gameId} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:grid-cols-[auto_1fr_auto]">
              <span className="grid h-7 w-7 place-items-center rounded bg-primary text-xs font-black text-primary-foreground">
                {EVENT_LETTERS[k]}
              </span>
              <div className="min-w-0 text-[13px]">
                <p className="truncate font-semibold">
                  {g ? `${g.home} – ${g.away}` : l.gameId}
                </p>
                {g && (
                  <p className="truncate text-[11px] text-muted-foreground">
                    {g.flag} {g.league} · {fmtDay(g.kickoff)} {hhmm(g.kickoff)}
                  </p>
                )}
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-1 sm:col-span-1">
                {(["W", "D", "L"] as const).map((o) => (
                  <div
                    key={o}
                    className={`flex min-w-16 flex-col items-center rounded-sm px-1.5 py-1 ${
                      excludedSc?.[k] === o ? "bg-down/10 ring-1 ring-down/40" : "bg-odd"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase text-muted-foreground">{o === "W" ? "1" : o === "D" ? "X" : "2"}</span>
                    <span className="text-[13px] font-bold tabular-nums text-odd-foreground">{l.odds[o].toFixed(2)}</span>
                    {mixed && <span className="max-w-16 truncate text-[9px] text-muted-foreground">{bookName(l.books[o])}</span>}
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-1.5 border-t px-3 py-2 text-xs">
        {excludedSc ? (
          <p className="text-muted-foreground">
            Uncovered: <b className="text-foreground">{excludedSc.map((o, k) => outcomeText(legGames[k], o)).join(" + ")}</b>{" "}
            ({excludedSc.join("+")}) · <b className="text-down">{(r.excludedProb * 100).toFixed(1)}%</b> implied chance it
            happens.
          </p>
        ) : (
          <p className="font-semibold text-up">Every one of the {total} results pays out — no risk at these prices.</p>
        )}
        {exposure.length > 0 && (
          <p className="flex items-start gap-1 font-semibold text-destructive">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            Already exposed: {exposure.map((e) => `${e.name} (${e.plans.join(", ")})`).join("; ")}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setOpen(true)}
            className="flex h-8 items-center gap-1 rounded border border-input px-3 text-xs font-bold uppercase text-secondary-foreground hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          <button onClick={() => onLoad(r)} className="btn-cta h-8 px-3 text-xs">
            <ArrowRightLeft className="h-3.5 w-3.5" /> Load into Calculator
          </button>
        </div>
      </div>

      <PreviewDialog open={open} onOpenChange={setOpen} result={r} legGames={legGames} />
    </article>
  );
}

function PreviewDialog({
  open,
  onOpenChange,
  result: r,
  legGames,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  result: ComboResult;
  legGames: (Game | undefined)[];
}) {
  const n = r.legs.length;
  const rows = dutchStakes(
    r.legs.map((l) => l.odds),
    r.excluded,
    PREVIEW_BUDGET,
  );
  const scenarios = scenariosFor(n);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Slip preview · {money(PREVIEW_BUDGET)} budget</DialogTitle>
          <DialogDescription>
            {r.book === null ? "Best price per result, placed at different bookmakers." : `Every stake placed at ${bookName(r.book)}.`}{" "}
            Stakes are split so each covered result returns the same.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto rounded border">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-panel-head text-[10px] font-bold uppercase text-secondary-foreground">
              <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:text-left">
                <th>#</th>
                <th>Scenario</th>
                <th>Odds</th>
                <th>Stake</th>
                <th>Return</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, i) => {
                const ret = row.stake * row.odds;
                return (
                  <tr key={i} className={`[&>td]:px-2 [&>td]:py-1.5 ${row.excluded ? "bg-down/5 text-muted-foreground" : ""}`}>
                    <td className="tabular-nums">{i + 1}</td>
                    <td>
                      <p className="font-bold text-primary">{scenarios[i]!.map((o, k) => `${EVENT_LETTERS[k]}${o}`).join("+")}</p>
                      <p className="max-w-72 truncate text-[11px] text-muted-foreground">
                        {scenarios[i]!.map((o, k) => outcomeText(legGames[k], o)).join(" · ")}
                      </p>
                    </td>
                    <td className="font-bold tabular-nums">{row.odds.toFixed(2)}</td>
                    <td className="tabular-nums">{row.excluded ? "Uncovered" : money(row.stake)}</td>
                    <td className="tabular-nums">{money(ret)}</td>
                    <td className={`font-bold tabular-nums ${ret - PREVIEW_BUDGET >= 0 ? "text-up" : "text-down"}`}>
                      {money(ret - PREVIEW_BUDGET)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
