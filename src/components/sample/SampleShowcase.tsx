import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calculator, Eye, History, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { sampleScan } from "@/lib/sample-showcase";
import { sampleBets } from "@/lib/sample-bets";
import { computeBet, outcomeOf, summarize } from "@/lib/bets";
import { ComboCard } from "@/components/scanner/ComboCard";
import { StatusBadge } from "@/components/bets/MyBets";
import { money, pct, signedMoney, toneOf, when } from "@/components/bets/format";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { SampleCalculator } from "./SampleCalculator";

/**
 * Public, read-only tour of the tools with made-up data. Nothing here reads
 * live odds or the user's saved plans, and nothing can be edited or saved.
 */
export function SampleShowcase() {
  // Kickoffs and bet dates are relative to "now"; computing them after mount
  // keeps the server render and the browser's first render identical.
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []);
  const scan = useMemo(() => (now ? sampleScan(now) : null), [now]);
  const gamesById = useMemo(() => new Map((scan?.games ?? []).map((g) => [g.id, g])), [scan]);
  const bets = useMemo(() => (now ? sampleBets(now) : []), [now]);
  const summary = useMemo(() => summarize(bets), [bets]);

  const locked = () =>
    toast("This is sample data", {
      description: "Log in with an active plan to load live combos into your own Calculator.",
    });

  return (
    <main className="mx-auto max-w-[1400px] space-y-4 px-2 py-3 sm:px-3">
      <SampleBanner />

      <Section
        icon={Calculator}
        title="Cover calculator"
        hint="Two sample fixtures, a 100 stake, the best give-up plan"
      >
        <SampleCalculator />
      </Section>

      <Section
        icon={ScanSearch}
        title="Odds scanner"
        hint="Top two-game combos from demo-priced fixtures"
      >
        {!scan ? (
          <Loading />
        ) : scan.results.length === 0 ? (
          <p className="rounded-md bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-card">
            No sample combos clear 1% right now.
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {scan.results.map((r) => (
              <ComboCard key={r.id} result={r} games={gamesById} plans={[]} onLoad={locked} />
            ))}
          </div>
        )}
      </Section>

      <Section
        icon={History}
        title="My bets & stats"
        hint="A made-up history of settled and open plans"
      >
        {!now ? (
          <Loading />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi label="Bets" value={String(summary.total)} />
              <Kpi label="Staked" value={money(summary.staked)} />
              <Kpi label="Net" value={signedMoney(summary.net)} tone={toneOf(summary.net)} />
              <Kpi label="ROI" value={pct(summary.roi)} tone={toneOf(summary.roi ?? 0)} />
              <Kpi label="Win rate" value={pct(summary.winRate)} />
              <Kpi label="Open" value={`${summary.pending} · ${money(summary.pendingExposure)}`} />
            </div>
            <div className="overflow-x-auto rounded-md bg-card shadow-card">
              <table className="w-full min-w-[620px] text-[12px]">
                <thead className="bg-panel-head text-[10px] font-bold uppercase text-secondary-foreground">
                  <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
                    <th>Placed</th>
                    <th>Plan</th>
                    <th className="text-right">Staked</th>
                    <th>Result</th>
                    <th className="text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bets.map((b) => {
                    const f = computeBet(b);
                    const o = outcomeOf(f);
                    return (
                      <tr key={b.id} className="[&>td]:px-3 [&>td]:py-2">
                        <td className="whitespace-nowrap text-muted-foreground">
                          {when(b.createdAt)}
                        </td>
                        <td>
                          <p className="font-semibold">{b.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {b.events.map((e) => e.matchup).join(" · ")}
                          </p>
                        </td>
                        <td className="text-right tabular-nums">{money(f.totalStaked)}</td>
                        <td>
                          <StatusBadge outcome={o} />
                        </td>
                        <td className={`text-right font-bold tabular-nums ${toneOf(f.net)}`}>
                          {o === "pending" ? "—" : signedMoney(f.net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <footer className="space-y-2 px-1 pb-4 text-center text-[11px] text-muted-foreground">
        <LegalLinks className="font-semibold" />
        <p>
          OctoOdds is an analytics tool: no bets are placed, held or paid out on OctoOdds. Odds move
          — always check prices at the bookmaker. 18+ only.
        </p>
      </footer>
    </main>
  );
}

function SampleBanner() {
  const { user, loading, hasAccess } = useAuth();
  return (
    <section className="flex flex-wrap items-center gap-3 overflow-hidden rounded-md bg-gradient-header px-4 py-3 text-header-foreground shadow-card">
      <Eye className="h-5 w-5 shrink-0 text-cta" />
      <div className="mr-auto">
        <h1 className="font-display text-xl font-black uppercase italic tracking-tight">
          Sample <span className="text-cta">tour</span>
        </h1>
        <p className="text-xs text-header-muted">
          Made-up data, read-only. Nothing here is live and nothing can be changed or saved.
        </p>
      </div>
      {loading ? null : hasAccess ? (
        <Link to="/calculator" className="btn-cta h-9 px-4 text-xs">
          Open the calculator
        </Link>
      ) : user ? (
        <span className="max-w-xs text-xs text-header-muted">
          Your account is signed in — subscribe to unlock live odds and your own plans.
        </span>
      ) : (
        <Link to="/login" className="btn-cta h-9 px-4 text-xs">
          Log in
        </Link>
      )}
    </section>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Eye;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">{title}</h2>
        <span className="text-xs text-muted-foreground">· {hint}</span>
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-card px-3 py-2 shadow-card">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className={`font-display text-lg font-black tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md bg-card px-4 py-8 text-sm text-muted-foreground shadow-card">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      Loading sample…
    </div>
  );
}
