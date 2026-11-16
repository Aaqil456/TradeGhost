import { Decimal, toDec, ZERO } from '../finance/decimal'
import type { Trade } from '../finance/types'

/**
 * Hyperliquid (perpetuals DEX) connector. Uses only a PUBLIC wallet address: no API key,
 * no signing, no backend. The browser calls the public info endpoint directly.
 *
 * Verified against live data: `closedPnl` is GROSS (before fees); `fee` is charged on every
 * fill (opening and closing). TradeGhost therefore groups fills into position cycles
 * (flat -> ... -> flat) and charges all fees of the cycle to the resulting trade.
 */
export const HL_INFO_URL = 'https://api.hyperliquid.xyz/info'

export interface HlFill {
  coin: string
  px: string
  sz: string
  side: 'B' | 'A'
  time: number
  startPosition: string
  dir: string
  closedPnl: string
  fee: string
  feeToken: string
  tid: number
}

export interface HlResult {
  trades: Trade[]
  /** Coins with a position still open (not part of completed trades). */
  openCoins: string[]
  warnings: string[]
  fillCount: number
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

export const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
export function isValidAddress(a: string): boolean {
  return ADDRESS_RE.test(a.trim())
}
export function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

const MAX_PAGES = 60

/** Fetch all available fills (Hyperliquid exposes the 10,000 most recent), oldest -> newest. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export async function fetchFills(
  address: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<HlFill[]> {
  return (await fetchFillsDetailed(address, fetchImpl, wait)).fills
}

export async function fetchFillsDetailed(
  address: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<{ fills: HlFill[]; truncated: boolean }> {
  const addr = address.trim().toLowerCase()
  if (!isValidAddress(addr)) throw new Error('That is not a valid wallet address (expected 0x followed by 40 hex characters).')

  const seen = new Map<number, HlFill>()
  let start = 0
  let truncated = false
  for (let page = 0; page < MAX_PAGES; page++) {
    if (page === MAX_PAGES - 1) truncated = true
    // Retry rate limits (HTTP 429) with exponential backoff before giving up.
    let res = await fetchImpl(HL_INFO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'userFillsByTime', user: addr, startTime: start }),
    })
    for (let attempt = 0; res.status === 429 && attempt < 4; attempt++) {
      await wait(1000 * 2 ** attempt)
      res = await fetchImpl(HL_INFO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'userFillsByTime', user: addr, startTime: start }),
      })
    }
    if (!res.ok) throw new Error(`Hyperliquid request failed (HTTP ${res.status}).${res.status === 429 ? ' Too many requests; wait a minute and try again.' : ' Try again in a moment.'}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Unexpected response from Hyperliquid.')
    const batch = data as HlFill[]
    let added = 0
    for (const f of batch) {
      if (!seen.has(f.tid)) {
        seen.set(f.tid, f)
        added++
      }
    }
    if (batch.length === 0 || added === 0) {
      truncated = false
      break
    }
    const last = Math.max(...batch.map((f) => f.time))
    if (last <= start && added === 0) break
    start = last
    if (batch.length < 100) {
      truncated = false
      break
    }
  }
  return { fills: [...seen.values()].sort((a, b) => a.time - b.time || a.tid - b.tid), truncated }
}

interface Cycle {
  side: 'LONG' | 'SHORT'
  openNotional: Decimal
  openQty: Decimal
  closeNotional: Decimal
  closeQty: Decimal
  fees: Decimal
  lastTime: number
}

const newCycle = (side: 'LONG' | 'SHORT'): Cycle => ({
  side,
  openNotional: ZERO,
  openQty: ZERO,
  closeNotional: ZERO,
  closeQty: ZERO,
  fees: ZERO,
  lastTime: 0,
})

/** Order fills that share a timestamp by position continuity (tid order is not chronological). */
function orderGroup(group: HlFill[], expectedStart: Decimal | null): HlFill[] {
  if (group.length < 2) return group
  const signed = (f: HlFill) => (f.side === 'B' ? new Decimal(f.sz) : new Decimal(f.sz).neg())
  const remaining = [...group].sort((a, b) => a.tid - b.tid)
  const out: HlFill[] = []
  let cur = expectedStart
  while (remaining.length) {
    let idx = -1
    if (cur) idx = remaining.findIndex((f) => new Decimal(f.startPosition).equals(cur!))
    if (idx < 0) {
      // choose a fill whose start is not the end of any other fill in the remaining set
      idx = remaining.findIndex(
        (f) => !remaining.some((o) => o !== f && new Decimal(o.startPosition).plus(signed(o)).equals(new Decimal(f.startPosition))),
      )
      if (idx < 0) idx = 0
    }
    const [f] = remaining.splice(idx, 1)
    out.push(f!)
    cur = new Decimal(f!.startPosition).plus(signed(f!))
  }
  return out
}

/** Convert fills into completed trades (position cycles). Pure and deterministic. */
export function fillsToTrades(fills: readonly HlFill[]): HlResult {
  const warnings: string[] = []
  const byCoin = new Map<string, HlFill[]>()
  let nonUsd = 0
  let skippedSpot = 0

  for (const f of fills) {
    if (f.coin.startsWith('@') || f.dir === 'Buy' || f.dir === 'Sell' || f.coin.includes('/')) {
      skippedSpot++
      continue
    }
    if (f.feeToken.trim().toUpperCase() !== 'USDC') nonUsd++
    const g = byCoin.get(f.coin)
    if (g) g.push(f)
    else byCoin.set(f.coin, [f])
  }

  const raw: { coin: string; cycle: Cycle }[] = []
  const openCoins: string[] = []
  let skippedMid = 0

  for (const [coin, list] of byCoin) {
    list.sort((a, b) => a.time - b.time || a.tid - b.tid)
    // group by timestamp, then order each group by position continuity
    const groups: HlFill[][] = []
    for (const f of list) {
      const g = groups[groups.length - 1]
      if (g && g[0]!.time === f.time) g.push(f)
      else groups.push([f])
    }

    let cycle: Cycle | null = null
    let pos: Decimal | null = null

    for (const group of groups) {
      const ordered: HlFill[] = orderGroup(group, pos)
      for (const f of ordered) {
        const sz = new Decimal(f.sz)
        const px = new Decimal(f.px)
        const fee = toDec(f.fee) ?? ZERO
        const start: Decimal = new Decimal(f.startPosition)
        const signed: Decimal = f.side === 'B' ? sz : sz.neg()
        const end: Decimal = start.plus(signed)
        pos = end

        if (!cycle) {
          if (!start.isZero()) {
            skippedMid++ // history begins mid-position: cannot know the entry, so skip safely
            continue
          }
          cycle = newCycle(signed.isPositive() ? 'LONG' : 'SHORT')
        }

        const longSide = cycle.side === 'LONG'
        const increasing = longSide ? signed.isPositive() : signed.isNegative()
        cycle.lastTime = f.time

        if (increasing) {
          cycle.openNotional = cycle.openNotional.plus(px.times(sz))
          cycle.openQty = cycle.openQty.plus(sz)
          cycle.fees = cycle.fees.plus(fee)
          continue
        }

        // reducing fill (possibly flipping through zero)
        const closing = Decimal.min(sz, start.abs())
        const excess = sz.minus(closing)
        const feeClose = sz.isZero() ? fee : fee.times(closing).div(sz)
        cycle.closeNotional = cycle.closeNotional.plus(px.times(closing))
        cycle.closeQty = cycle.closeQty.plus(closing)
        cycle.fees = cycle.fees.plus(feeClose)

        if (end.isZero() || excess.greaterThan(0)) {
          if (cycle.openQty.greaterThan(0) && cycle.closeQty.greaterThan(0)) raw.push({ coin, cycle })
          cycle = null
          if (excess.greaterThan(0)) {
            const next = newCycle(longSide ? 'SHORT' : 'LONG')
            next.openNotional = px.times(excess)
            next.openQty = excess
            next.fees = fee.minus(feeClose)
            next.lastTime = f.time
            cycle = next
          }
        }
      }
    }
    if (cycle && cycle.openQty.greaterThan(0)) openCoins.push(coin)
  }

  raw.sort((a, b) => a.cycle.lastTime - b.cycle.lastTime || a.coin.localeCompare(b.coin))
  const trades: Trade[] = raw.map(({ coin, cycle }, i) => ({
    id: i + 1,
    date: new Date(cycle.lastTime),
    symbol: `${coin}-PERP`,
    side: cycle.side,
    entryPrice: cycle.openNotional.div(cycle.openQty),
    exitPrice: cycle.closeNotional.div(cycle.closeQty),
    quantity: cycle.closeQty,
    fees: cycle.fees,
  }))

  if (skippedSpot > 0) warnings.push(`${skippedSpot} spot fill(s) were ignored (only perpetual positions are analyzed).`)
  if (skippedMid > 0) warnings.push(`${skippedMid} fill(s) from a position that opened before the available history were skipped.`)
  if (nonUsd > 0) warnings.push(`${nonUsd} fill(s) paid fees in a non-USDC token; those fee amounts are not converted.`)
  if (openCoins.length > 0) warnings.push(`Still-open positions are excluded until closed: ${openCoins.join(', ')}.`)

  return { trades, openCoins, warnings, fillCount: fills.length }
}

export async function loadWallet(address: string, fetchImpl?: FetchLike): Promise<HlResult> {
  const { fills, truncated } = await fetchFillsDetailed(address, fetchImpl)
  const res = fillsToTrades(fills)
  if (truncated) res.warnings.push('This wallet has a very large history; only part of it was loaded, so the newest trades may be missing.')
  return res
}
