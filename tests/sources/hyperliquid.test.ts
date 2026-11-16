import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { computeTrade } from '../../src/lib/finance/pnl'
import { fetchFills, fillsToTrades, isValidAddress, type HlFill } from '../../src/lib/sources/hyperliquid'

let tid = 0
function fill(p: Partial<HlFill> & Pick<HlFill, 'side' | 'px' | 'sz' | 'startPosition'>): HlFill {
  tid++
  return { coin: 'BTC', time: 1_000_000 + tid * 1000, dir: '', closedPnl: '0', fee: '0', feeToken: 'USDC', tid, ...p }
}

describe('isValidAddress', () => {
  it('validates 0x + 40 hex', () => {
    expect(isValidAddress('0x' + 'a'.repeat(40))).toBe(true)
    expect(isValidAddress(' 0x' + 'A'.repeat(40) + ' ')).toBe(true)
    expect(isValidAddress('0x123')).toBe(false)
    expect(isValidAddress('hello')).toBe(false)
    expect(isValidAddress('0x' + 'g'.repeat(40))).toBe(false)
  })
})

describe('fillsToTrades', () => {
  it('builds a LONG trade with averaged entry/exit and all fees', () => {
    const r = fillsToTrades([
      fill({ side: 'B', px: '100', sz: '1', startPosition: '0', fee: '0.1' }),
      fill({ side: 'B', px: '110', sz: '1', startPosition: '1', fee: '0.1' }),
      fill({ side: 'A', px: '120', sz: '2', startPosition: '2', fee: '0.3', closedPnl: '30' }),
    ])
    expect(r.trades).toHaveLength(1)
    const t = computeTrade(r.trades[0]!)
    expect(t.side).toBe('LONG')
    expect(t.entryPrice.toString()).toBe('105')
    expect(t.exitPrice.toString()).toBe('120')
    expect(t.quantity.toString()).toBe('2')
    expect(t.grossPnl.toString()).toBe('30') // matches exchange closedPnl
    expect(t.fees.toString()).toBe('0.5')
    expect(t.netPnl.toString()).toBe('29.5')
    expect(t.result).toBe('WIN')
    expect(t.symbol).toBe('BTC-PERP')
  })

  it('builds a SHORT trade', () => {
    const r = fillsToTrades([
      fill({ coin: 'ETH', side: 'A', px: '200', sz: '3', startPosition: '0' }),
      fill({ coin: 'ETH', side: 'B', px: '210', sz: '3', startPosition: '-3', closedPnl: '-30' }),
    ])
    const t = computeTrade(r.trades[0]!)
    expect(t.side).toBe('SHORT')
    expect(t.grossPnl.toString()).toBe('-30')
    expect(t.result).toBe('LOSS')
  })

  it('splits a position flip into two trades and apportions the fee', () => {
    const r = fillsToTrades([
      fill({ side: 'B', px: '100', sz: '1', startPosition: '0' }),
      // sells 3: closes the 1 long, opens a 2 short; fee 0.3 split 1/3 : 2/3
      fill({ side: 'A', px: '110', sz: '3', startPosition: '1', fee: '0.3', closedPnl: '10' }),
      fill({ side: 'B', px: '105', sz: '2', startPosition: '-2', closedPnl: '10' }),
    ])
    expect(r.trades).toHaveLength(2)
    const [a, b] = r.trades.map(computeTrade)
    expect(a!.side).toBe('LONG')
    expect(a!.fees.toFixed(2)).toBe('0.10')
    expect(b!.side).toBe('SHORT')
    expect(b!.entryPrice.toString()).toBe('110')
    expect(b!.fees.toFixed(2)).toBe('0.20')
  })

  it('orders fills sharing a timestamp by position continuity, not tid', () => {
    const time = 5_000_000
    const r = fillsToTrades([
      // tids deliberately reversed relative to position order
      { ...fill({ side: 'B', px: '100', sz: '1', startPosition: '1' }), time, tid: 900 },
      { ...fill({ side: 'B', px: '100', sz: '1', startPosition: '0' }), time, tid: 901 },
      { ...fill({ side: 'A', px: '110', sz: '2', startPosition: '2' }), time: time + 1000, tid: 902 },
    ])
    expect(r.trades).toHaveLength(1)
    expect(r.trades[0]!.quantity.toString()).toBe('2')
  })

  it('excludes still-open positions and reports them', () => {
    const r = fillsToTrades([fill({ side: 'B', px: '100', sz: '1', startPosition: '0' })])
    expect(r.trades).toHaveLength(0)
    expect(r.openCoins).toEqual(['BTC'])
    expect(r.warnings.join(' ')).toMatch(/still-open/i)
  })

  it('skips history that starts mid-position instead of guessing the entry', () => {
    const r = fillsToTrades([fill({ side: 'A', px: '120', sz: '1', startPosition: '1', closedPnl: '5' })])
    expect(r.trades).toHaveLength(0)
    expect(r.warnings.join(' ')).toMatch(/before the available history/i)
  })

  it('ignores spot fills and warns on non-USDC fee tokens', () => {
    const r = fillsToTrades([
      fill({ coin: '@107', dir: 'Buy', side: 'B', px: '1', sz: '1', startPosition: '0' }),
      fill({ side: 'B', px: '100', sz: '1', startPosition: '0', feeToken: 'HYPE' }),
      fill({ side: 'A', px: '101', sz: '1', startPosition: '1' }),
    ])
    expect(r.trades).toHaveLength(1)
    expect(r.warnings.join(' ')).toMatch(/spot/i)
    expect(r.warnings.join(' ')).toMatch(/non-USDC/i)
  })

  it('returns nothing for no fills', () => {
    expect(fillsToTrades([])).toMatchObject({ trades: [], openCoins: [], fillCount: 0 })
  })

  it('reconciles with the exchange: real wallet fixture', () => {
    const fills = JSON.parse(readFileSync('tests/fixtures/hl-fills-real.json', 'utf8')) as HlFill[]
    const r = fillsToTrades(fills)
    expect(r.openCoins).toEqual([])
    const perp = fills.filter((f) => !f.coin.startsWith('@') && f.dir !== 'Buy' && f.dir !== 'Sell')
    const exchangeGross = perp.reduce((s, f) => s + Number(f.closedPnl), 0)
    const exchangeFees = perp.reduce((s, f) => s + Number(f.fee), 0)
    const gross = r.trades.map(computeTrade).reduce((s, t) => s + t.grossPnl.toNumber(), 0)
    const fees = r.trades.reduce((s, t) => s + t.fees.toNumber(), 0)
    expect(gross).toBeCloseTo(exchangeGross, 6)
    expect(fees).toBeCloseTo(exchangeFees, 6)
  })
})

