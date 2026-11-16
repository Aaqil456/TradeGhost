import { Decimal, ZERO } from './decimal'
import type { Metrics, PairBreakdown, TradeComputed } from './types'

export const SUGGESTION_MIN_TRADES = 10
export const SUGGESTION_MIN_GROUP = 5

export interface Suggestion {
  id: string
  tone: 'positive' | 'negative' | 'neutral'
  /** What to consider doing. */
  text: string
  /** The numbers from the user's own data that support it. */
  evidence: string
}

const money = (d: Decimal) => `${d.isNegative() ? '-' : ''}$${d.abs().toFixed(2)}`

/**
 * Data-grounded suggestions derived ONLY from the user's own past trades. Each one carries its
 * evidence and is gated by sample size. These are not trade signals or financial advice.
 */
export function generateSuggestions(
  trades: readonly TradeComputed[],
  metrics: Metrics,
  pairs: readonly PairBreakdown[],
): Suggestion[] {
  const out: Suggestion[] = []
  if (trades.length < SUGGESTION_MIN_TRADES) return out

  // 1) Direction (LONG vs SHORT) expectancy
  const dir = (side: 'LONG' | 'SHORT') => {
    const g = trades.filter((t) => t.side === side)
    const sum = g.reduce((s, t) => s.plus(t.netPnl), ZERO)
    return { n: g.length, sum, avg: g.length ? sum.div(g.length) : ZERO, wins: g.filter((t) => t.result === 'WIN').length }
  }
  const L = dir('LONG')
  const S = dir('SHORT')
  for (const [name, a, b] of [
    ['LONG', L, S],
    ['SHORT', S, L],
  ] as const) {
    if (a.n >= SUGGESTION_MIN_GROUP && a.avg.isNegative() && b.n >= SUGGESTION_MIN_GROUP && b.avg.greaterThan(0)) {
      out.push({
        id: `direction-${name}`,
        tone: 'negative',
        text: `Your ${name} trades lose money while your ${name === 'LONG' ? 'SHORT' : 'LONG'} trades make it. Consider reviewing or reducing ${name} trades.`,
        evidence: `${name}: ${a.n} trades, avg ${money(a.avg)} each. ${name === 'LONG' ? 'SHORT' : 'LONG'}: ${b.n} trades, avg ${money(b.avg)} each.`,
      })
    }
  }

  // 2) Pairs that consistently lose / pairs that carry the profit
  for (const p of pairs) {
    if (p.trades >= SUGGESTION_MIN_GROUP && p.netPnl.isNegative() && p.winRate.lessThan(40)) {
      out.push({
        id: `pair-avoid-${p.symbol}`,
        tone: 'negative',
        text: `${p.symbol} has been a consistent drag. Consider smaller size or skipping it until your approach there changes.`,
        evidence: `${p.trades} trades, net ${money(p.netPnl)}, win rate ${p.winRate.toFixed(0)}%.`,
      })
    }
  }
  const best = pairs[0]
  if (best && best.trades >= SUGGESTION_MIN_GROUP && best.netPnl.greaterThan(0) && best.winRate.greaterThanOrEqualTo(55)) {
    out.push({
      id: `pair-strength-${best.symbol}`,
      tone: 'positive',
      text: `${best.symbol} is your strongest pair so far. It may be where your edge is.`,
      evidence: `${best.trades} trades, net ${money(best.netPnl)}, win rate ${best.winRate.toFixed(0)}%.`,
    })
  }

  // 3) Risk/reward: losses bigger than wins
  if (metrics.winners >= SUGGESTION_MIN_GROUP && metrics.losers >= SUGGESTION_MIN_GROUP && metrics.avgLoss.abs().greaterThan(metrics.avgWin)) {
    const ratio = metrics.avgLoss.abs().div(metrics.avgWin)
    out.push({
      id: 'payoff-ratio',
      tone: 'negative',
      text: 'Your average loss is bigger than your average win. Consider tighter stops or letting winners run longer.',
      evidence: `Avg win ${money(metrics.avgWin)}, avg loss ${money(metrics.avgLoss)} (losses are ${ratio.toFixed(1)}x wins).`,
    })
  }

  // 4) Fee drag
  const fees = trades.reduce((s, t) => s.plus(t.fees), ZERO)
  const gross = trades.reduce((s, t) => s.plus(t.grossPnl), ZERO)
  if (gross.greaterThan(0) && fees.div(gross).greaterThan(0.25)) {
    out.push({
      id: 'fee-drag',
      tone: 'negative',
      text: 'Fees are eating a large part of your profit. Consider fewer, higher-conviction trades or lower-fee order types.',
      evidence: `Fees ${money(fees)} vs gross profit ${money(gross)} (${fees.div(gross).times(100).toFixed(0)}%).`,
    })
  }

  // 5) Losing streak
  const ordered = [...trades].sort((a, b) => a.date.getTime() - b.date.getTime() || a.id - b.id)
  let streak = 0
  let worst = 0
  for (const t of ordered) {
    streak = t.result === 'LOSS' ? streak + 1 : 0
    if (streak > worst) worst = streak
  }
  if (worst >= 5) {
    out.push({
      id: 'losing-streak',
      tone: 'neutral',
      text: `Your longest losing streak was ${worst} trades in a row. Consider a rule to pause or cut size after a few consecutive losses.`,
      evidence: `${worst} consecutive losing trades in your history.`,
    })
  }

  return out
}
