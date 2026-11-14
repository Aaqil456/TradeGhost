# TradeGhost — Tasks

Phased implementation. A task is only marked complete when its tests pass (where applicable). `- [ ]` pending, `- [x]` done.

## Phase 1 — Planning & Kiro setup
- [x] Create steering documents (`.kiro/steering/*.md`)
- [x] Create spec (requirements, design, tasks)
- [x] Create Kiro hooks (run-financial-tests, typecheck-on-save, run-tests-on-task-complete)
- [x] Scaffold project: `package.json`, Vite 8, Tailwind v4, TS strict, Vitest, ESLint/Prettier, `.gitignore` (keep `.kiro` tracked), MIT `LICENSE`, `README.md` skeleton, `public/sample-trade-history.csv`, `public/_redirects`
- [x] Verify scaffold builds (`npm install` + `npm run build`) and typechecks

## Phase 2 — App foundation
- [-] AppShell: sidebar nav (desktop) + responsive mobile nav
- [~] React Router 7 routes + layout route
- [~] Design tokens in `src/index.css` (`@theme`): dark palette, green/red semantics, brand accent, tabular figures
- [~] Base UI components: `Card`, `MetricCard`, `Button`, `Badge`, `EmptyState`, `Spinner`, `SearchInput`
- [~] `Settings` page: privacy/data-handling explanation, disclaimers, about
- [~] Empty-state layout for Overview/Analytics/History with Import CTA
- [~] `store/AppContext` + reducer skeleton (session-only, no persistence)

## Phase 3 — CSV processing
- [~] `lib/finance/decimal.ts` config + `lib/finance/types.ts` domain types
- [~] `lib/csv/parse.ts` (PapaParse wrapper)
- [~] `lib/csv/schema.ts` + `lib/csv/validate.ts` (collect-all errors, row-numbered)
- [~] Missing-fees confirm flow (no silent zeroing)
- [~] `FileDropzone` component (drag-drop + click)
- [~] Validation report UI (errors/warnings/skipped)
- [~] `TradePreview` table (computed net P&L + WIN/LOSS)
- [~] Sample template download
- [~] Remove/re-upload dataset → back to empty state
- [~] Wire import into `AppContext`

## Phase 4 — Financial analytics
- [~] `lib/finance/pnl.ts` (gross/net, LONG/SHORT)
- [~] `lib/finance/metrics.ts` (totals, win rate, averages, best/worst)
- [~] `lib/finance/cumulative.ts` (chronological running sum)
- [~] `lib/finance/drawdown.ts` (realized P&L drawdown, labeled)
- [~] `lib/finance/pairs.ts` (per-pair breakdown)
- [~] `lib/finance/insights.ts` (data-gated behavior insights)
- [~] `lib/format/format.ts` (currency/number/date/pct; the only Number display boundary)
- [~] Overview dashboard: metric cards + cumulative chart + pair breakdown
- [~] Recharts theming + custom tooltip
- [~] Analytics page: extremes + insights
- [~] History table: search/filter/sort + green/red coding

## Phase 5 — Testing & refinement
- [~] Property-based finance tests (fast-check)
- [~] Unit tests: metrics, pairs, cumulative, drawdown, insights
- [~] CSV validation tests (malformed, missing cols, wrong types, blanks, BOM, delimiters)
- [~] Edge-case tests (0 trades, all-win, all-loss, single trade)
- [~] Component tests (dashboard, empty state, history table)
- [~] Responsive polish + accessibility pass
- [~] Bug fixes

## Phase 6 — Deployment prep
- [~] README: install, run, build, deploy (Cloudflare Pages), Node 22 LTS note
- [~] Verify `.kiro/` tracked and not gitignored
- [~] `LICENSE` (MIT)
- [~] Cloudflare Pages config (`public/_redirects`, build/output settings documented)
- [~] `npm run build` clean
- [~] Deploy to Cloudflare Pages + verify public URL
