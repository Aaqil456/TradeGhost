import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { cumulativePnl } from '../lib/finance/cumulative'
import { realizedDrawdown } from '../lib/finance/drawdown'
import { generateInsights } from '../lib/finance/insights'
import { computeMetrics } from '../lib/finance/metrics'
import { pairBreakdown } from '../lib/finance/pairs'
import { computeTrade } from '../lib/finance/pnl'
import type { Trade, TradeComputed } from '../lib/finance/types'

export interface ImportMeta {
  fileName: string
  importedAt: Date
  rowCount: number
}

interface AppState {
  trades: TradeComputed[] | null
  meta: ImportMeta | null
}

type Action =
  | { type: 'IMPORT_TRADES'; trades: TradeComputed[]; meta: ImportMeta }
  | { type: 'CLEAR_TRADES' }

const initial: AppState = { trades: null, meta: null }

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'IMPORT_TRADES':
      return { trades: action.trades, meta: action.meta }
    case 'CLEAR_TRADES':
      return initial
    default:
      return state
  }
}

interface AppContextValue extends AppState {
  importTrades: (trades: Trade[], fileName: string) => void
  clearTrades: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

/** Session-only state: nothing is persisted or transmitted. */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)

  const importTrades = useCallback((trades: Trade[], fileName: string) => {
    dispatch({
      type: 'IMPORT_TRADES',
      trades: trades.map(computeTrade),
      meta: { fileName, importedAt: new Date(), rowCount: trades.length },
    })
  }, [])
  const clearTrades = useCallback(() => dispatch({ type: 'CLEAR_TRADES' }), [])

  const value = useMemo(() => ({ ...state, importTrades, clearTrades }), [state, importTrades, clearTrades])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

/** Memoized finance outputs derived from the imported trades. Null when nothing is imported. */
export function useAnalysis() {
  const { trades } = useApp()
  return useMemo(() => {
    if (!trades || trades.length === 0) return null
    const metrics = computeMetrics(trades)
    const pairs = pairBreakdown(trades)
    const series = cumulativePnl(trades)
    return {
      trades,
      metrics,
      pairs,
      series,
      drawdown: realizedDrawdown(series),
      insights: generateInsights(trades, metrics, pairs),
    }
  }, [trades])
}
