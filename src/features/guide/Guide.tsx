import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, ButtonLink, Card, Disclaimer, PageHeader } from '../../components/ui/primitives'
import { SAMPLE_WALLETS } from '../../lib/sources/samples'
import { useApp } from '../../store/AppContext'

const STEPS = [
  { title: 'Open the Connect page', body: 'Tap Connect in the menu (bottom bar on mobile, sidebar on desktop).' },
  { title: 'Paste a wallet address', body: 'Paste a Hyperliquid wallet address into the box at the top: 0x followed by 40 characters. No API key or sign-up is needed.' },
  { title: 'Press Connect', body: 'TradeGhost reads that wallet’s public trades and opens your dashboard. Large wallets can take up to 30 seconds.' },
  { title: 'Explore your results', body: 'Overview shows totals and charts. Analytics shows insights and suggestions. Forecast projects your future P&L. History lists every trade.' },
  { title: 'Stay live', body: 'Connected wallets refresh every minute. Use "Refresh now" on Overview any time.' },
]

export function Guide() {
  const { connectWallet, sync } = useApp()
  const navigate = useNavigate()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function use(address: string) {
    setBusy(address)
    setError(null)
    const res = await connectWallet(address)
    setBusy(null)
    if (res.ok) navigate('/overview')
    else setError(res.error ?? 'Could not load that wallet.')
  }

  async function copy(address: string) {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(address)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
    }
  }

  return (
    <>
      <PageHeader title="How to use TradeGhost" subtitle="See your real trading performance in under a minute." />

      <Card className="mb-6">
        <h2 className="text-[1rem] font-semibold">Quick start</h2>
        <ol className="mt-4 space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="nums flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium">{s.title}</div>
                <p className="mt-0.5 text-sm text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5">
          <ButtonLink to="/import">Go to Connect</ButtonLink>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-[1rem] font-semibold">Try a sample wallet</h2>
        <p className="mt-1 text-sm text-muted">
          Don’t have a Hyperliquid wallet? Use one of these public wallets from the Hyperliquid leaderboard. Tap “Use this wallet”
          to load it, or copy the address and paste it on the Connect page.
        </p>
        <ul className="mt-4 space-y-3">
          {SAMPLE_WALLETS.map((w) => (
            <li key={w.address} className="rounded-lg border border-line bg-panel-2 p-3">
              <div className="text-sm font-medium">{w.label}</div>
              <div className="nums mt-1 break-all font-mono text-xs text-muted">{w.address}</div>
              <p className="mt-1 text-xs text-muted">{w.note}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="primary" disabled={sync.status === 'loading'} onClick={() => void use(w.address)}>
                  {busy === w.address ? 'Loading…' : 'Use this wallet'}
                </Button>
                <Button onClick={() => void copy(w.address)}>{copied === w.address ? 'Copied' : 'Copy address'}</Button>
              </div>
            </li>
          ))}
        </ul>
        {error && (
          <p role="alert" className="mt-3 text-sm text-negative">
            {error}
          </p>
        )}
        <p className="mt-3 text-xs text-muted">
          These wallets belong to other traders and their results change over time. They are public on-chain data used only as demos.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-[1rem] font-semibold">Prefer a file? Import a CSV</h2>
        <p className="mt-1 text-sm text-muted">
          On the Connect page you can also drop a CSV of completed trades with the columns{' '}
          <span className="nums font-mono text-xs">date, symbol, side, entry_price, exit_price, quantity, fees</span>. A sample file is
          available there to download.
        </p>
      </Card>

      <Card className="mb-6">
        <h2 className="text-[1rem] font-semibold">Good to know</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Live mode supports Hyperliquid wallets only. Addresses from other chains (Ethereum, Base, Solana) won’t work yet.</li>
          <li>One trade is one position from flat to flat. Positions still open are left out until they close.</li>
          <li>Forecast needs at least 30 completed trades; Suggestions need at least 10.</li>
          <li>If you see “too many requests”, wait a minute and try again.</li>
          <li>
            Your data stays in your browser. See <Link to="/settings" className="text-accent hover:underline">Settings</Link> for details.
          </li>
        </ul>
      </Card>
      <Disclaimer />
    </>
  )
}
