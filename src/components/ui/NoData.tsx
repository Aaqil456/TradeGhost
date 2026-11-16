import { useNavigate } from 'react-router-dom'
import { useLoadSample } from '../../features/import/useLoadSample'
import { Button, ButtonLink, EmptyState } from './primitives'

/** Empty state shown on data pages until the user imports real trades. */
export function NoData({ title = 'No trades imported yet' }: { title?: string }) {
  const { load, loading, error } = useLoadSample()
  const navigate = useNavigate()
  return (
    <>
      <EmptyState
        title={title}
        body="Connect a Hyperliquid wallet address for live analytics, or upload a CSV of completed trades. Everything is analyzed in your browser."
      >
        <ButtonLink to="/import">Connect wallet or import CSV</ButtonLink>
        <Button
          disabled={loading}
          onClick={async () => {
            if (await load()) navigate('/overview')
          }}
        >
          {loading ? 'Loading…' : 'Try with sample data'}
        </Button>
      </EmptyState>
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-negative">
          {error}
        </p>
      )}
    </>
  )
}
