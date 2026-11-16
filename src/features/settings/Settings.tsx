import { Button, Card, Disclaimer, PageHeader } from '../../components/ui/primitives'
import { useApp } from '../../store/AppContext'

export function Settings() {
  const { trades, meta, live, clearTrades } = useApp()
  return (
    <>
      <PageHeader title="Settings" subtitle="Privacy, data handling and about." />
      <div className="space-y-4">
        <Card>
          <h2 className="text-[1rem] font-semibold">How your data is handled</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>CSV files are read and analyzed entirely in your browser and are never uploaded.</li>
            <li>
              Live mode needs only a public wallet address. Your browser sends it directly to Hyperliquid&apos;s public API to fetch
              that wallet&apos;s trades. TradeGhost has no server and never stores the address.
            </li>
            <li>TradeGhost never asks for API keys, passwords or signatures.</li>
            <li>Data is held in memory only. Refreshing or closing the tab clears it.</li>
            <li>Wallet history is public on-chain: anyone with an address can view its trades.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-[1rem] font-semibold">Current dataset</h2>
          {trades && meta ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {meta.fileName} · {meta.rowCount} trades{live ? ' · live' : ''}
              </p>
              <Button variant="danger" onClick={clearTrades}>
                {live ? 'Disconnect' : 'Remove dataset'}
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No dataset loaded.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-[1rem] font-semibold">How P&amp;L is calculated</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>LONG: (exit − entry) × quantity. SHORT: (entry − exit) × quantity.</li>
            <li>Net P&amp;L = gross P&amp;L − fees. A trade is a WIN only if net P&amp;L is above zero.</li>
            <li>Cumulative P&amp;L and drawdown are based on realized trades, not account equity.</li>
            <li>
              Live wallets: a trade is one position from flat to flat. Entry and exit are quantity-weighted averages and all fees
              paid while the position was open are included. Positions still open are excluded until closed.
            </li>
            <li>
              Forecasts resample your own past trades to project a range of outcomes. They do not predict prices and are not a
              guarantee.
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-[1rem] font-semibold">Disclaimer</h2>
          <Disclaimer className="mt-2 text-sm" />
        </Card>
        <p className="text-xs text-muted">TradeGhost · MIT licensed · built for Kiroween 2026 with Kiro.</p>
      </div>
    </>
  )
}
