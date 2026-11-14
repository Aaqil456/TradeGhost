import { Decimal, ZERO } from './decimal'
import type { Metrics, TradeComputed } from './types'

function safeDiv(a: Decimal, n: number): Decimal {
  return n === 0 ? ZERO : a.div(n)
}

export function computeMetrics(trades: readonly TradeComputed[]): Metrics {
  let total = ZERO
  let winSum = ZERO
  let lossSum = ZERO
  let winners = 0
  let losers = 0
  let best: TradeComputed | null = null
  let worst: TradeComputed | null = null

  for (const t of trades) {
    total = total.plus(t.netPnl)
    if (t.result === 'WIN') {
      winners++
      winSum = winSum.plus(t.netPnl)
    } else {
      losers++
      lossSum = lossSum.plus(t.netPnl)
    }
    if (best === null || t.netPnl.greaterThan(best.netPnl)) best = t
    if (worst === null || t.netPnl.lessThan(worst.netPnl)) worst = t
  }

  const n = trades.length
  return {
    totalNetPnl: total,
    totalTrades: n,
    winners,
    losers,
    winRate: n === 0 ? ZERO : new Decimal(winners).div(n).times(100),
    avgWin: safeDiv(winSum, winners),
    avgLoss: safeDiv(lossSum, losers),
    avgPerTrade: safeDiv(total, n),
    bestTrade: best,
    worstTrade: worst,
  }
}
