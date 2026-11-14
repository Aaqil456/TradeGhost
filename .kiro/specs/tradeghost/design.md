# TradeGhost — Design

## 1. Architecture
Single-page React app, fully client-side. See `.kiro/steering/architecture.md` for the verified stack and principles. Summary:
- React 19 + TS (strict), Vite 8, Tailwind CSS v4, Recharts 3, PapaParse 5, decimal.js 10, React Router 7.
- Pure finance layer; Decimal core / Number edge; collect-all validation; no persistence; Cloudflare Pages deploy.

## 2. Data model
```ts
// src/lib/finance/types.ts
type Side = 'LONG' | 'SHORT';
interface Trade {
  id: string;            // stable id (row index + hash) for keys and sort tie-breaks
  date: Date;             // parsed + normalized
  symbol: string;         // uppercase, trimmed
  side: Side;
  entryPrice: Decimal;
  exitPrice: Decimal;
  quantity: Decimal;      // > 0
  fees: Decimal;          // >= 0 (0 only after explicit confirm for blanks)
}

interface TradeComputed extends Trade {
  grossPnl: Decimal;
  netPnl: Decimal;
  result: 'WIN' | 'LOSS'; // netPnl > 0 ? WIN : LOSS (netPnl == 0 → LOSS by convention, configurable)
}

interface Metrics {
  totalNetPnl: Decimal; totalTrades: number; winners: number; losers: number;
  winRate: Decimal; avgWin: Decimal; avgLoss: Decimal;
  bestTrade: TradeComputed | null; worstTrade: TradeComputed | null;
}

interface PairBreakdown {
  symbol: string; netPnl: Decimal; trades: number; winners: number; losers: number;
  winRate: Decimal; avgWin: Decimal; avgLoss: Decimal;
}

interface CumulativePoint { date: string; cumulative: number; drawdown: number; }
```
`Decimal` is imported from the preconfigured `src/lib/finance/decimal.ts`.

## 3. Module design
- `lib/finance/decimal.ts` — configures + re-exports `Decimal`, helpers `toDec`, `isPositive`.
- `lib/finance/pnl.ts` — `grossPnl(trade)`, `netPnl(trade)`, `computeTrade(t) → TradeComputed`.
- `lib/finance/metrics.ts` — `computeMetrics(trades) → Metrics`.
- `lib/finance/cumulative.ts` — `cumulativePnl(trades) → CumulativePoint[]` (sorted, running sum).
- `lib/finance/drawdown.ts` — `realizedDrawdown(series) → { max, current }` from cumulative series.
- `lib/finance/pairs.ts` — `pairBreakdown(trades) → PairBreakdown[]`.
- `lib/finance/insights.ts` — `generateInsights(trades, metrics, pairs) → Insight[]`, each gated by sample thresholds.
- `lib/csv/parse.ts` — wraps PapaParse (`header:true`, `dynamicTyping:false`, `skipEmptyLines:true`).
- `lib/csv/schema.ts` — required columns + types.
- `lib/csv/validate.ts` — `validateRows(raw) → ParseResult` (collect-all).
- `lib/format/format.ts` — `fmtCurrency`, `fmtNumber`, `fmtPct`, `fmtDate` (Decimal → string; the only Number boundary for display).
- `store/AppContext.tsx` — context + `useReducer` `{ trades, meta }`; selectors memoize finance output.
- `features/import`, `features/dashboard`, `features/analytics`, `features/history`.
- `components/layout`, `components/ui`, `components/charts`.

## 4. State design
- Single `AppState { trades: TradeComputed[] | null; meta: { fileName, importedAt, rowCount } | null }`.
- Actions: `IMPORT_TRADES`, `CLEAR_TRADES`.
- Selectors (`useMetrics`, `useCumulative`, `usePairs`, `useInsights`) wrap `useMemo` over pure finance functions.
- No persistence: state is held only in the React tree and lost on reload (by design, communicated in UI).

## 5. Routing & views
React Router 7 layout route (`AppShell`) with nav: Overview, Analytics, History, Import, Settings.
- `/overview` — metric cards + cumulative P&L chart + pair breakdown (or empty state).
- `/analytics` — extremes + behavior insights (or empty state).
- `/history` — filterable/sortable table (or empty state).
- `/import` — upload flow (dropzone → validation report → missing-fees confirm → preview → confirm → import).
- `/settings` — privacy/data-handling explanation, disclaimers, about.

## 6. Design system
Dark theme default; tokens in `src/index.css` via Tailwind v4 `@theme`. Green = positive, red = negative; brand teal/green accent; Inter with tabular figures. Reusable primitives: `Card`, `MetricCard`, `Button`, `Badge`, `Table`, `FileDropzone`, `EmptyState`, `SearchInput`, `Spinner`, `ChartCard`. Subtle motion via Tailwind transitions + CSS keyframes. Responsive desktop sidebar → mobile nav.

## 7. CSV import flow
1. User drops/selects file → `lib/csv/parse.ts` (PapaParse) → raw string rows.
2. `lib/csv/validate.ts` → `ParseResult` (all errors collected, row-numbered).
3. If blank-fee rows exist → `MissingFeesConfirm` step; only on confirm are they zeroed.
4. `TradePreview` shows valid rows with computed net P&L + WIN/LOSS.
5. User confirms → `IMPORT_TRADES` → context holds `TradeComputed[]`.
6. `CLEAR_TRADES` returns to empty state and lets the user upload another file.

## 8. Testing design
- Property tests (`tests/finance/property.test.ts`) over the pure engine with `fast-check` arbitraries generating decimal strings.
- Unit tests for each finance module + CSV validation + edge cases.
- Component tests with `@testing-library/react` for dashboard, empty state, and history table behavior.
- Fixtures in `tests/fixtures`; the downloadable template doubles as a fixture.

## 9. Deployment
`vite build` → `dist/` deployed to **Cloudflare Pages**. `public/_redirects` (`/* /index.html 200`) provides SPA fallback (copied to `dist/` by Vite). `.kiro/` stays tracked in Git.
