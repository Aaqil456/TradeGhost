import { useMemo, useState } from 'react'
import { NoData } from '../../components/ui/NoData'
import { Badge, Card, PageHeader, signClass } from '../../components/ui/primitives'
import type { TradeComputed } from '../../lib/finance/types'
import { fmtCurrency, fmtDate, fmtPrice, signOf } from '../../lib/format/format'
import { useApp } from '../../store/AppContext'

type Filter = 'ALL' | 'WIN' | 'LOSS'
type SortKey = 'date' | 'pnl'
const PAGE = 200

export function filterAndSort(
  trades: readonly TradeComputed[],
  q: string,
  filter: Filter,
  key: SortKey,
  dir: 'asc' | 'desc',
): TradeComputed[] {
  const needle = q.trim().toUpperCase()
  const rows = trades.filter((t) => (needle ? t.symbol.includes(needle) : true) && (filter === 'ALL' || t.result === filter))
  const sign = dir === 'asc' ? 1 : -1
  return rows.sort((a, b) => {
    const c = key === 'date' ? a.date.getTime() - b.date.getTime() : a.netPnl.comparedTo(b.netPnl)
    return (c || a.id - b.id) * sign
  })
}

export function History() {
  const { trades } = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [key, setKey] = useState<SortKey>('date')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [limit, setLimit] = useState(PAGE)

  const rows = useMemo(() => (trades ? filterAndSort(trades, q, filter, key, dir) : []), [trades, q, filter, key, dir])

  if (!trades || trades.length === 0) {
    return (
      <>
        <PageHeader title="Trading History" />
        <NoData />
      </>
    )
  }

  const toggle = (k: SortKey) => {
    if (k === key) setDir(dir === 'asc' ? 'desc' : 'asc')
    else {
      setKey(k)
      setDir('desc')
    }
  }
  const arrow = (k: SortKey) => (k === key ? (dir === 'asc' ? ' ▲' : ' ▼') : '')
  const ariaSort = (k: SortKey) => (k === key ? (dir === 'asc' ? 'ascending' : 'descending') : 'none')

  return (
    <>
      <PageHeader title="Trading History" subtitle={`${rows.length} of ${trades.length} trades`} />
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
        <label className="sr-only" htmlFor="symbol-search">
          Search by symbol
        </label>
        <input
          id="symbol-search"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setLimit(PAGE)
          }}
          placeholder="Search symbol (e.g. BTC)"
          className="min-w-0 flex-1 rounded-lg border border-line bg-base px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <div role="group" aria-label="Filter by result" className="flex overflow-hidden rounded-lg border border-line">
          {(['ALL', 'WIN', 'LOSS'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f)
                setLimit(PAGE)
              }}
              className={`px-3 py-2 text-sm font-medium transition-colors ${filter === f ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink'}`}
            >
              {f === 'ALL' ? 'All' : f === 'WIN' ? 'Wins' : 'Losses'}
            </button>
          ))}
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-line bg-panel">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-panel-2 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-3 font-medium" aria-sort={ariaSort('date')}>
                <button type="button" onClick={() => toggle('date')} className="uppercase tracking-wide hover:text-ink">
                  Date{arrow('date')}
                </button>
              </th>
              <th className="p-3 font-medium">Pair</th>
              <th className="p-3 font-medium">Direction</th>
              <th className="p-3 text-right font-medium">Entry</th>
              <th className="p-3 text-right font-medium">Exit</th>
              <th className="p-3 text-right font-medium">Quantity</th>
              <th className="p-3 text-right font-medium">Fees</th>
              <th className="p-3 text-right font-medium" aria-sort={ariaSort('pnl')}>
                <button type="button" onClick={() => toggle('pnl')} className="uppercase tracking-wide hover:text-ink">
                  Net P&L{arrow('pnl')}
                </button>
              </th>
              <th className="p-3 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((t) => (
              <tr key={t.id} className="border-t border-line transition-colors hover:bg-panel-2/60">
                <td className="nums p-3 font-mono">{fmtDate(t.date)}</td>
                <td className="p-3 font-medium">{t.symbol}</td>
                <td className="p-3 text-muted">{t.side}</td>
                <td className="nums p-3 text-right font-mono">{fmtPrice(t.entryPrice)}</td>
                <td className="nums p-3 text-right font-mono">{fmtPrice(t.exitPrice)}</td>
                <td className="nums p-3 text-right font-mono">{fmtPrice(t.quantity)}</td>
                <td className="nums p-3 text-right font-mono text-muted">{fmtPrice(t.fees)}</td>
                <td className={`nums p-3 text-right font-mono font-semibold ${signClass[signOf(t.netPnl)]}`}>
                  {fmtCurrency(t.netPnl, { signed: true })}
                </td>
                <td className="p-3">
                  <Badge result={t.result} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted">
                  No trades match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > limit && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setLimit(limit + PAGE)}
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-ink"
          >
            Show more ({rows.length - limit} remaining)
          </button>
        </div>
      )}
    </>
  )
}
