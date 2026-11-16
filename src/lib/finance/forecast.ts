import { sortChronological } from './cumulative'
import { Decimal, ZERO } from './decimal'
import type { TradeComputed } from './types'

/** Minimum number of completed trades before a projection is shown. */
export const MIN_FORECAST_TRADES = 30
export const DEFAULT_RUNS = 1000
export const DEFAULT_SEED = 20260101

export interface ForecastPoint {
  /** number of future trades (0 = today) */
  step: number
  p5: number
  p50: number
  p95: number
}

export interface Forecast {
  horizon: number
  runs: number
  sampleSize: number
  /** realized P&L at the start of the projection (the user's current cumulative total) */
  startPnl: number
  points: ForecastPoint[]
  /** share of simulations ending above the starting P&L, 0-100 */
  probProfit: number
  /** mean net P&L per trade from the user's own history */
  expectancy: Decimal
  /** projected change in P&L at the horizon */
  medianChange: number
  lowChange: number
  highChange: number
}

/** Small deterministic PRNG (mulberry32): same seed -> same projection. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function percentile(sorted: Float64Array, p: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo)
}

/**
 * Bootstrap (Monte Carlo) projection: repeatedly resample the user's own historical net P&L per
 * trade to simulate the next `horizon` trades. This is a statistical projection of past behavior,
 * NOT a prediction of prices and NOT a guarantee. Returns null when there is too little data.
 *
 * Projection math uses floating point (it is an estimate, not accounting); inputs and the
 * expectancy are exact Decimals.
 */
export function forecast(
  trades: readonly TradeComputed[],
  opts: { horizon?: number; runs?: number; seed?: number } = {},
): Forecast | null {
  const horizon = opts.horizon ?? 50
  const runs = opts.runs ?? DEFAULT_RUNS
  const seed = opts.seed ?? DEFAULT_SEED
  if (trades.length < MIN_FORECAST_TRADES || horizon < 1 || runs < 1) return null

  const ordered = sortChronological(trades)
  const pnl = ordered.map((t) => t.netPnl.toNumber())
  const total = ordered.reduce((s, t) => s.plus(t.netPnl), ZERO)
  const rand = mulberry32(seed)
  const n = pnl.length

  // paths[step][run]
  const columns = Array.from({ length: horizon + 1 }, () => new Float64Array(runs))
  for (let r = 0; r < runs; r++) {
    let running = 0
    for (let s = 1; s <= horizon; s++) {
      running += pnl[Math.floor(rand() * n)]!
      columns[s]![r] = running
    }
  }

  const start = total.toNumber()
  const points: ForecastPoint[] = columns.map((col, step) => {
    const sorted = Float64Array.from(col).sort()
    return {
      step,
      p5: start + percentile(sorted, 0.05),
      p50: start + percentile(sorted, 0.5),
      p95: start + percentile(sorted, 0.95),
    }
  })

  let profitable = 0
  for (let r = 0; r < runs; r++) if (columns[horizon]![r]! > 0) profitable++
  const last = points[horizon]!

  return {
    horizon,
    runs,
    sampleSize: n,
    startPnl: start,
    points,
    probProfit: (profitable / runs) * 100,
    expectancy: total.div(n),
    medianChange: last.p50 - start,
    lowChange: last.p5 - start,
    highChange: last.p95 - start,
  }
}
