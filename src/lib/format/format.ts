import type { Decimal } from '../finance/decimal'

/**
 * The only place Decimal values become display strings. Rounding is ROUND_HALF_UP via decimal.js.
 */
function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function fmtNumber(d: Decimal, decimals = 2): string {
  const fixed = d.toDecimalPlaces(decimals).toFixed(decimals)
  const neg = fixed.startsWith('-')
  const [int, frac] = (neg ? fixed.slice(1) : fixed).split('.')
  const body = group(int ?? '0') + (frac ? `.${frac}` : '')
  // Avoid "-0.00"
  const isZero = /^[0.,]+$/.test(body)
  return neg && !isZero ? `-${body}` : body
}

/** Signed-aware currency string in USDT-style units, e.g. "+$1,234.50" when signed. */
export function fmtCurrency(d: Decimal, opts: { signed?: boolean } = {}): string {
  const s = fmtNumber(d.abs(), 2)
  const isZero = /^[0.,]+$/.test(s)
  if (d.isNegative() && !isZero) return `-$${s}`
  if (opts.signed && !isZero) return `+$${s}`
  return `$${s}`
}

export function fmtPct(d: Decimal, decimals = 1): string {
  return `${fmtNumber(d, decimals)}%`
}

/** Prices/quantities keep up to 8 decimals with trailing zeros trimmed. */
export function fmtPrice(d: Decimal): string {
  const fixed = d.toDecimalPlaces(8).toFixed()
  const [int, frac] = fixed.split('.')
  const neg = int?.startsWith('-')
  const intDigits = (neg ? int!.slice(1) : int) ?? '0'
  return `${neg ? '-' : ''}${group(intDigits)}${frac ? `.${frac}` : ''}`
}

export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export type Sign = 'positive' | 'negative' | 'neutral'
export function signOf(d: Decimal): Sign {
  return d.greaterThan(0) ? 'positive' : d.isNegative() && !d.isZero() ? 'negative' : 'neutral'
}
