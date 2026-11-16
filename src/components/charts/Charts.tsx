import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CumulativePoint, PairBreakdown } from '../../lib/finance/types'
import { fmtCurrency, fmtDate } from '../../lib/format/format'
import { Decimal } from '../../lib/finance/decimal'

// Shared palette (mirrors the @theme tokens in index.css).
const C = { positive: '#16c784', negative: '#ea3943', grid: '#20283a', muted: '#8a94a6', accent: '#2dd4bf' }

// Chart edge: the only place Decimal -> Number happens (for plotting).
const plot = (d: Decimal) => d.toDecimalPlaces(2).toNumber()
const axisMoney = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))

interface TipProps {
  active?: boolean
  payload?: { payload: Record<string, unknown> }[]
  render: (p: Record<string, unknown>) => { title: string; value: Decimal; extra?: string }
}

function Tip({ active, payload, render }: TipProps) {
  const row = active ? payload?.[0]?.payload : undefined
  if (!row) return null
  const { title, value, extra } = render(row)
  return (
    <div className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs shadow-lg">
      <div className="text-muted">{title}</div>
      <div className={`nums font-mono text-sm font-semibold ${value.isNegative() ? 'text-negative' : 'text-positive'}`}>
        {fmtCurrency(value, { signed: true })}
      </div>
      {extra && <div className="mt-0.5 text-muted">{extra}</div>}
    </div>
  )
}

export function CumulativeChart({ series }: { series: CumulativePoint[] }) {
  const data = series.map((p, i) => ({
    n: i + 1,
    label: fmtDate(p.date),
    value: plot(p.cumulative),
    raw: p.cumulative,
    dd: p.drawdown,
  }))
  const final = series[series.length - 1]?.cumulative
  const color = final && final.isNegative() ? C.negative : C.positive
  return (
    <div className="h-72 w-full" role="img" aria-label="Cumulative realized P&L over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="label" stroke={C.muted} tick={{ fontSize: 11 }} tickLine={false} minTickGap={32} />
          <YAxis stroke={C.muted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={axisMoney} />
          <ReferenceLine y={0} stroke={C.muted} strokeDasharray="3 3" />
          <Tooltip
            content={
              <Tip
                render={(p) => ({
                  title: `${p.label as string} · trade #${p.n as number}`,
                  value: p.raw as Decimal,
                  extra: `Realized P&L drawdown: ${fmtCurrency(p.dd as Decimal)}`,
                })}
              />
            }
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#cumFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PairChart({ pairs }: { pairs: PairBreakdown[] }) {
  const data = pairs.map((p) => ({ symbol: p.symbol, value: plot(p.netPnl), raw: p.netPnl, trades: p.trades }))
  return (
    <div className="w-full" style={{ height: Math.max(180, data.length * 44 + 30) }} role="img" aria-label="Net P&L by trading pair">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={C.grid} horizontal={false} />
          <XAxis type="number" stroke={C.muted} tick={{ fontSize: 11 }} tickLine={false} tickFormatter={axisMoney} />
          <YAxis type="category" dataKey="symbol" stroke={C.muted} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={116} />
          <ReferenceLine x={0} stroke={C.muted} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={<Tip render={(p) => ({ title: p.symbol as string, value: p.raw as Decimal, extra: `${p.trades as number} trades` })} />}
          />
          <Bar dataKey="value" radius={3} barSize={18} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.symbol} fill={d.value < 0 ? C.negative : C.positive} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ForecastChart({ points, startPnl }: { points: { step: number; p5: number; p50: number; p95: number }[]; startPnl: number }) {
  const data = points.map((p) => ({
    step: p.step,
    median: Math.round(p.p50 * 100) / 100,
    band: [Math.round(p.p5 * 100) / 100, Math.round(p.p95 * 100) / 100] as [number, number],
    low: p.p5,
    high: p.p95,
  }))
  return (
    <div className="h-72 w-full" role="img" aria-label="Projected cumulative P&L range over future trades">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="step" stroke={C.muted} tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis stroke={C.muted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={axisMoney} />
          <ReferenceLine y={0} stroke={C.muted} strokeDasharray="3 3" />
          <ReferenceLine y={startPnl} stroke={C.accent} strokeDasharray="2 4" />
          <Tooltip
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as (typeof data)[number] | undefined) : undefined
              if (!row) return null
              return (
                <div className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-xs shadow-lg">
                  <div className="text-muted">After {row.step} more trades</div>
                  <div className="nums font-mono text-sm font-semibold text-ink">Median {row.median.toFixed(2)}</div>
                  <div className="text-muted">
                    Likely range {row.low.toFixed(2)} to {row.high.toFixed(2)}
                  </div>
                </div>
              )
            }}
          />
          <Area type="monotone" dataKey="band" stroke="none" fill={C.accent} fillOpacity={0.18} isAnimationActive={false} />
          <Area type="monotone" dataKey="median" stroke={C.accent} strokeWidth={2} fill="none" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
