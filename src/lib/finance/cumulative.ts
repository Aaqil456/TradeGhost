import { ZERO } from './decimal'
import type { CumulativePoint, TradeComputed } from './types'

/** Chronological order; ties broken by stable trade id for determinism. */
export function sortChronological<T extends { date: Date; id: number }>(trades: readonly T[]): T[] {
  return [...trades].sort((a, b) => a.date.getTime() - b.date.getTime() || a.id - b.id)
}

/**
 * Running sum of net P&L in chronological order, plus realized-P&L drawdown from the
 * running peak (the peak starts at 0, i.e. before any trade).
 */
export function cumulativePnl(trades: readonly TradeComputed[]): CumulativePoint[] {
  let running = ZERO
  let peak = ZERO
  return sortChronological(trades).map((t) => {
    running = running.plus(t.netPnl)
    if (running.greaterThan(peak)) peak = running
    return { tradeId: t.id, date: t.date, cumulative: running, drawdown: running.minus(peak) }
  })
}
