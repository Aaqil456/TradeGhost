import { describe, expect, it } from 'vitest'
import { forecast, MIN_FORECAST_TRADES, mulberry32 } from '../../src/lib/finance/forecast'
import { computeMetrics } from '../../src/lib/finance/metrics'
import { pairBreakdown } from '../../src/lib/finance/pairs'
import { generateSuggestions } from '../../src/lib/finance/suggestions'
import { mk } from './helpers'

const many = (n: number, win: boolean) =>
  Array.from({ length: n }, (_, i) =>
    mk('LONG', '100', win ? '110' : '90', '1', '0', { date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`, id: i + 1 }),
  )

describe('forecast', () => {
  it('returns null below the minimum sample', () => {
    expect(forecast(many(MIN_FORECAST_TRADES - 1, true))).toBeNull()
  })
  it('is deterministic for a given seed and differs across seeds', () => {
    const t = [...many(20, true), ...many(20, false)]
    const a = forecast(t, { seed: 1 })!
    const b = forecast(t, { seed: 1 })!
    const c = forecast(t, { seed: 2 })!
    expect(a.points).toEqual(b.points)
    expect(a.points).not.toEqual(c.points)
  })
  it('all-winning history projects profit with certainty and ordered percentiles', () => {
    const f = forecast(many(30, true), { horizon: 10 })!
    expect(f.probProfit).toBe(100)
    expect(f.medianChange).toBe(100) // 10 trades * +10
    for (const p of f.points) expect(p.p5 <= p.p50 && p.p50 <= p.p95).toBe(true)
    expect(f.points[0]).toMatchObject({ step: 0, p5: f.startPnl, p95: f.startPnl })
  })
  it('all-losing history projects zero chance of profit', () => {
    expect(forecast(many(30, false), { horizon: 10 })!.probProfit).toBe(0)
  })
  it('expectancy equals mean net P&L', () => {
    const t = [...many(15, true), ...many(15, false)]
    expect(forecast(t)!.expectancy.toString()).toBe('0')
  })
  it('PRNG is within [0,1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v >= 0 && v < 1).toBe(true)
    }
  })
})

describe('suggestions (data-gated, with evidence)', () => {
  const run = (t: ReturnType<typeof many>) => generateSuggestions(t, computeMetrics(t), pairBreakdown(t))

  it('nothing below the minimum sample', () => {
    expect(run(many(5, false))).toEqual([])
  })
  it('flags a losing direction only when the other direction wins, with evidence', () => {
    const t = [
      ...Array.from({ length: 6 }, (_, i) => mk('LONG', '100', '90', '1', '0', { id: i + 1 })),
      ...Array.from({ length: 6 }, (_, i) => mk('SHORT', '100', '90', '1', '0', { id: i + 20 })),
    ]
    const s = run(t).find((x) => x.id === 'direction-LONG')!
    expect(s).toBeTruthy()
    expect(s.evidence).toContain('6 trades')
    expect(run(t).some((x) => x.id === 'direction-SHORT')).toBe(false)
  })
  it('flags a consistently losing pair and a strongest pair', () => {
    const t = [
      ...Array.from({ length: 6 }, (_, i) => mk('LONG', '100', '90', '1', '0', { symbol: 'BAD', id: i + 1 })),
      ...Array.from({ length: 6 }, (_, i) => mk('LONG', '100', '110', '1', '0', { symbol: 'GOOD', id: i + 20 })),
    ]
    const ids = run(t).map((s) => s.id)
    expect(ids).toContain('pair-avoid-BAD')
    expect(ids).toContain('pair-strength-GOOD')
    expect(ids).not.toContain('pair-avoid-GOOD')
  })
  it('flags fee drag and losing streaks from real numbers', () => {
    const wins = Array.from({ length: 5 }, (_, i) => mk('LONG', '100', '120', '1', '8', { date: '2026-01-01', id: i + 1 }))
    const losses = Array.from({ length: 6 }, (_, i) => mk('LONG', '100', '99', '1', '1', { date: '2026-01-05', id: i + 10 }))
    const ids = run([...wins, ...losses]).map((s) => s.id)
    expect(ids).toContain('fee-drag')
    expect(ids).toContain('losing-streak')
  })
})
