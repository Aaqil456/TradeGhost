import { Decimal } from '../../src/lib/finance/decimal'
import { computeTrade } from '../../src/lib/finance/pnl'
import type { Side, TradeComputed } from '../../src/lib/finance/types'

let counter = 0

export function mk(
  side: Side,
  entry: string,
  exit: string,
  qty: string,
  fees: string,
  opts: { symbol?: string; date?: string; id?: number } = {},
): TradeComputed {
  counter++
  return computeTrade({
    id: opts.id ?? counter,
    date: new Date(`${opts.date ?? '2026-01-01'}T00:00:00Z`),
    symbol: opts.symbol ?? 'BTCUSDT',
    side,
    entryPrice: new Decimal(entry),
    exitPrice: new Decimal(exit),
    quantity: new Decimal(qty),
    fees: new Decimal(fees),
  })
}
