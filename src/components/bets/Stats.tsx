import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calculator, ChevronDown, FileDown, ListChecks, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SavedPlan } from "@/lib/calculator-plans";
import { fetchPlans } from "@/lib/plans-db";
import {
  aggregateByTeam,
  dailySeries,
  dayKey,
  equityCurve,
  filterPeriod,
  summarize,
  toCsv,
  type Period,
} from "@/lib/bets";
import { money, pct, signedMoney, toneOf } from "./format";

const PERIODS: { key: Period; label: string }[] = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
  { key: "all", label: "All time" },
];

const tick = { fontSize: 11, fill: "var(--muted-foreground)" };
const tooltipStyle = { fontSize: 12, borderRadius: 6, border: "1px solid var(--border)" };

export function Stats() {
  const [bets, setBets] = useState<SavedPlan[] | null>(null);
  const [period, setPeriod] = useState<Period>(30);
  const [now, setNow] = useState(0);
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoadError("");
    setNow(Date.now());
    fetchPlans()
      .then(setBets)
      .catch((e: Error) => setLoadError(e.message));
  };
  useEffect(load, []);

  const inPeriod = useMemo(
    () => (bets ? filterPeriod(bets, period, now) : []),
    [bets, period, now],
  );
  const s = useMemo(() => summarize(inPeriod), [inPeriod]);
  const daily = useMemo(
    () => dailySeries(inPeriod).map((d) => ({ ...d, label: d.day.slice(5) })),
    [inPeriod],
  );
  const equity = useMemo(
    () => equityCurve(inPeriod).map((p) => ({ ...p, label: dayKey(p.at).slice(5) })),
    [inPeriod],
  );
  const teams = useMemo(() => aggregateByTeam(inPeriod), [inPeriod]);
  const donut = [
    { name: "Wins", value: s.wins, color: "var(--up)" },
    { name: "Losses", value: s.losses, color: "var(--down)" },
    { name: "Break-even", value: s.breakeven, color: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0);

  const exportCsv = () => {
    if (inPeriod.length === 0) {
      toast.error("No bets in this period");
      return;
    }
    const blob = new Blob([toCsv(inPeriod)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `octoodds-ledger-${period === "all" ? "all-time" : `${period}-days`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-[1400px] space-y-3 px-2 py-3 sm:px-3">
      <section className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-3 bg-gradient-header px-4 py-3 text-header-foreground">
          <div className="mr-auto">
            <h1 className="font-display text-xl font-black uppercase italic tracking-tight">
              <span className="text-cta">Stats</span>
            </h1>
            <p className="text-xs text-header-muted">
              How your saved bets are doing, worked out from My bets.
            </p>
          </div>
          <div className="flex rounded-md bg-header-deep/60 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={String(p.key)}
                onClick={() => setPeriod(p.key)}
                className={`h-8 rounded px-3 text-xs font-bold uppercase ${
                  period === p.key
                    ? "bg-cta text-cta-foreground"
                    : "text-header-muted hover:text-header-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} className="btn-ghost-header h-9 px-3 text-xs">
            <FileDown className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="group flex w-full items-center gap-2 bg-panel-head px-4 py-2 text-left text-xs font-bold uppercase text-secondary-foreground">
            <ListChecks className="h-4 w-4" /> How to use Stats
            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid gap-4 px-4 py-3 text-xs md:grid-cols-[2fr_1fr]">
              <ol className="list-decimal space-y-1 pl-4">
                <li>
                  Build a cover plan in the{" "}
                  <Link to="/calculator" className="font-semibold text-primary underline">
                    Calculator
                  </Link>
                  .
                </li>
                <li>Press Save — it lands in My bets as Pending.</li>
                <li>
                  After the games, open{" "}
                  <Link to="/my-bets" className="font-semibold text-primary underline">
                    My bets
                  </Link>{" "}
                  and mark the winning scenario, or Mark lost.
                </li>
                <li>Come back here: every figure updates from those results.</li>
              </ol>
              <p className="rounded bg-muted p-2.5 text-muted-foreground">
                Tax comes off winnings only: payout = stake × odds − (stake × odds − stake) × tax.
                Net profit is the winning row's payout minus everything staked across all rows, so a
                bet can have a winning row and still lose money.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {loadError && (
        <section className="rounded-md bg-card px-4 py-10 text-center shadow-card">
          <p className="font-semibold">Couldn't load your bets</p>
          <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          <button onClick={load} className="btn-cta mx-auto mt-4 h-9 px-4 text-xs">
            Try again
          </button>
        </section>
      )}
      {!loadError && bets === null && (
        <p className="flex items-center justify-center gap-2 rounded-md bg-card px-4 py-10 text-sm text-muted-foreground shadow-card">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
        </p>
      )}
      {bets !== null && bets.length === 0 && (
        <section className="rounded-md bg-card px-4 py-10 text-center shadow-card">
          <p className="font-semibold">No saved bets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Stats fills in once you save bets and settle them under My Bets.
          </p>
          <Link to="/calculator" className="btn-cta mx-auto mt-4 h-9 px-4 text-xs">
            <Calculator className="h-4 w-4" /> Open Calculator
          </Link>
        </section>
      )}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Total bets" value={String(s.total)} />
        <Kpi label="Total staked" value={money(s.staked)} />
        <Kpi label="Returns (settled)" value={money(s.returns)} />
        <Kpi label="Net profit (settled)" value={signedMoney(s.net)} tone={toneOf(s.net)} />
        <Kpi
          label="ROI (settled)"
          value={pct(s.roi)}
          tone={s.roi === null ? undefined : toneOf(s.roi)}
        />
        <Kpi label="Pending exposure" value={money(s.pendingExposure)} />
        <Kpi
          label="W / L / Pending"
          value={`${s.wins} / ${s.losses} / ${s.pending}`}
          hint={s.breakeven ? `${s.breakeven} break-even` : undefined}
        />
        <Kpi label="Win rate (settled)" value={pct(s.winRate)} hint="Break-even left out" />
      </section>

      {bets !== null && (
        <section className="grid gap-3 lg:grid-cols-2">
          <ChartPanel
            title="Amount staked per day"
            note="Includes pending bets"
            empty={daily.length === 0}
          >
            <BarChart data={daily}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={tick} />
              <YAxis tick={tick} width={56} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
              <Bar
                dataKey="staked"
                name="Staked"
                fill="var(--primary)"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartPanel>
          <ChartPanel
            title="Net profit per day"
            note="Settled bets only"
            empty={!daily.some((d) => d.net !== 0)}
          >
            <BarChart data={daily.filter((d) => d.net !== 0)}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={tick} />
              <YAxis tick={tick} width={56} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => signedMoney(v)} />
              <Bar dataKey="net" name="Net" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {daily
                  .filter((d) => d.net !== 0)
                  .map((d) => (
                    <Cell key={d.day} fill={d.net > 0 ? "var(--up)" : "var(--down)"} />
                  ))}
              </Bar>
            </BarChart>
          </ChartPanel>
          <ChartPanel
            title="Equity curve"
            note="Running net profit, settled bets in order"
            empty={equity.length === 0}
          >
            <LineChart data={equity}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={tick} />
              <YAxis tick={tick} width={56} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => signedMoney(v)}
                labelFormatter={(_, p) =>
                  (p?.[0]?.payload as { title?: string } | undefined)?.title ?? ""
                }
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Cumulative net"
                stroke="var(--cta)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartPanel>
          <ChartPanel
            title="Settled outcomes"
            note="Wins / losses / break-even"
            empty={donut.length === 0}
          >
            <PieChart>
              <Pie
                data={donut}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {donut.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ChartPanel>
        </section>
      )}

      <section className="overflow-hidden rounded-md bg-card shadow-card">
        <div className="flex flex-wrap items-baseline gap-2 bg-panel-head px-4 py-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-secondary-foreground">
            Per-team performance
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Each bet counts in full for every team named on it, so these totals can be bigger than
            your account totals.
          </p>
        </div>
        {teams.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No bets in this period.
          </p>
        ) : (
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card text-[10px] uppercase text-muted-foreground shadow-[0_1px_0_var(--border)]">
                <tr>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-3 py-2 text-right">Bets</th>
                  <th className="px-3 py-2 text-right">Staked</th>
                  <th className="px-3 py-2 text-right">Net</th>
                  <th className="px-3 py-2 text-right">ROI</th>
                  <th className="px-4 py-2 text-right">Win rate</th>
                </tr>
              </thead>
              <tbody className="divide-y tabular-nums">
                {teams.map((t) => (
                  <tr key={t.team} className="hover:bg-muted/60">
                    <td className="px-4 py-2 font-semibold">{t.team}</td>
                    <td className="px-3 py-2 text-right">{t.bets}</td>
                    <td className="px-3 py-2 text-right">{money(t.staked)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${toneOf(t.net)}`}>
                      {signedMoney(t.net)}
                    </td>
                    <td className={`px-3 py-2 text-right ${t.roi === null ? "" : toneOf(t.roi)}`}>
                      {pct(t.roi)}
                    </td>
                    <td className="px-4 py-2 text-right">{pct(t.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Kpi({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: string | undefined;
  hint?: string | undefined;
}) {
  return (
    <div className="rounded-md bg-card px-4 py-3 shadow-card">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className={`font-display text-xl font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ChartPanel({
  title,
  note,
  empty,
  children,
}: {
  title: string;
  note: string;
  empty: boolean;
  children: React.ReactElement;
}) {
  return (
    <div className="overflow-hidden rounded-md bg-card shadow-card">
      <div className="flex items-baseline justify-between gap-2 bg-panel-head px-4 py-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-secondary-foreground">
          {title}
        </h2>
        <span className="text-[11px] text-muted-foreground">{note}</span>
      </div>
      <div className="h-64 p-3">
        {empty ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">
            Nothing to show for this period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
