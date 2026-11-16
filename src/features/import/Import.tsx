import { useMemo, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, PageHeader, signClass } from '../../components/ui/primitives'
import { computeTrade } from '../../lib/finance/pnl'
import { TEMPLATE_FILE_NAME } from '../../lib/csv/schema'
import { validateText, type RowIssue } from '../../lib/csv/validate'
import { fmtCurrency, fmtDate, fmtPrice, signOf } from '../../lib/format/format'
import { useApp } from '../../store/AppContext'
import { ConnectWallet } from './ConnectWallet'
import { useLoadSample } from './useLoadSample'

const MAX_BYTES = 10 * 1024 * 1024
const PREVIEW_ROWS = 15

type FeesDecision = 'pending' | 'zero'

export function Import() {
  const { trades, meta, importTrades, clearTrades } = useApp()
  const navigate = useNavigate()
  const sample = useLoadSample()
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState<{ name: string; text: string } | null>(null)
  const [readError, setReadError] = useState<string | null>(null)
  const [fees, setFees] = useState<FeesDecision>('pending')

  const result = useMemo(
    () => (file ? validateText(file.text, { treatMissingFeesAsZero: fees === 'zero' }) : null),
    [file, fees],
  )
  const preview = useMemo(() => result?.validTrades.map(computeTrade) ?? [], [result])

  async function accept(f: File | undefined) {
    setReadError(null)
    if (!f) return
    if (!/\.(csv|txt)$/i.test(f.name) && f.type !== 'text/csv') {
      setReadError('Please choose a .csv file.')
      return
    }
    if (f.size > MAX_BYTES) {
      setReadError('That file is larger than 10 MB. Please upload a smaller CSV.')
      return
    }
    try {
      setFees('pending')
      setFile({ name: f.name, text: await f.text() })
    } catch {
      setReadError('Could not read that file.')
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDrag(false)
    void accept(e.dataTransfer.files[0])
  }

  function reset() {
    setFile(null)
    setFees('pending')
    setReadError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const hasPendingFees = !!result && result.missingFeeRows.length > 0
  const canImport = !!result && result.validTrades.length > 0 && !hasPendingFees

  return (
    <>
      <PageHeader
        title="Connect or Import"
        subtitle="Connect a wallet for live analytics, or upload a CSV. Everything is analyzed in your browser."
        action={
          <a
            href="/sample-trade-history.csv"
            download={TEMPLATE_FILE_NAME}
            className="inline-flex items-center rounded-lg border border-line bg-panel-2 px-4 py-2 text-sm font-medium hover:border-accent/50"
          >
            Download sample CSV
          </a>
        }
      />

      <ConnectWallet />

      {trades && meta && !file && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">{meta.fileName}</div>
            <div className="text-xs text-muted">{meta.rowCount} trades currently loaded</div>
          </div>
          <Button variant="danger" onClick={clearTrades}>
            Remove dataset
          </Button>
        </Card>
      )}

      {!file && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${drag ? 'border-accent bg-accent/5' : 'border-line bg-panel/50'}`}
          >
            <p className="text-base font-medium">Drag &amp; drop your CSV here</p>
            <p className="mt-1 text-sm text-muted">or</p>
            <label className="mt-3 inline-block cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-base focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent hover:bg-accent/90">
              Choose file
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                aria-label="Choose CSV file"
                onChange={(e) => void accept(e.target.files?.[0])}
              />
            </label>
            <p className="mt-4 text-xs text-muted">Required columns: date, symbol, side (LONG/SHORT), entry_price, exit_price, quantity, fees</p>
          </div>
          {readError && (
            <p role="alert" className="mt-3 text-sm text-negative">
              {readError}
            </p>
          )}
          <div className="mt-4 text-center">
            <Button
              disabled={sample.loading}
              onClick={async () => {
                if (await sample.load()) navigate('/overview')
              }}
            >
              {sample.loading ? 'Loading…' : 'Or try the sample dataset'}
            </Button>
            {sample.error && (
              <p role="alert" className="mt-2 text-sm text-negative">
                {sample.error}
              </p>
            )}
          </div>
        </>
      )}

      {file && result && (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted">
                {result.totalRows} rows · {result.validTrades.length} valid · {result.skippedRows.length} skipped
              </div>
            </div>
            <Button variant="danger" onClick={reset}>
              Remove file
            </Button>
          </Card>

          {result.errors.length > 0 && <IssueList title="Errors" issues={result.errors} tone="negative" />}
          {result.warnings.length > 0 && <IssueList title="Warnings" issues={result.warnings} tone="neutral" />}

          {hasPendingFees && (
            <Card className="border-accent/40">
              <h2 className="text-base font-semibold">{result.missingFeeRows.length} row(s) have blank fees</h2>
              <p className="mt-1 text-sm text-muted">
                Rows {result.missingFeeRows.slice(0, 10).join(', ')}
                {result.missingFeeRows.length > 10 ? '…' : ''}. TradeGhost won&apos;t assume fees are zero unless you say so,
                because that would overstate your profit.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => setFees('zero')}>
                  Treat blank fees as 0
                </Button>
                <Button onClick={reset}>Cancel &amp; fix the file</Button>
              </div>
            </Card>
          )}

          {preview.length > 0 && (
            <Card className="p-0">
              <div className="flex items-center justify-between p-4 pb-2">
                <h2 className="text-base font-semibold">Preview</h2>
                <span className="text-xs text-muted">
                  First {Math.min(PREVIEW_ROWS, preview.length)} of {preview.length} valid trades
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted">
                    <tr>
                      {['Date', 'Pair', 'Side', 'Entry', 'Exit', 'Qty', 'Fees', 'Net P&L', 'Result'].map((h, i) => (
                        <th key={h} className={`px-4 py-2 font-medium ${i >= 3 && i <= 7 ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, PREVIEW_ROWS).map((t) => (
                      <tr key={t.id} className="border-t border-line">
                        <td className="nums px-4 py-2 font-mono">{fmtDate(t.date)}</td>
                        <td className="px-4 py-2 font-medium">{t.symbol}</td>
                        <td className="px-4 py-2 text-muted">{t.side}</td>
                        <td className="nums px-4 py-2 text-right font-mono">{fmtPrice(t.entryPrice)}</td>
                        <td className="nums px-4 py-2 text-right font-mono">{fmtPrice(t.exitPrice)}</td>
                        <td className="nums px-4 py-2 text-right font-mono">{fmtPrice(t.quantity)}</td>
                        <td className="nums px-4 py-2 text-right font-mono text-muted">{fmtPrice(t.fees)}</td>
                        <td className={`nums px-4 py-2 text-right font-mono font-semibold ${signClass[signOf(t.netPnl)]}`}>
                          {fmtCurrency(t.netPnl, { signed: true })}
                        </td>
                        <td className="px-4 py-2">
                          <Badge result={t.result} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              disabled={!canImport}
              onClick={() => {
                importTrades(result.validTrades, file.name)
                reset()
                navigate('/overview')
              }}
            >
              Import {result.validTrades.length} trade{result.validTrades.length === 1 ? '' : 's'}
              {result.skippedRows.length > 0 ? ` (skip ${result.skippedRows.length})` : ''}
            </Button>
            {hasPendingFees && <span className="text-xs text-muted">Resolve the blank fees above to continue.</span>}
          </div>
        </div>
      )}
    </>
  )
}

function IssueList({ title, issues, tone }: { title: string; issues: RowIssue[]; tone: 'negative' | 'neutral' }) {
  const shown = issues.slice(0, 50)
  return (
    <Card className={tone === 'negative' ? 'border-negative/40' : ''}>
      <h2 className={`text-base font-semibold ${tone === 'negative' ? 'text-negative' : ''}`}>
        {title} ({issues.length})
      </h2>
      <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm" role={tone === 'negative' ? 'alert' : undefined}>
        {shown.map((e, i) => (
          <li key={i} className="text-muted">
            {e.row > 0 && <span className="nums mr-2 font-mono text-ink">Row {e.row}</span>}
            {e.column && <span className="mr-2 rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs">{e.column}</span>}
            {e.message}
          </li>
        ))}
      </ul>
      {issues.length > shown.length && <p className="mt-2 text-xs text-muted">…and {issues.length - shown.length} more.</p>}
    </Card>
  )
}
