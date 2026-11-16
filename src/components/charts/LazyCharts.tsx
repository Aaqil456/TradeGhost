import { lazy, Suspense } from 'react'
import type { CumulativePoint, PairBreakdown } from '../../lib/finance/types'

// Recharts is large; load it only when a dashboard with data is shown.
const Cumulative = lazy(() => import('./Charts').then((m) => ({ default: m.CumulativeChart })))
const Pairs = lazy(() => import('./Charts').then((m) => ({ default: m.PairChart })))

const fallback = <div className="h-48 animate-pulse rounded-lg bg-panel-2" aria-label="Loading chart" />

export function CumulativeChart({ series }: { series: CumulativePoint[] }) {
  return (
    <Suspense fallback={fallback}>
      <Cumulative series={series} />
    </Suspense>
  )
}

export function PairChart({ pairs }: { pairs: PairBreakdown[] }) {
  return (
    <Suspense fallback={fallback}>
      <Pairs pairs={pairs} />
    </Suspense>
  )
}

const Forecast = lazy(() => import('./Charts').then((m) => ({ default: m.ForecastChart })))

export function ForecastChart(props: { points: { step: number; p5: number; p50: number; p95: number }[]; startPnl: number }) {
  return (
    <Suspense fallback={fallback}>
      <Forecast {...props} />
    </Suspense>
  )
}
