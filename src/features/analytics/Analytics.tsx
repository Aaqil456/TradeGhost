import { NoData } from '../../components/ui/NoData'
import { Card, Disclaimer, MetricCard, PageHeader, signClass } from '../../components/ui/primitives'
import { MIN_TRADES } from '../../lib/finance/insights'
import { SUGGESTION_MIN_TRADES } from '../../lib/finance/suggestions'
import { leastProfitable, mostLosses, mostProfitable } from '../../lib/finance/pairs'
import { fmtCurrency, fmtDate, fmtPct, signOf } from '../../lib/format/format'
import { useAnalysis } from '../../store/AppContext'

export function Analytics() {
  const a = useAnalysis()
  if (!a) {
    return (
      <>
        <PageHeader title="Analytics" />
        <NoData />
      </>
    )
  }
  const { metrics: m, pairs, insights, drawdown, suggestions } = a
  const best = mostProfitable(pairs)
  const worst = leastProfitable(pairs)
  const losses = mostLosses(pairs)
  const overall = signOf(m.totalNetPnl)

  return (
    <>
      <PageHeader title="Analytics" subtitle="Everything below is calculated from your imported trades." />

      <Card className="mb-6">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">Overall profitability</div>
        <div className={`nums mt-1 font-mono text-3xl font-semibold ${signClass[overall]}`}>
          {fmtCurrency(m.totalNetPnl, { signed: true })}
        </div>
        <p className="mt-1 text-sm text-muted">
          {overall === 'positive' ? 'Profitable' : overall === 'negative' ? 'Unprofitable' : 'Break-even'} across {m.totalTrades}{' '}
          trade{m.totalTrades === 1 ? '' : 's'} · win rate {fmtPct(m.winRate)}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Avg profit per trade" value={fmtCurrency(m.avgPerTrade, { signed: true })} sign={signOf(m.avgPerTrade)} hint="Mean net P&L, all trades" />
        <MetricCard label="Avg winning trade" value={m.winners ? fmtCurrency(m.avgWin, { signed: true }) : '—'} sign={m.winners ? 'positive' : 'neutral'} />
        <MetricCard label="Avg losing trade" value={m.losers ? fmtCurrency(m.avgLoss) : '—'} sign={m.losers ? 'negative' : 'neutral'} />
        <MetricCard label="Max realized P&L drawdown" value={fmtCurrency(drawdown.max)} sign={signOf(drawdown.max)} hint="Not account-equity drawdown" />
        {m.bestTrade && (
          <MetricCard label="Largest winning trade" value={fmtCurrency(m.bestTrade.netPnl, { signed: true })} sign={signOf(m.bestTrade.netPnl)} hint={`${m.bestTrade.symbol} · ${fmtDate(m.bestTrade.date)}`} />
        )}
        {m.worstTrade && (
          <MetricCard label="Largest losing trade" value={fmtCurrency(m.worstTrade.netPnl, { signed: true })} sign={signOf(m.worstTrade.netPnl)} hint={`${m.worstTrade.symbol} · ${fmtDate(m.worstTrade.date)}`} />
        )}
        {best && <MetricCard label="Most profitable pair" value={best.symbol} sign={signOf(best.netPnl)} hint={fmtCurrency(best.netPnl, { signed: true })} />}
        {worst && <MetricCard label="Least profitable pair" value={worst.symbol} sign={signOf(worst.netPnl)} hint={fmtCurrency(worst.netPnl, { signed: true })} />}
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Pairs with the most losing trades</h2>
        {losses.length === 0 ? (
          <p className="text-sm text-muted">No losing trades in this dataset.</p>
        ) : (
          <ul className="divide-y divide-line">
            {losses.slice(0, 5).map((p) => (
              <li key={p.symbol} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{p.symbol}</span>
                <span className="nums font-mono text-muted">
                  <span className="text-negative">{p.losers} loss{p.losers === 1 ? '' : 'es'}</span> of {p.trades} trades
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-1 text-base font-semibold">Trading behavior insights</h2>
        <p className="mb-3 text-xs text-muted">Only shown when your data supports them (minimum {MIN_TRADES} trades).</p>
        {insights.length === 0 ? (
          <p className="text-sm text-muted">
            {a.trades.length < MIN_TRADES
              ? `Import at least ${MIN_TRADES} trades to see behavior insights.`
              : 'No notable patterns were found in this dataset.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((i) => (
              <li
                key={i.id}
                className={`rounded-lg border-l-2 bg-panel-2 px-3 py-2 text-sm ${
                  i.tone === 'positive' ? 'border-positive' : i.tone === 'negative' ? 'border-negative' : 'border-accent'
                }`}
              >
                {i.text}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="mt-6">
        <h2 className="mb-1 text-base font-semibold">Suggestions from your history</h2>
        <p className="mb-3 text-xs text-muted">
          Suggestions are based only on your past trades, not on market predictions. They are not financial advice.
        </p>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted">
            {a.trades.length < SUGGESTION_MIN_TRADES
              ? `Import at least ${SUGGESTION_MIN_TRADES} trades to see suggestions.`
              : 'Nothing stands out in your data right now.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className={`rounded-lg border-l-2 bg-panel-2 px-3 py-2 text-sm ${
                  s.tone === 'positive' ? 'border-positive' : s.tone === 'negative' ? 'border-negative' : 'border-accent'
                }`}
              >
                <div>{s.text}</div>
                <div className="mt-1 text-xs text-muted">{s.evidence}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Disclaimer className="mt-6" />
    </>
  )
}
