import { ZERO } from './decimal'
import type { Decimal } from './decimal'
import type { CumulativePoint } from './types'

export interface RealizedDrawdown {
  /** Most negative realized-P&L drawdown (<= 0). */
  max: Decimal
  /** Drawdown at the last point (<= 0). */
  current: Decimal
}

/**
 * Realized P&L drawdown: how far cumulative realized P&L sits below its running peak.
 * This is NOT account-equity drawdown (open positions and balances are not known).
 */
export function realizedDrawdown(series: readonly CumulativePoint[]): RealizedDrawdown {
  let max = ZERO
  for (const p of series) if (p.drawdown.lessThan(max)) max = p.drawdown
  const last = series.length ? series[series.length - 1] : undefined
  return { max, current: last ? last.drawdown : ZERO }
}
