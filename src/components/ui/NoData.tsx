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
        body="Upload your completed trade history as a CSV to see your real performance. Everything is processed locally in your browser."
      >
        <ButtonLink to="/import">Import your CSV</ButtonLink>
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
