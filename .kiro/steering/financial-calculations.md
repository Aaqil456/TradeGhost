# TradeGhost — Financial Calculations Steering

## Precision
`decimal.js` is configured once in `src/lib/finance/decimal.ts`:
```ts
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
```
- `precision: 20` significant digits — far beyond any crypto need.
- `ROUND_HALF_UP` rounds halves away from zero (the conventional choice for money).
- **Decimal at the core, Number at the edge.** Convert to JS `Number` only in `lib/format`, after rounding to display decimals.

## Formulas (computed from `Decimal` values)
- LONG gross = `(exitPrice − entryPrice) × quantity`
- SHORT gross = `(entryPrice − exitPrice) × quantity`
- net = `gross − fees`
- winRate = `(winners / total) × 100`  (defined as `0` when `total = 0`)
- avgWin = `Σ positive net / winners`; avgLoss = `Σ negative net / losers`
- cumulative realized P&L = trades sorted by date ascending, running sum of `net`
- realized P&L drawdown = `cumulative − runningMax` (always `≤ 0`). Always label it **"realized P&L drawdown"**, never "account-equity drawdown".
- bestTrade / worstTrade by net P&L

## Edge cases (must handle, no silent failures)
- **Zero trades** → metrics are zero/empty; no division-by-zero.
- **All wins / all losses** → average of the absent side is `0`/null, never `NaN`.
- **Single trade.**
- **Missing values** → reject the row as a validation error; do not silently treat as zero.
- **NaN / Infinity** → reject.

## Missing fees policy
A blank `fees` field is **not** silently treated as zero. The import flow asks the user to confirm "treat missing fees as 0" explicitly. Only after confirmation are those rows loaded with `fees = 0`.

## Determinism
Same input always yields the same output. No `Date.now`/`Math.random` in the finance layer. Sorts tie-break deterministically (by date, then by stable input index).
