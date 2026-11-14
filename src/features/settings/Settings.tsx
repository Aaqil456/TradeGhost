import { Button, Card, Disclaimer, PageHeader } from '../../components/ui/primitives'
import { useApp } from '../../store/AppContext'

export function Settings() {
  const { trades, meta, clearTrades } = useApp()
  return (
    <>
      <PageHeader title="Settings" subtitle="Privacy, data handling and about." />
      <div className="space-y-4">
        <Card>
          <h2 className="text-base font-semibold">How your data is handled</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>Your CSV is read and analyzed entirely in your browser.</li>
            <li>Nothing is uploaded, transmitted to a server or sent to any third-party service.</li>
            <li>TradeGhost never asks for exchange API keys.</li>
            <li>Data is held in memory only. Refreshing or closing the tab clears it.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Current dataset</h2>
          {trades && meta ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {meta.fileName} · {meta.rowCount} trades
              </p>
              <Button variant="danger" onClick={clearTrades}>
                Remove dataset
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No dataset loaded.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold">How P&amp;L is calculated</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>LONG: (exit − entry) × quantity. SHORT: (entry − exit) × quantity.</li>
            <li>Net P&amp;L = gross P&amp;L − fees. A trade is a WIN only if net P&amp;L is above zero.</li>
            <li>Cumulative P&amp;L and drawdown are based on realized trades, not account equity.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Disclaimer</h2>
          <Disclaimer className="mt-2 text-sm" />
        </Card>
        <p className="text-xs text-muted">TradeGhost · MIT licensed · built for Kiroween 2026 with Kiro.</p>
      </div>
    </>
  )
}
