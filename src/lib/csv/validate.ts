import { toDec } from '../finance/decimal'
import type { Trade } from '../finance/types'
import { parseCsv, type RawCsv } from './parse'
import { REQUIRED_COLUMNS } from './schema'

export interface RowIssue {
  /** Line number in the original file (header = line 1). 0 for file-level issues. */
  row: number
  column?: string
  message: string
}

export interface ParseResult {
  validTrades: Trade[]
  errors: RowIssue[]
  warnings: RowIssue[]
  /** File line numbers of rows that were not imported (invalid or awaiting fee confirmation). */
  skippedRows: number[]
  /** Rows that are valid except for a blank `fees` value (only populated when not confirmed). */
  missingFeeRows: number[]
  /** Total data rows seen in the file. */
  totalRows: number
}

export interface ValidateOptions {
  /** User explicitly confirmed blank fees should be treated as 0. */
  treatMissingFeesAsZero?: boolean
}

const AMBIGUOUS_DATE = /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/

/** Parse a date. ISO (YYYY-MM-DD) is interpreted as UTC midnight. Returns null if unparseable. */
export function parseDate(value: string): Date | null {
  const v = value.trim()
  if (v === '') return null
  const iso = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(v)
  if (iso) {
    const [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    const dt = new Date(Date.UTC(y, m - 1, d))
    // Reject rollovers such as 2026-02-31.
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
    return dt
  }
  if (AMBIGUOUS_DATE.test(v)) return null // dd/mm vs mm/dd cannot be known; require ISO.
  if (!/\d{4}/.test(v)) return null
  const ms = Date.parse(v)
  return Number.isNaN(ms) ? null : new Date(ms)
}

export function validateText(text: string, options: ValidateOptions = {}): ParseResult {
  return validateRaw(parseCsv(text), options)
}

export function validateRaw(raw: RawCsv, options: ValidateOptions = {}): ParseResult {
  const result: ParseResult = {
    validTrades: [],
    errors: [],
    warnings: [],
    skippedRows: [],
    missingFeeRows: [],
    totalRows: raw.rows.length,
  }

  if (raw.fatal) {
    result.errors.push({ row: 0, message: raw.fatal })
    return result
  }

  const missing = REQUIRED_COLUMNS.filter((c) => !raw.headers.includes(c))
  if (missing.length > 0) {
    result.errors.push({
      row: 1,
      message: `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Required header: ${REQUIRED_COLUMNS.join(', ')}.`,
    })
    return result
  }

  const extra = raw.headers.filter((h) => h && !(REQUIRED_COLUMNS as readonly string[]).includes(h))
  if (extra.length > 0) {
    result.warnings.push({ row: 1, message: `Ignoring extra column${extra.length > 1 ? 's' : ''}: ${extra.join(', ')}.` })
  }

  if (raw.rows.length === 0) {
    result.errors.push({ row: 0, message: 'The file has a header but no trade rows.' })
    return result
  }

  raw.rows.forEach((rec, i) => {
    const line = i + 2
    const rowErrors: RowIssue[] = []
    const err = (column: string, message: string) => rowErrors.push({ row: line, column, message })

    if (rec.__extra) {
      rowErrors.push({ row: line, message: `Row has ${rec.__extra} more value(s) than the header has columns.` })
    }

    const date = parseDate(rec.date ?? '')
    if (!date) {
      err(
        'date',
        AMBIGUOUS_DATE.test((rec.date ?? '').trim())
          ? `Ambiguous date "${rec.date}". Use YYYY-MM-DD.`
          : `Invalid or missing date "${rec.date ?? ''}". Use YYYY-MM-DD.`,
      )
    }

    const symbol = (rec.symbol ?? '').trim().toUpperCase()
    if (!symbol) err('symbol', 'Symbol is required.')

    const sideRaw = (rec.side ?? '').trim().toUpperCase()
    if (sideRaw !== 'LONG' && sideRaw !== 'SHORT') {
      err('side', `Side must be LONG or SHORT (got "${rec.side ?? ''}").`)
    }

    const entry = toDec(rec.entry_price ?? '')
    if (!entry) err('entry_price', `Invalid entry_price "${rec.entry_price ?? ''}". Must be a number.`)
    else if (!entry.greaterThan(0)) err('entry_price', 'entry_price must be greater than 0.')

    const exit = toDec(rec.exit_price ?? '')
    if (!exit) err('exit_price', `Invalid exit_price "${rec.exit_price ?? ''}". Must be a number.`)
    else if (!exit.greaterThan(0)) err('exit_price', 'exit_price must be greater than 0.')

    const qty = toDec(rec.quantity ?? '')
    if (!qty) err('quantity', `Invalid quantity "${rec.quantity ?? ''}". Must be a number.`)
    else if (!qty.greaterThan(0)) err('quantity', 'quantity must be greater than 0.')

    const feesRaw = (rec.fees ?? '').trim()
    let fees = toDec(feesRaw)
    let feesBlank = false
    if (feesRaw === '') {
      feesBlank = true
    } else if (!fees) {
      err('fees', `Invalid fees "${feesRaw}". Must be a number (or blank).`)
    } else if (fees.isNegative()) {
      err('fees', 'fees cannot be negative.')
    }

    if (rowErrors.length > 0) {
      result.errors.push(...rowErrors)
      result.skippedRows.push(line)
      return
    }

    if (feesBlank) {
      if (!options.treatMissingFeesAsZero) {
        result.missingFeeRows.push(line)
        result.skippedRows.push(line)
        return
      }
      fees = toDec('0')
    }

    result.validTrades.push({
      id: i + 1,
      date: date!,
      symbol,
      side: sideRaw as Trade['side'],
      entryPrice: entry!,
      exitPrice: exit!,
      quantity: qty!,
      fees: fees!,
    })
  })

  if (options.treatMissingFeesAsZero) {
    const n = raw.rows.filter((r) => (r.fees ?? '').trim() === '').length
    if (n > 0) {
      result.warnings.push({ row: 0, message: `${n} row(s) had blank fees and were imported with fees = 0 (as you confirmed).` })
    }
  }

  return result
}
