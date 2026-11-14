import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseDate, validateText } from '../../src/lib/csv/validate'

const H = 'date,symbol,side,entry_price,exit_price,quantity,fees'

describe('validateText', () => {
  it('imports the shipped sample template with no errors', () => {
    const text = readFileSync('public/sample-trade-history.csv', 'utf8')
    const r = validateText(text)
    expect(r.errors).toEqual([])
    expect(r.validTrades.length).toBe(14)
    expect(r.missingFeeRows).toEqual([])
  })

  it('accepts a valid row and normalizes symbol/side case', () => {
    const r = validateText(`${H}\n2026-01-03, btcusdt ,long,100,110,2,1`)
    expect(r.errors).toEqual([])
    expect(r.validTrades[0]).toMatchObject({ symbol: 'BTCUSDT', side: 'LONG' })
  })

  it('rejects empty files and whitespace-only files', () => {
    expect(validateText('').errors[0]!.message).toMatch(/empty/i)
    expect(validateText('  \n \n').errors[0]!.message).toMatch(/empty/i)
  })

  it('rejects header-only files', () => {
    const r = validateText(H)
    expect(r.validTrades).toEqual([])
    expect(r.errors[0]!.message).toMatch(/no trade rows/i)
  })

  it('reports all missing columns', () => {
    const r = validateText('date,symbol\n2026-01-01,BTC')
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.message).toContain('side')
    expect(r.errors[0]!.message).toContain('fees')
  })

  it('collects every row error with row numbers (no fail-fast)', () => {
    const r = validateText(
      [
        H,
        'not-a-date,BTC,LONG,1,2,1,0', // line 2
        '2026-01-01,,LONG,1,2,1,0', // line 3
        '2026-01-01,BTC,BUY,1,2,1,0', // line 4
        '2026-01-01,BTC,LONG,abc,2,1,0', // line 5
        '2026-01-01,BTC,LONG,1,2,0,0', // line 6 qty 0
        '2026-01-01,BTC,LONG,1,2,1,-1', // line 7 neg fee
        '2026-01-01,BTC,LONG,1,2,1,0', // line 8 valid
      ].join('\n'),
    )
    expect(r.validTrades).toHaveLength(1)
    expect(r.skippedRows).toEqual([2, 3, 4, 5, 6, 7])
    expect(r.errors.map((e) => `${e.row}:${e.column}`)).toEqual([
      '2:date',
      '3:symbol',
      '4:side',
      '5:entry_price',
      '6:quantity',
      '7:fees',
    ])
  })

  it('rejects NaN / Infinity / hex / thousands separators in numbers', () => {
    for (const bad of ['NaN', 'Infinity', '0x10', '1,000']) {
      const r = validateText(`${H}\n2026-01-01,BTC,LONG,"${bad}",2,1,0`)
      expect(r.validTrades).toHaveLength(0)
      expect(r.errors[0]!.column).toBe('entry_price')
    }
  })

  it('does NOT silently zero blank fees; requires confirmation', () => {
    const csv = `${H}\n2026-01-01,BTC,LONG,1,2,1,\n2026-01-02,BTC,LONG,1,2,1,0.5`
    const pending = validateText(csv)
    expect(pending.validTrades).toHaveLength(1)
    expect(pending.missingFeeRows).toEqual([2])
    expect(pending.skippedRows).toEqual([2])

    const confirmed = validateText(csv, { treatMissingFeesAsZero: true })
    expect(confirmed.validTrades).toHaveLength(2)
    expect(confirmed.validTrades[0]!.fees.toString()).toBe('0')
    expect(confirmed.missingFeeRows).toEqual([])
    expect(confirmed.warnings.some((w) => /blank fees/.test(w.message))).toBe(true)
  })

  it('handles BOM, CRLF, header case/spacing, and extra columns', () => {
    const csv = '﻿Date, Symbol ,SIDE,Entry Price,Exit-Price,Quantity,Fees,notes\r\n2026-01-01,BTC,short,10,8,1,0,hi\r\n'
    const r = validateText(csv)
    expect(r.errors).toEqual([])
    expect(r.validTrades).toHaveLength(1)
    expect(r.warnings[0]!.message).toMatch(/extra column/i)
  })

  it('auto-detects semicolon delimiters', () => {
    const r = validateText(H.replaceAll(',', ';') + '\n2026-01-01;BTC;LONG;1;2;1;0')
    expect(r.errors).toEqual([])
    expect(r.validTrades).toHaveLength(1)
  })

  it('skips fully blank lines', () => {
    const r = validateText(`${H}\n\n2026-01-01,BTC,LONG,1,2,1,0\n\n\n`)
    expect(r.validTrades).toHaveLength(1)
    expect(r.errors).toEqual([])
  })

  it('flags rows with more values than header columns', () => {
    const r = validateText(`${H}\n2026-01-01,BTC,LONG,1,2,1,0,9`)
    expect(r.validTrades).toHaveLength(0)
    expect(r.errors[0]!.message).toMatch(/more value/)
  })

  it('assigns stable ids by data-row index', () => {
    const r = validateText(`${H}\n2026-01-01,A,LONG,1,2,1,0\n2026-01-02,B,LONG,1,2,1,0`)
    expect(r.validTrades.map((t) => t.id)).toEqual([1, 2])
  })
})

describe('parseDate', () => {
  it('parses ISO dates as UTC midnight', () => {
    expect(parseDate('2026-03-05')!.toISOString()).toBe('2026-03-05T00:00:00.000Z')
  })
  it('rejects impossible dates and ambiguous formats', () => {
    expect(parseDate('2026-02-31')).toBeNull()
    expect(parseDate('2026-13-01')).toBeNull()
    expect(parseDate('01/02/2026')).toBeNull()
    expect(parseDate('')).toBeNull()
    expect(parseDate('hello')).toBeNull()
  })
  it('accepts ISO datetime', () => {
    expect(parseDate('2026-03-05T10:30:00Z')!.toISOString()).toBe('2026-03-05T10:30:00.000Z')
  })
})
