import { useCallback, useState } from 'react'
import { validateText } from '../../lib/csv/validate'
import { useApp } from '../../store/AppContext'

/** Loads the bundled sample CSV through the normal validation pipeline (demo only). */
export function useLoadSample() {
  const { importTrades } = useApp()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/sample-trade-history.csv')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const parsed = validateText(await res.text())
      if (parsed.errors.length > 0 || parsed.validTrades.length === 0) {
        throw new Error(parsed.errors[0]?.message ?? 'Sample file has no valid trades.')
      }
      importTrades(parsed.validTrades, 'sample-trade-history.csv')
      return true
    } catch (e) {
      setError(`Could not load the sample data: ${e instanceof Error ? e.message : 'unknown error'}`)
      return false
    } finally {
      setLoading(false)
    }
  }, [importTrades])

  return { load, loading, error }
}
