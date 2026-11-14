import { describe, expect, it } from 'vitest'
import { cumulativePnl } from '../../src/lib/finance/cumulative'
import { realizedDrawdown } from '../../src/lib/finance/drawdown'
import { generateInsights } from '../../src/lib/finance/insights'
import { computeMetrics } from '../../src/lib/finance/metrics'
import { leastProfitable, mostLosses, mostProfitable, pairBreakdown } from '../../src/lib/finance/pairs'
import { grossPnl, netPnl } from '../../src/lib/finance/pnl'
import { toDec } from '../../src/lib/finance/decimal'
import { mk } from './helpers'

describe('pnl', () => {
  it('LONG: (exit - entry) * qty', () => {
    expect(grossPnl(mk('LONG', '100', '110', '2', '0')).toString()).toBe('20')
  })
  it('SHORT: (entry - exit) * qty', () => {
    expect(grossPnl(mk('SHORT', '100', '90', '2', '0')).toString()).toBe('20')
  })
  it('net = gross - fees', () => {
    expect(netPnl(mk('LONG', '100', '110', '2', '1.5')).toString()).toBe('18.5')
  })
  it('is exact for decimal values (0.1 + 0.2 style)', () => {
    expect(grossPnl(mk('LONG', '0.1', '0.3', '1', '0')).toString()).toBe('0.2')
  })
  it('zero net P&L is a LOSS (not a win)', () => {
    expect(mk('LONG', '100', '100', '1', '0').result).toBe('LOSS')
  })
})

describe('metrics', () => {
  it('handles zero trades without NaN', () => {
    const m = computeMetrics([])
    expect(m.totalTrades).toBe(0)
    expect(m.winRate.toString()).toBe('0')
    expect(m.avgWin.toString()).toBe('0')
    expect(m.avgLoss.toString()).toBe('0')
    expect(m.bestTrade).toBeNull()
    expect(m.worstTrade).toBeNull()
  })
  it('computes a mixed set', () => {
    const t = [
      mk('LONG', '100', '110', '1', '0'), // +10
      mk('LONG', '100', '106', '1', '0'), // +6
      mk('LONG', '100', '96', '1', '0'), // -4
    ]
    const m = computeMetrics(t)
    expect(m.totalNetPnl.toString()).toBe('12')
    expect(m.winners).toBe(2)
    expect(m.losers).toBe(1)
    expect(m.winRate.toFixed(4)).toBe('66.6667')
    expect(m.avgWin.toString()).toBe('8')
    expect(m.avgLoss.toString()).toBe('-4')
    expect(m.avgPerTrade.toString()).toBe('4')
    expect(m.bestTrade?.netPnl.toString()).toBe('10')
    expect(m.worstTrade?.netPnl.toString()).toBe('-4')
  })
  it('all wins: avgLoss is 0, win rate 100', () => {
    const m = computeMetrics([mk('LONG', '1', '2', '1', '0'), mk('SHORT', '2', '1', '1', '0')])
    expect(m.winRate.toString()).toBe('100')
    expect(m.avgLoss.toString()).toBe('0')
  })
  it('all losses: avgWin is 0, win rate 0', () => {
    const m = computeMetrics([mk('LONG', '2', '1', '1', '0')])
    expect(m.winRate.toString()).toBe('0')
    expect(m.avgWin.toString()).toBe('0')
    expect(m.avgLoss.toString()).toBe('-1')
  })
  it('single trade: best equals worst', () => {
    const m = computeMetrics([mk('LONG', '1', '2', '1', '0')])
    expect(m.bestTrade).toBe(m.worstTrade)
  })
  it('fees can turn a gross winner into a loser', () => {
    const t = mk('LONG', '100', '101', '1', '5')
    expect(t.grossPnl.toString()).toBe('1')
    expect(t.result).toBe('LOSS')
  })
})

