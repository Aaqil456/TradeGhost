import { ZERO } from './decimal'
import type { Insight, Metrics, PairBreakdown, TradeComputed } from './types'

/** Minimum sample sizes: an insight is only emitted when the data supports it. */
export const MIN_TRADES = 5
export const MIN_PAIR_TRADES = 3

/**
 * Data-gated behavior insights. Every statement is derived directly from the imported
 * trades; nothing is emitted without enough supporting data.
 */
export function generateInsights(
  trades: readonly TradeComputed[],
  metrics: Metrics,
  pairs: readonly PairBreakdown[],
): Insight[] {
  const out: Insight[] = []
  if (trades.length < MIN_TRADES) return out

  if (metrics.losers > metrics.winners) {
    out.push({
      id: 'more-losers',
      tone: 'negative',
      text: `You have more losing trades (${metrics.losers}) than winning trades (${metrics.winners}).`,
    })
  } else if (metrics.winners > metrics.losers) {
    out.push({
      id: 'more-winners',
      tone: 'positive',
      text: `You have more winning trades (${metrics.winners}) than losing trades (${metrics.losers}).`,
    })
  }

  for (const p of pairs) {
    if (p.trades >= MIN_PAIR_TRADES && p.losers > p.winners) {
      out.push({
        id: `pair-loses-${p.symbol}`,
        tone: 'negative',
        text: `${p.symbol}: ${p.losers} of ${p.trades} trades lost money.`,
      })
    }
  }

  const profitable = pairs.filter((p) => p.netPnl.greaterThan(0))
  const profitTotal = profitable.reduce((s, p) => s.plus(p.netPnl), ZERO)
  if (profitable.length >= 2 && profitTotal.greaterThan(0)) {
    const top = profitable[0]!
    const share = top.netPnl.div(profitTotal)
    if (share.greaterThan(0.5)) {
      out.push({
        id: 'profit-concentration-pair',
        tone: 'neutral',
        text: `${top.symbol} contributes ${share.times(100).toFixed(0)}% of the profit earned across profitable pairs.`,
      })
    }
  }

  const winnersSorted = trades
    .filter((t) => t.netPnl.greaterThan(0))
    .sort((a, b) => b.netPnl.comparedTo(a.netPnl) || a.id - b.id)
  const winSum = winnersSorted.reduce((s, t) => s.plus(t.netPnl), ZERO)
  if (winnersSorted.length >= 4 && winSum.greaterThan(0)) {
    const topN = Math.max(1, Math.ceil(winnersSorted.length * 0.2))
    const topSum = winnersSorted.slice(0, topN).reduce((s, t) => s.plus(t.netPnl), ZERO)
    const share = topSum.div(winSum)
    if (share.greaterThanOrEqualTo(0.5)) {
      out.push({
        id: 'profit-concentration-trades',
        tone: 'neutral',
        text: `${topN} winning trade${topN > 1 ? 's' : ''} (top 20%) account for ${share.times(100).toFixed(0)}% of all winning P&L.`,
      })
    }
  }

  if (metrics.winners > 0 && metrics.losers > 0 && metrics.avgLoss.abs().greaterThan(metrics.avgWin)) {
    out.push({
      id: 'loss-bigger-than-win',
      tone: 'negative',
      text: 'Your average losing trade is larger in size than your average winning trade.',
    })
  }

  return out
}
