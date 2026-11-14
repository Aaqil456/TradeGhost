# TradeGhost — Testing Steering

## Stack
- Vitest 5 (runner) + happy-dom + @testing-library/react (components)
- fast-check 4 (property-based) for the finance engine

## Property-based tests (`tests/finance/property.test.ts`)
- profitable LONG ⇒ gross > 0
- profitable SHORT ⇒ gross > 0
- net = gross − fees (Decimal-exact)
- increasing fees ⇒ net never increases (monotonic)
- winRate ∈ [0, 100]
- last cumulative P&L = Σ nets
- avgWin × countWin = ΣWins; avgLoss × countLoss = ΣLosses
- realized drawdown ≤ 0

## Unit tests
- Every metric, per-pair breakdown, insights gating, and edge cases (0 trades, all-win, all-loss, single trade, mixed LONG/SHORT).

## CSV validation tests
- Malformed file, missing columns, wrong types, negatives, blank fees (confirm flow), empty/header-only, BOM, alternate delimiters, extra columns.

## Component tests
- Dashboard renders metrics from fixture data (never hardcoded), empty state, history search/filter/sort, green/red coding.

## Fixtures
- Sample data lives only in `tests/fixtures` and the downloadable template. Never fake numbers in the running app.

## Running
- `npm test` runs `vitest run`. Property tests live in `tests/finance/property.test.ts`.
