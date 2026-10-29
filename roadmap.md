# Roadmap

- [x] Betting home page with sample matches and bet slip
- [x] Cover Calculator page
- [x] Scanner page (/scanner) with sample odds, combo cards, preview, load into Calculator
- [x] Edge page (/edge): value ranking, structure ladder, market margins, expected vs actual (sample data)
- [x] My Bets page (/my-bets): status tabs, settle with confirm/edit, reset, open, delete
- [x] Stats page (/stats): period filter, 8 KPIs, 4 charts, per-team table, CSV export
- [x] Login page (/login): OctoOdds sign-in/sign-up on the shared Supabase project; header Log in / Log out
- [ ] Reset password, route guards and paywall/payment, profile, admin (port from OctoOdds)
- [x] Calculator: sign-in required; plans saved/updated/deleted in the Supabase `bets` table (shared with OctoOdds); sample-data prefill and match picker removed
- [x] Scanner: live odds via a server-side Odds API proxy (key hidden, shared cache, paid-user check), live league list, by-date cross-league and by-league scans, credits + cache badges, Force rescan, Demo; exposure against saved bets; quote staleness measured against the clock (15 min)
- [x] My Bets and Stats on the Supabase `bets` table (settle/reset/delete persisted; sample-bet loaders removed)
- [x] Admin page (/admin): members, grant/revoke plans, roles, paywall switch; Admin tab for admins
- [ ] Reset password, payment page, profile page
- [ ] Edge on live scans (it already reads the Scanner's stored scan)