describe('cumulative + drawdown', () => {
  it('sorts chronologically then by id, regardless of input order', () => {
    const a = mk('LONG', '1', '2', '1', '0', { date: '2026-01-03', id: 1 }) // +1
    const b = mk('LONG', '2', '1', '1', '0', { date: '2026-01-01', id: 2 }) // -1
    const c = mk('LONG', '1', '4', '1', '0', { date: '2026-01-02', id: 3 }) // +3
    const s = cumulativePnl([a, b, c])
    expect(s.map((p) => p.tradeId)).toEqual([2, 3, 1])
    expect(s.map((p) => p.cumulative.toString())).toEqual(['-1', '2', '3'])
  })
  it('drawdown is measured from running peak (starting at 0)', () => {
    const t = [
      mk('LONG', '0', '0', '1', '0', { date: '2026-01-01', id: 1 }),
      mk('LONG', '1', '11', '1', '0', { date: '2026-01-02', id: 2 }), // +10 => peak 10
      mk('LONG', '8', '2', '1', '0', { date: '2026-01-03', id: 3 }), // -6 => 4, dd -6
      mk('LONG', '1', '3', '1', '0', { date: '2026-01-04', id: 4 }), // +2 => 6, dd -4
    ]
    const s = cumulativePnl(t)
    expect(s.map((p) => p.drawdown.toString())).toEqual(['0', '0', '-6', '-4'])
    const dd = realizedDrawdown(s)
    expect(dd.max.toString()).toBe('-6')
    expect(dd.current.toString()).toBe('-4')
  })
  it('empty series', () => {
    expect(cumulativePnl([])).toEqual([])
    expect(realizedDrawdown([]).max.toString()).toBe('0')
  })
})

describe('pairs', () => {
  const trades = [
    mk('LONG', '1', '11', '1', '0', { symbol: 'AAA' }), // +10
    mk('LONG', '1', '4', '1', '0', { symbol: 'AAA' }), // +3
    mk('LONG', '5', '1', '1', '0', { symbol: 'BBB' }), // -4
    mk('LONG', '5', '2', '1', '0', { symbol: 'BBB' }), // -3
    mk('LONG', '1', '2', '1', '0', { symbol: 'CCC' }), // +1
  ]
  const pairs = pairBreakdown(trades)
  it('sorts by net P&L desc', () => {
    expect(pairs.map((p) => p.symbol)).toEqual(['AAA', 'CCC', 'BBB'])
  })
  it('best / worst / most losses', () => {
    expect(mostProfitable(pairs)?.symbol).toBe('AAA')
    expect(leastProfitable(pairs)?.symbol).toBe('BBB')
    expect(mostLosses(pairs).map((p) => p.symbol)).toEqual(['BBB'])
  })
  it('aggregates per pair', () => {
    const a = pairs.find((p) => p.symbol === 'AAA')!
    expect(a.netPnl.toString()).toBe('13')
    expect(a.trades).toBe(2)
    expect(a.winRate.toString()).toBe('100')
  })
  it('handles empty', () => {
    const e = pairBreakdown([])
    expect(e).toEqual([])
    expect(mostProfitable(e)).toBeNull()
    expect(leastProfitable(e)).toBeNull()
  })
})

describe('insights (data-gated)', () => {
  it('emits nothing below the minimum sample', () => {
    const t = [mk('LONG', '2', '1', '1', '0'), mk('LONG', '2', '1', '1', '0')]
    expect(generateInsights(t, computeMetrics(t), pairBreakdown(t))).toEqual([])
  })
  it('flags more losers than winners and a losing pair, using real counts', () => {
    const t = [
      mk('LONG', '5', '1', '1', '0', { symbol: 'XXX' }),
      mk('LONG', '5', '1', '1', '0', { symbol: 'XXX' }),
      mk('LONG', '5', '1', '1', '0', { symbol: 'XXX' }),
      mk('LONG', '1', '3', '1', '0', { symbol: 'YYY' }),
      mk('LONG', '1', '3', '1', '0', { symbol: 'YYY' }),
    ]
    const ins = generateInsights(t, computeMetrics(t), pairBreakdown(t))
    const ids = ins.map((i) => i.id)
    expect(ids).toContain('more-losers')
    expect(ids).toContain('pair-loses-XXX')
    expect(ids).not.toContain('pair-loses-YYY')
    expect(ins.find((i) => i.id === 'more-losers')!.text).toContain('(3)')
  })
  it('detects profit concentration in one trade', () => {
    const t = [
      mk('LONG', '1', '101', '1', '0'), // +100
      mk('LONG', '1', '2', '1', '0'),
      mk('LONG', '1', '2', '1', '0'),
      mk('LONG', '1', '2', '1', '0'),
      mk('LONG', '1', '2', '1', '0'),
    ]
    const ids = generateInsights(t, computeMetrics(t), pairBreakdown(t)).map((i) => i.id)
    expect(ids).toContain('profit-concentration-trades')
  })
})

describe('toDec', () => {
  it.each(['', ' ', 'abc', 'NaN', 'Infinity', '-Infinity', '0x10', '1,000', '1e', '--1'])('rejects %j', (v) => {
    expect(toDec(v)).toBeNull()
  })
  it.each(['1', '-1.5', '.5', '5.', '1e3', '+2'])('accepts %j', (v) => {
    expect(toDec(v)).not.toBeNull()
  })
})