describe('fetchFills', () => {
  it('rejects invalid addresses before any request', async () => {
    let called = false
    await expect(
      fetchFills('nope', async () => {
        called = true
        return { ok: true, status: 200, json: async () => [] }
      }),
    ).rejects.toThrow(/valid wallet address/)
    expect(called).toBe(false)
  })

  it('paginates, de-duplicates the inclusive boundary, and sorts ascending', async () => {
    const mk = (t: number, id: number) => fill({ side: 'B', px: '1', sz: '1', startPosition: '0', time: t, tid: id })
    const page1 = Array.from({ length: 100 }, (_, i) => mk(1000 + i, i + 1))
    const page2 = [page1[99]!, mk(2000, 101), mk(2001, 102)]
    const bodies: unknown[] = []
    const out = await fetchFills('0x' + '1'.repeat(40), async (_u, init) => {
      bodies.push(JSON.parse(init.body))
      return { ok: true, status: 200, json: async () => (bodies.length === 1 ? page1 : page2) }
    })
    expect(out).toHaveLength(102)
    expect(out.map((f) => f.time)).toEqual([...out.map((f) => f.time)].sort((a, b) => a - b))
    expect((bodies[1] as { startTime: number }).startTime).toBe(1099)
  })

  it('surfaces HTTP errors', async () => {
    await expect(fetchFills('0x' + '1'.repeat(40), async () => ({ ok: false, status: 429, json: async () => [] }))).rejects.toThrow(/429/)
  })
})
