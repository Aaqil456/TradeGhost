import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { cumulativePnl } from '../lib/finance/cumulative'
import { realizedDrawdown } from '../lib/finance/drawdown'
import { forecast } from '../lib/finance/forecast'
import { generateInsights } from '../lib/finance/insights'
import { computeMetrics } from '../lib/finance/metrics'
import { pairBreakdown } from '../lib/finance/pairs'
import { computeTrade } from '../lib/finance/pnl'
import { generateSuggestions } from '../lib/finance/suggestions'
import type { Trade, TradeComputed } from '../lib/finance/types'
import { loadWallet, shortAddress } from '../lib/sources/hyperliquid'

export interface ImportMeta {
  fileName: string
  importedAt: Date
  rowCount: number
}

export interface LiveSource {
  kind: 'hyperliquid'
  address: string
  lastSynced: Date
  warnings: string[]
}

interface AppState {
  trades: TradeComputed[] | null
  meta: ImportMeta | null
  /** Set when the data comes from a connected wallet (live) instead of a CSV. */
  live: LiveSource | null
}

type Action =
  | { type: 'IMPORT_TRADES'; trades: TradeComputed[]; meta: ImportMeta }
  | { type: 'SET_LIVE'; trades: TradeComputed[]; live: LiveSource }
  | { type: 'CLEAR_TRADES' }

const initial: AppState = { trades: null, meta: null, live: null }

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'IMPORT_TRADES':
      return { trades: action.trades, meta: action.meta, live: null }
    case 'SET_LIVE':
      return {
        trades: action.trades,
        live: action.live,
        meta: {
          fileName: `Hyperliquid ${shortAddress(action.live.address)}`,
          importedAt: action.live.lastSynced,
          rowCount: action.trades.length,
        },
      }
    case 'CLEAR_TRADES':
      return initial
    default:
      return state
  }
}

export type SyncState = { status: 'idle' | 'loading'; error: string | null }

interface AppContextValue extends AppState {
  sync: SyncState
  importTrades: (trades: Trade[], fileName: string) => void
  connectWallet: (address: string) => Promise<{ ok: boolean; error?: string }>
  refreshLive: () => Promise<void>
  clearTrades: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export const LIVE_REFRESH_MS = 60_000

/** Session-only state: nothing is persisted. Wallet addresses are public and kept in memory only. */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const [sync, setSync] = useState<SyncState>({ status: 'idle', error: null })
  const addressRef = useRef<string | null>(null)
  addressRef.current = state.live?.address ?? null

  const importTrades = useCallback((trades: Trade[], fileName: string) => {
    dispatch({
      type: 'IMPORT_TRADES',
      trades: trades.map(computeTrade),
      meta: { fileName, importedAt: new Date(), rowCount: trades.length },
    })
  }, [])

  const fetchLive = useCallback(async (address: string) => {
    const res = await loadWallet(address)
    dispatch({
      type: 'SET_LIVE',
      trades: res.trades.map(computeTrade),
      live: { kind: 'hyperliquid', address: address.trim().toLowerCase(), lastSynced: new Date(), warnings: res.warnings },
    })
    return res.trades.length
  }, [])

  const connectWallet = useCallback(
    async (address: string) => {
      setSync({ status: 'loading', error: null })
      try {
        const n = await fetchLive(address)
        setSync({ status: 'idle', error: null })
        if (n === 0) {
          return { ok: true, error: 'Connected, but this wallet has no completed perpetual trades yet.' }
        }
        return { ok: true }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not load that wallet.'
        setSync({ status: 'idle', error: msg })
        return { ok: false, error: msg }
      }
    },
    [fetchLive],
  )

  const refreshLive = useCallback(async () => {
    const a = addressRef.current
    if (!a) return
    setSync({ status: 'loading', error: null })
    try {
      await fetchLive(a)
      setSync({ status: 'idle', error: null })
    } catch (e) {
      // keep showing the last good data; surface the problem
      setSync({ status: 'idle', error: e instanceof Error ? e.message : 'Refresh failed.' })
    }
  }, [fetchLive])

  const clearTrades = useCallback(() => {
    dispatch({ type: 'CLEAR_TRADES' })
    setSync({ status: 'idle', error: null })
  }, [])

  // Auto-refresh while a wallet is connected (live analytics).
  const connected = state.live !== null
  useEffect(() => {
    if (!connected) return
    const id = setInterval(() => void refreshLive(), LIVE_REFRESH_MS)
    return () => clearInterval(id)
  }, [connected, refreshLive])

  const value = useMemo(
    () => ({ ...state, sync, importTrades, connectWallet, refreshLive, clearTrades }),
    [state, sync, importTrades, connectWallet, refreshLive, clearTrades],
  )
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
      suggestions: generateSuggestions(trades, metrics, pairs),
      forecast: forecast(trades),
    }
  }, [trades])
}
