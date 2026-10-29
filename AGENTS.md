<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Bet slip math (add/replace/remove picks, accumulator odds, stake limits) lives in `src/lib/betslip.ts` with tests beside it; UI components only call it, so rules stay testable.
- Sample events live in `src/lib/sample-data.ts`; swap this module for a real feed later without touching components.
- Cover calculator math (scenarios, tax-aware payouts, Balance / Balance win / Turbo / give-up plans, exposure) lives in `src/lib/calculator.ts` with tests beside it; the page only calls it.
- Calculator plans are stored in the shared OctoOdds Supabase `bets` table via `src/lib/plans-db.ts` (fetch/insert/update/delete). `src/lib/plan-mapping.ts` converts SavedPlan ↔ bet row using OctoOdds' conventions (row names "AW + BL", tax as a rate, won_scenario name or "__LOST__") and has tests beside it. `/calculator` is gated by `ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`). My Bets and Stats read the same table; settling/resetting writes `won_scenario`, `settled_at` and corrected `rows` via `savePlanResult`. Sample bets (`src/lib/sample-bets.ts`) are no longer loaded by any page. `/admin` (admins only, `ProtectedRoute requireAdmin`) ports OctoOdds' member management: grant/revoke plans, roles, and the `app_settings.paywall_enabled` switch — all shared with OctoOdds.
- Scanner odds are live from The Odds API, ported from OctoOdds: `src/lib/live-odds.ts` (client types, `toFeedGames` converter, server functions) and `src/lib/odds-server.ts` (server-only: `ODDS_API_KEY` from `.env.local`, never `VITE_`-prefixed; shared 3-minute cache with in-flight coalescing; `assertApprovedUser` so only signed-in paid accounts can spend credits). Live fixtures are converted to the `odds-feed.ts` `Game` shape so the scanner/edge math is unchanged; `odds-feed.ts`'s deterministic generator is now only the Demo source. 1xBet is `1xbet` here and `onexbet` in the API (`apiBookKey`/`feedBookId`). `/scanner` is gated by `ProtectedRoute`.
- Scanner/Edge math (dutching combos, full covers, safest exclusion, arbs, EV, margins) lives in `src/lib/scanner.ts` and `src/lib/edge.ts` with tests beside them; pages only call them.
- Scanner settings and the last scan persist in the browser via `src/lib/scanner-store.ts`; Edge reads the same scan from there. Combos reach the Calculator through the one-shot handoff in `src/lib/calculator-plans.ts`.
- Bet results (pending/won/lost/break-even), settling, and all Stats figures live in `src/lib/bets.ts` with tests beside it; status is always derived via `outcomeOf(computeBet(bet))`, never stored, so My Bets, Stats and the Calculator can't disagree.
- Auth uses the same Supabase project as OctoOdds (accounts/profiles are shared). The client lives in `src/lib/supabase.ts`, session/profile/paywall state in `src/lib/auth.tsx` (`AuthProvider` wraps the app in `__root.tsx`). Credentials come from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, gitignored). `/login` is the OctoOdds sliding sign-in/sign-up card restyled in this app's palette (`src/components/auth/AuthSwitch.tsx`).
- My Bets opens a plan in the Calculator through the one-shot `openInCalculator` key in `src/lib/calculator-plans.ts`; demo bets come from `src/lib/sample-bets.ts`.
