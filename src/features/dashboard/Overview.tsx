import { CumulativeChart, PairChart } from '../../components/charts/LazyCharts'
import { NoData } from '../../components/ui/NoData'
import { Card, Disclaimer, MetricCard, PageHeader } from '../../components/ui/primitives'
import { fmtCurrency, fmtDate, fmtPct, signOf } from '../../lib/format/format'
import { useAnalysis, useApp } from '../../store/AppContext'
import { PairTable } from './PairTable'

export function Overview() {
  const a = useAnalysis()
  const { meta } = useApp()

  if (!a) {
    return (
      <>
        <PageHeader title="Understand your real trading performance" subtitle="Upload a CSV of completed trades and TradeGhost turns it into clear analytics." />
        <NoData />
        <Disclaimer className="mt-6 text-center" />
      </>
    )
  }

  const { metrics: m, series, pairs, drawdown } = a
  return (
    <>
      <PageHeader title="Overview" subtitle={meta ? `${meta.fileName} · ${meta.rowCount} trades` : undefined} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total net P&L" value={fmtCurrency(m.totalNetPnl, { signed: true })} sign={signOf(m.totalNetPnl)} />
        <MetricCard label="Total trades" value={String(m.totalTrades)} />
        <MetricCard label="Win rate" value={fmtPct(m.winRate)} hint={`${m.winners} wins · ${m.losers} losses`} />
        <MetricCard label="Winning trades" value={String(m.winners)} sign={m.winners > 0 ? 'positive' : 'neutral'} />
        <MetricCard label="Losing trades" value={String(m.losers)} sign={m.losers > 0 ? 'negative' : 'neutral'} />
        <MetricCard label="Avg winning trade" value={m.winners ? fmtCurrency(m.avgWin, { signed: true }) : '—'} sign={m.winners ? 'positive' : 'neutral'} />
        <MetricCard label="Avg losing trade" value={m.losers ? fmtCurrency(m.avgLoss) : '—'} sign={m.losers ? 'negative' : 'neutral'} />
        <MetricCard
          label="Max realized P&L drawdown"
          value={fmtCurrency(drawdown.max)}
          sign={signOf(drawdown.max)}
          hint="From cumulative realized P&L, not account equity"
        />
        {m.bestTrade && (
          <MetricCard
            label="Best trade"
            value={fmtCurrency(m.bestTrade.netPnl, { signed: true })}
            sign={signOf(m.bestTrade.netPnl)}
            hint={`${m.bestTrade.symbol} · ${fmtDate(m.bestTrade.date)}`}
          />
        )}
        {m.worstTrade && (
          <MetricCard
            label="Worst trade"
            value={fmtCurrency(m.worstTrade.netPnl, { signed: true })}
            sign={signOf(m.worstTrade.netPnl)}
            hint={`${m.worstTrade.symbol} · ${fmtDate(m.worstTrade.date)}`}
          />
        )}
      </div>

      <Card className="mt-6">
        <h2 className="mb-1 text-base font-semibold">Cumulative realized P&L</h2>
        <p className="mb-4 text-xs text-muted">Running total of net P&L (after fees), in chronological order.</p>
        <CumulativeChart series={series} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold">Net P&L by pair</h2>
          <PairChart pairs={pairs} />
        </Card>
        <Card className="overflow-x-auto">
          <h2 className="mb-4 text-base font-semibold">Pair breakdown</h2>
          <PairTable pairs={pairs} />
        </Card>
      </div>
      <Disclaimer className="mt-6" />
    </>
  )
}
