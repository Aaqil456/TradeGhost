import type { Decimal } from './decimal'

export type Side = 'LONG' | 'SHORT'
export type Result = 'WIN' | 'LOSS'

export interface Trade {
  /** Stable id: the 1-based CSV data-row index. Used for keys and deterministic tie-breaks. */
  id: number
  date: Date
  symbol: string
  side: Side
  entryPrice: Decimal
  exitPrice: Decimal
  quantity: Decimal
  fees: Decimal
}

export interface TradeComputed extends Trade {
  grossPnl: Decimal
  netPnl: Decimal
  /** netPnl > 0 -> WIN; otherwise (including exactly 0) LOSS. */
  result: Result
}

export interface Metrics {
  totalNetPnl: Decimal
  totalTrades: number
  winners: number
  losers: number
  /** 0-100 */
  winRate: Decimal
  /** Positive, or 0 when there are no winners. */
  avgWin: Decimal
  /** Negative (or 0); 0 when there are no losers. */
  avgLoss: Decimal
  /** Mean net P&L across all trades; 0 when empty. */
  avgPerTrade: Decimal
  bestTrade: TradeComputed | null
  worstTrade: TradeComputed | null
}

export interface PairBreakdown {
  symbol: string
  netPnl: Decimal
  trades: number
  winners: number
  losers: number
  winRate: Decimal
  avgWin: Decimal
  avgLoss: Decimal
}

export interface CumulativePoint {
  tradeId: number
  date: Date
  /** realized cumulative net P&L after this trade */
  cumulative: Decimal
  /** realized P&L drawdown from the running peak (<= 0) */
  drawdown: Decimal
}

export interface Insight {
  id: string
  tone: 'positive' | 'negative' | 'neutral'
  text: string
}
