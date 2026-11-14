import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { cumulativePnl } from '../../src/lib/finance/cumulative'
import { Decimal } from '../../src/lib/finance/decimal'
import { computeMetrics } from '../../src/lib/finance/metrics'
import { pairBreakdown } from '../../src/lib/finance/pairs'
import { computeTrade, grossPnl, netPnl } from '../../src/lib/finance/pnl'
import type { Side, TradeComputed } from '../../src/lib/finance/types'

// Decimal-string arbitraries (cents-precision prices, up to 8dp quantities).
const price = fc.integer({ min: 1, max: 100_000_000 }).map((n) => new Decimal(n).div(100))
const qty = fc.integer({ min: 1, max: 1_000_000_000 }).map((n) => new Decimal(n).div(1e8))
const fee = fc.integer({ min: 0, max: 10_000_000 }).map((n) => new Decimal(n).div(100))
const side = fc.constantFrom<Side>('LONG', 'SHORT')

const trade = (id: number) =>
  fc
    .record({
      side,
      entryPrice: price,
      exitPrice: price,
      quantity: qty,
      fees: fee,
      day: fc.integer({ min: 0, max: 400 }),
      symbol: fc.constantFrom('BTCUSDT', 'ETHUSDT', 'SOLUSDT'),
    })
    .map((r) =>
      computeTrade({
        id,
        date: new Date(Date.UTC(2025, 0, 1 + r.day)),
        symbol: r.symbol,
        side: r.side,
        entryPrice: r.entryPrice,
        exitPrice: r.exitPrice,
        quantity: r.quantity,
        fees: r.fees,
      }),
    )

const trades = fc
  .integer({ min: 0, max: 30 })
  .chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => trade(i + 1))))
  .map((t) => t as TradeComputed[])

describe('property: P&L', () => {
  it('profitable LONG (exit > entry) has positive gross P&L', () => {
    fc.assert(
      fc.property(price, price, qty, (a, b, q) => {
        fc.pre(b.greaterThan(a))
        const t = { side: 'LONG' as const, entryPrice: a, exitPrice: b, quantity: q }
        expect(grossPnl(t).greaterThan(0)).toBe(true)
      }),
    )
  })
  it('profitable SHORT (exit < entry) has positive gross P&L', () => {
    fc.assert(
      fc.property(price, price, qty, (a, b, q) => {
        fc.pre(b.lessThan(a))
        const t = { side: 'SHORT' as const, entryPrice: a, exitPrice: b, quantity: q }
        expect(grossPnl(t).greaterThan(0)).toBe(true)
      }),
    )
  })
  it('net = gross - fees', () => {
    fc.assert(
      fc.property(trade(1), (t) => {
        expect(t.netPnl.equals(t.grossPnl.minus(t.fees))).toBe(true)
      }),
    )
  })
  it('increasing fees never increases net P&L', () => {
    fc.assert(
      fc.property(trade(1), fee, (t, extra) => {
        const higher = netPnl({ ...t, fees: t.fees.plus(extra) })
        expect(higher.lessThanOrEqualTo(netPnl(t))).toBe(true)
      }),
    )
  })
  it('LONG and SHORT gross P&L are mirror images', () => {
    fc.assert(
      fc.property(price, price, qty, (a, b, q) => {
        const l = grossPnl({ side: 'LONG', entryPrice: a, exitPrice: b, quantity: q })
        const s = grossPnl({ side: 'SHORT', entryPrice: a, exitPrice: b, quantity: q })
        expect(l.plus(s).isZero()).toBe(true)
      }),
    )
  })
})

describe('property: metrics', () => {
  it('win rate is within [0, 100]', () => {
    fc.assert(
      fc.property(trades, (t) => {
        const wr = computeMetrics(t).winRate
        expect(wr.greaterThanOrEqualTo(0) && wr.lessThanOrEqualTo(100)).toBe(true)
      }),
    )
  })
  it('winners + losers = total; total P&L = sum of nets', () => {
    fc.assert(
      fc.property(trades, (t) => {
        const m = computeMetrics(t)
        expect(m.winners + m.losers).toBe(m.totalTrades)
        const sum = t.reduce((s, x) => s.plus(x.netPnl), new Decimal(0))
        expect(m.totalNetPnl.equals(sum)).toBe(true)
      }),
    )
  })
  it('avgWin >= 0 and avgLoss <= 0, never NaN', () => {
    fc.assert(
      fc.property(trades, (t) => {
        const m = computeMetrics(t)
        expect(m.avgWin.isNaN() || m.avgLoss.isNaN()).toBe(false)
        expect(m.avgWin.greaterThanOrEqualTo(0)).toBe(true)
        expect(m.avgLoss.lessThanOrEqualTo(0)).toBe(true)
      }),
    )
  })
  it('best >= every trade >= worst', () => {
    fc.assert(
      fc.property(trades, (t) => {
        const m = computeMetrics(t)
        for (const x of t) {
          expect(x.netPnl.lessThanOrEqualTo(m.bestTrade!.netPnl)).toBe(true)
          expect(x.netPnl.greaterThanOrEqualTo(m.worstTrade!.netPnl)).toBe(true)
        }
      }),
    )
  })
})

describe('property: cumulative & pairs', () => {
  it('final cumulative equals total net P&L; drawdown <= 0; order-independent', () => {
    fc.assert(
      fc.property(trades, (t) => {
        const s = cumulativePnl(t)
        expect(s.length).toBe(t.length)
        if (t.length) expect(s[s.length - 1]!.cumulative.equals(computeMetrics(t).totalNetPnl)).toBe(true)
        expect(s.every((p) => p.drawdown.lessThanOrEqualTo(0))).toBe(true)
        const reversed = cumulativePnl([...t].reverse())
        expect(reversed.map((p) => p.cumulative.toString())).toEqual(s.map((p) => p.cumulative.toString()))
      }),
    )
  })
  it('pair net P&L sums to total net P&L', () => {
    fc.assert(
      fc.property(trades, (t) => {
        const sum = pairBreakdown(t).reduce((s, p) => s.plus(p.netPnl), new Decimal(0))
        expect(sum.equals(computeMetrics(t).totalNetPnl)).toBe(true)
      }),
    )
  })
})
