import Decimal from 'decimal.js'

// Configured once. Decimal at the core, Number only at display edges.
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export { Decimal }

export const ZERO = new Decimal(0)

/** Parse a string into a finite Decimal, or return null if invalid. */
export function toDec(value: string): Decimal | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  // Reject anything decimal.js would accept that isn't a plain finite number
  // (hex, binary, 'Infinity', 'NaN', thousands separators).
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) return null
  try {
    const d = new Decimal(trimmed)
    return d.isFinite() ? d : null
  } catch {
    return null
  }
}
