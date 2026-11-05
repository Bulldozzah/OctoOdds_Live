import { useMemo } from "react";
import { Lock } from "lucide-react";
import { EVENT_LETTERS, scenarioLabel, type Outcome } from "@/lib/calculator";
import { SAMPLE_BUDGET, samplePlan } from "@/lib/sample-showcase";
import type { Match } from "@/lib/sample-data";
import { money } from "@/components/bets/format";

const outcomeText = (m: Match, o: Outcome) =>
  o === "W" ? `${m.home} win` : o === "L" ? `${m.away} win` : "Draw";

/** A fixed, read-only Cover Calculator plan built from the sample fixtures. */
export function SampleCalculator({ compact = false }: { compact?: boolean }) {
  const plan = useMemo(samplePlan, []);
  const { matches, scenarios, odds, result, givenUp, profitPct } = plan;
  const covered = scenarios.length - (givenUp === null ? 0 : 1);

  return (
    <section className="overflow-hidden rounded-md bg-card text-left text-foreground shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-gradient-header px-4 py-2.5 text-header-foreground">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide">
          Cover calculator · sample
        </h3>
        <span className="flex items-center gap-1 text-[11px] text-header-muted">
          <Lock className="h-3 w-3" /> Read-only
        </span>
        <span className="ml-auto text-xs text-header-muted">
          Stake <b className="text-header-foreground tabular-nums">{money(SAMPLE_BUDGET)}</b> ·
          covers{" "}
          <b className="text-header-foreground">
            {covered} of {scenarios.length}
          </b>{" "}
          ·{" "}
          <b className="text-cta tabular-nums">
            {profitPct >= 0 ? "+" : ""}
            {profitPct.toFixed(2)}%
          </b>
        </span>
      </div>

      <div className={`grid gap-2 p-3 ${compact ? "sm:grid-cols-2" : "md:grid-cols-2"}`}>
        {matches.map((m, k) => (
          <div key={m.id} className="rounded-md border bg-muted/50 p-2.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded bg-primary text-[11px] font-black text-primary-foreground">
                {EVENT_LETTERS[k]}
              </span>
              <span className="truncate">
                {m.home} vs {m.away}
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {m.flag} {m.league} · {m.start}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(["W", "D", "L"] as const).map((o) => (
                <span key={o} className="odd-btn h-8 cursor-default">
                  <span className="mr-1 text-[10px] text-muted-foreground">{o}</span>
                  {(o === "W" ? m.odds.home : o === "D" ? m.odds.draw! : m.odds.away).toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={compact ? "max-h-72 overflow-auto" : "overflow-x-auto"}>
        <table className="w-full min-w-[520px] text-[12px]">
          <thead className="sticky top-0 bg-panel-head text-[10px] font-bold uppercase text-secondary-foreground">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
              <th>Scenario</th>
              {!compact && <th>Result</th>}
              <th className="text-right">Odds</th>
              <th className="text-right">Stake</th>
              <th className="text-right">Net payout</th>
              <th className="text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.rows.map((r, i) => {
              const off = i === givenUp;
              return (
                <tr
                  key={i}
                  className={`[&>td]:px-3 [&>td]:py-1.5 ${off ? "bg-muted/60 opacity-60" : ""}`}
                >
                  <td className="font-bold text-primary">{scenarioLabel(scenarios[i]!)}</td>
                  {!compact && (
                    <td className="max-w-64 truncate text-muted-foreground">
                      {scenarios[i]!.map((o, k) => outcomeText(matches[k]!, o)).join(" · ")}
                    </td>
                  )}
                  <td className="text-right font-bold tabular-nums">{odds[i]!.toFixed(2)}</td>
                  <td className="text-right tabular-nums">{off ? "Given up" : money(r.stake)}</td>
                  <td className="text-right tabular-nums">{money(r.net)}</td>
                  <td
                    className={`text-right font-bold tabular-nums ${r.profit >= 0 ? "text-up" : "text-down"}`}
                  >
                    {r.profit >= 0 ? "+" : ""}
                    {money(r.profit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
