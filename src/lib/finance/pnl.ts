import type { Decimal } from './decimal'
import type { Trade, TradeComputed } from './types'

type PriceLeg = Pick<Trade, 'side' | 'entryPrice' | 'exitPrice' | 'quantity'>

export function grossPnl(t: PriceLeg): Decimal {
  const diff = t.side === 'LONG' ? t.exitPrice.minus(t.entryPrice) : t.entryPrice.minus(t.exitPrice)
  return diff.times(t.quantity)
}

export function netPnl(t: PriceLeg & Pick<Trade, 'fees'>): Decimal {
  return grossPnl(t).minus(t.fees)
}

export function computeTrade(t: Trade): TradeComputed {
  const gross = grossPnl(t)
  const net = gross.minus(t.fees)
  return { ...t, grossPnl: gross, netPnl: net, result: net.greaterThan(0) ? 'WIN' : 'LOSS' }
}
