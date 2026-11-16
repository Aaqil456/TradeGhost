# TradeGhost — Tasks

Phased implementation. A task is only marked complete when its tests pass (where applicable). `- [ ]` pending, `- [x]` done.

## Phase 1 — Planning & Kiro setup
- [x] Create steering documents (`.kiro/steering/*.md`)
- [x] Create spec (requirements, design, tasks)
- [x] Create Kiro hooks (run-financial-tests, typecheck-on-save, run-tests-on-task-complete)
- [x] Scaffold project: `package.json`, Vite 8, Tailwind v4, TS strict, Vitest, ESLint/Prettier, `.gitignore` (keep `.kiro` tracked), MIT `LICENSE`, `README.md` skeleton, `public/sample-trade-history.csv`, `public/_redirects`
- [x] Verify scaffold builds (`npm install` + `npm run build`) and typechecks

## Phase 2 — App foundation
- [x] AppShell: sidebar nav (desktop) + responsive mobile nav
- [x] React Router 7 routes + layout route
- [x] Design tokens in `src/index.css` (`@theme`): dark palette, green/red semantics, brand accent, tabular figures
- [x] Base UI components: `Card`, `MetricCard`, `Button`, `Badge`, `EmptyState`, `Spinner`, `SearchInput`
- [x] `Settings` page: privacy/data-handling explanation, disclaimers, about
- [x] Empty-state layout for Overview/Analytics/History with Import CTA
- [x] `store/AppContext` + reducer skeleton (session-only, no persistence)

## Phase 3 — CSV processing
- [x] `lib/finance/decimal.ts` config + `lib/finance/types.ts` domain types
- [x] `lib/csv/parse.ts` (PapaParse wrapper)
- [x] `lib/csv/schema.ts` + `lib/csv/validate.ts` (collect-all errors, row-numbered)
- [x] Missing-fees confirm flow (no silent zeroing)
- [x] `FileDropzone` component (drag-drop + click)
- [x] Validation report UI (errors/warnings/skipped)
- [x] `TradePreview` table (computed net P&L + WIN/LOSS)
- [x] Sample template download
- [x] Remove/re-upload dataset → back to empty state
- [x] Wire import into `AppContext`

## Phase 4 — Financial analytics
- [x] `lib/finance/pnl.ts` (gross/net, LONG/SHORT)
- [x] `lib/finance/metrics.ts` (totals, win rate, averages, best/worst)
- [x] `lib/finance/cumulative.ts` (chronological running sum)
- [x] `lib/finance/drawdown.ts` (realized P&L drawdown, labeled)
- [x] `lib/finance/pairs.ts` (per-pair breakdown)
- [x] `lib/finance/insights.ts` (data-gated behavior insights)
- [x] `lib/format/format.ts` (currency/number/date/pct; the only Number display boundary)
- [x] Overview dashboard: metric cards + cumulative chart + pair breakdown
- [x] Recharts theming + custom tooltip
- [x] Analytics page: extremes + insights
- [x] History table: search/filter/sort + green/red coding

## Phase 4b — Live data, forecast, suggestions (v0.2)
- [x] Spec + steering updated (wallet address only, public API)
- [x] `lib/sources/hyperliquid.ts` (fetch, paginate, fills to trades) + reconciliation tests
- [x] Store: live source, 60 s auto-refresh, connect/disconnect
- [x] Connect wallet UI + live status
- [x] `lib/finance/forecast.ts` + Forecast page
- [x] `lib/finance/suggestions.ts` + Analytics panel

## Phase 5 — Testing & refinement
- [x] Property-based finance tests (fast-check)
- [x] Unit tests: metrics, pairs, cumulative, drawdown, insights
- [x] CSV validation tests (malformed, missing cols, wrong types, blanks, BOM, delimiters)
- [x] Edge-case tests (0 trades, all-win, all-loss, single trade)
- [x] Component tests (dashboard, empty state, history table)
- [ ] Responsive polish + accessibility pass
- [x] Bug fixes

## Phase 6 — Deployment prep
- [x] README: install, run, build, deploy (Cloudflare Pages), Node 22 LTS note
- [x] Verify `.kiro/` tracked and not gitignored
- [x] `LICENSE` (MIT)
- [x] Cloudflare Pages config (`public/_redirects`, build/output settings documented)
- [x] `npm run build` clean
- [ ] Deploy to Cloudflare Pages + verify public URL
