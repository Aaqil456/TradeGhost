import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../components/ui/primitives'
import { isValidAddress } from '../../lib/sources/hyperliquid'
import { useApp } from '../../store/AppContext'

export function ConnectWallet() {
  const { connectWallet, sync } = useApp()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loading = sync.status === 'loading'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isValidAddress(address)) {
      setError('Enter a valid wallet address: 0x followed by 40 characters.')
      return
    }
    const res = await connectWallet(address)
    if (!res.ok) setError(res.error ?? 'Could not load that wallet.')
    else navigate('/overview')
  }

  return (
    <Card className="mb-6 border-accent/30">
      <h2 className="text-[1rem] font-semibold">Connect a wallet (live)</h2>
      <p className="mt-1 text-sm text-muted">
        Paste a Hyperliquid wallet address. No API key, no signing, no sign-up. Your trades load automatically and refresh
        every minute.
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
        <label htmlFor="wallet" className="sr-only">
          Wallet address
        </label>
        <input
          id="wallet"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x… wallet address"
          autoComplete="off"
          spellCheck={false}
          className="nums min-w-0 flex-1 rounded-lg border border-line bg-base px-3 py-2 font-mono text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Loading…' : 'Connect'}
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted">
        No wallet? <Link to="/guide" className="text-accent hover:underline">See sample wallets and how to use</Link>.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-negative">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        A wallet address is public on-chain data. It is sent only to Hyperliquid&apos;s public API from your browser and is
        never stored. Anyone with an address can view its trades, so only connect addresses you are comfortable analyzing.
        Only perpetual-futures trades are analyzed.
      </p>
    </Card>
  )
}
