import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import type { Sign } from '../../lib/format/format'

export const signClass: Record<Sign, string> = {
  positive: 'text-positive',
  negative: 'text-negative',
  neutral: 'text-ink',
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-panel p-5 ${className}`}>{children}</section>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function MetricCard({
  label,
  value,
  sign = 'neutral',
  hint,
}: {
  label: string
  value: string
  sign?: Sign
  hint?: string
}) {
  return (
    <div className="tg-fade rounded-xl border border-line bg-panel p-4 transition-colors hover:border-accent/40">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`nums mt-2 truncate font-mono text-2xl font-semibold ${signClass[sign]}`} title={value}>
        {value}
      </div>
      {hint && <div className="mt-1 truncate text-xs text-muted">{hint}</div>}
    </div>
  )
}

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50'
const btnVariants = {
  primary: 'bg-accent text-base hover:bg-accent/90',
  secondary: 'border border-line bg-panel-2 text-ink hover:border-accent/50',
  danger: 'border border-negative/40 bg-negative/10 text-negative hover:bg-negative/20',
} as const
type Variant = keyof typeof btnVariants

export function Button({
  variant = 'secondary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${btnBase} ${btnVariants[variant]} ${className}`} {...rest} />
}

export function ButtonLink({ variant = 'primary', className = '', ...rest }: LinkProps & { variant?: Variant }) {
  return <Link className={`${btnBase} ${btnVariants[variant]} ${className}`} {...rest} />
}

export function Badge({ result }: { result: 'WIN' | 'LOSS' }) {
  const cls = result === 'WIN' ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>{result}</span>
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string
  body: string
  children?: ReactNode
}) {
  return (
    <div className="tg-fade flex flex-col items-center rounded-xl border border-dashed border-line bg-panel/50 px-6 py-16 text-center">
      <GhostMark className="mb-4 h-12 w-12 text-accent" />
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  )
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-muted/80 ${className}`}>
      TradeGhost provides historical performance analysis and educational insights, not financial or
      investment advice.
    </p>
  )
}

export function GhostMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 11a7 7 0 0 1 14 0v9l-2.5-1.5L14 20l-2.5-1.5L9 20l-2.5-1.5L5 20v-9z"
        fill="currentColor"
        opacity={0.18}
      />
      <path
        d="M5 11a7 7 0 0 1 14 0v9l-2.5-1.5L14 20l-2.5-1.5L9 20l-2.5-1.5L5 20v-9z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="11" r="1.4" fill="currentColor" />
      <circle cx="14.5" cy="11" r="1.4" fill="currentColor" />
    </svg>
  )
}
