import { computeMetrics } from './metrics'
import type { PairBreakdown, TradeComputed } from './types'

/** Per-symbol breakdown, sorted by net P&L descending (symbol ascending on ties). */
export function pairBreakdown(trades: readonly TradeComputed[]): PairBreakdown[] {
  const groups = new Map<string, TradeComputed[]>()
  for (const t of trades) {
    const g = groups.get(t.symbol)
    if (g) g.push(t)
    else groups.set(t.symbol, [t])
  }
  const out: PairBreakdown[] = []
  for (const [symbol, list] of groups) {
    const m = computeMetrics(list)
    out.push({
      symbol,
      netPnl: m.totalNetPnl,
      trades: m.totalTrades,
      winners: m.winners,
      losers: m.losers,
      winRate: m.winRate,
      avgWin: m.avgWin,
      avgLoss: m.avgLoss,
    })
  }
  return out.sort((a, b) => b.netPnl.comparedTo(a.netPnl) || a.symbol.localeCompare(b.symbol))
}

/** `pairs` must be the (sorted) output of pairBreakdown. */
export function mostProfitable(pairs: readonly PairBreakdown[]): PairBreakdown | null {
  return pairs[0] ?? null
}

export function leastProfitable(pairs: readonly PairBreakdown[]): PairBreakdown | null {
  return pairs.length ? pairs[pairs.length - 1]! : null
}

/** Pairs ranked by number of losing trades (desc), excluding pairs with none. */
export function mostLosses(pairs: readonly PairBreakdown[]): PairBreakdown[] {
  return pairs
    .filter((p) => p.losers > 0)
    .sort((a, b) => b.losers - a.losers || a.symbol.localeCompare(b.symbol))
}
