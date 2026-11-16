import { useMemo, useState } from 'react'
import { ForecastChart } from '../../components/charts/LazyCharts'
import { NoData } from '../../components/ui/NoData'
import { Card, Disclaimer, MetricCard, PageHeader } from '../../components/ui/primitives'
import { Decimal } from '../../lib/finance/decimal'
import { forecast, MIN_FORECAST_TRADES } from '../../lib/finance/forecast'
import { fmtCurrency, fmtPct, signOf } from '../../lib/format/format'
import { useAnalysis } from '../../store/AppContext'

const HORIZONS = [25, 50, 100] as const

export function Forecast() {
  const a = useAnalysis()
  const [horizon, setHorizon] = useState<number>(50)
  const f = useMemo(() => (a ? forecast(a.trades, { horizon }) : null), [a, horizon])

  if (!a) {
    return (
      <>
        <PageHeader title="Forecast" />
        <NoData />
      </>
    )
  }

  const d = (n: number) => new Decimal(n)

  return (
    <>
      <PageHeader
        title="Forecast"
        subtitle="A projection of your own performance if you keep trading the way you have so far."
        action={
          <div role="group" aria-label="Projection length" className="flex overflow-hidden rounded-lg border border-line">
            {HORIZONS.map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={horizon === h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${horizon === h ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink'}`}
              >
                Next {h}
              </button>
            ))}
          </div>
        }
      />

      {!f ? (
        <Card>
          <h2 className="text-base font-semibold">Not enough data yet</h2>
          <p className="mt-1 text-sm text-muted">
            A projection needs at least {MIN_FORECAST_TRADES} completed trades to mean anything. You have {a.trades.length}. Keep
            trading or import more history.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Expectancy per trade" value={fmtCurrency(f.expectancy, { signed: true })} sign={signOf(f.expectancy)} hint="Average net P&L, your history" />
            <MetricCard label={`Median change (${f.horizon} trades)`} value={fmtCurrency(d(f.medianChange), { signed: true })} sign={signOf(d(f.medianChange))} />
            <MetricCard label="Likely range" value={`${fmtCurrency(d(f.lowChange), { signed: true })} to ${fmtCurrency(d(f.highChange), { signed: true })}`} hint="Middle 90% of simulations" />
            <MetricCard label="Chance of ending in profit" value={fmtPct(d(f.probProfit), 0)} sign={f.probProfit >= 50 ? 'positive' : 'negative'} hint={`Over ${f.horizon} more trades`} />
          </div>

          <Card className="mt-6">
            <h2 className="mb-1 text-base font-semibold">Projected cumulative P&L</h2>
            <p className="mb-4 text-xs text-muted">
              Line = median outcome. Shaded area = likely range (5th to 95th percentile). Dotted line = your P&L today.
            </p>
            <ForecastChart points={f.points} startPnl={f.startPnl} />
          </Card>

          <Card className="mt-6">
            <h2 className="text-base font-semibold">How this works</h2>
            <p className="mt-2 text-sm text-muted">
              TradeGhost replays your {f.sampleSize} past trades in random order {f.runs.toLocaleString()} times to see how the next{' '}
              {f.horizon} trades could play out if your results keep looking like your history. It does not predict prices and cannot
              know market conditions. Markets change, so past results are not a guarantee.
            </p>
          </Card>
        </>
      )}
      <Disclaimer className="mt-6" />
    </>
  )
}
