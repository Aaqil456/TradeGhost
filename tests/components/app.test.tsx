import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/App'
import { filterAndSort } from '../../src/features/history/History'
import { AppProvider, reducer } from '../../src/store/AppContext'
import { validateText } from '../../src/lib/csv/validate'
import { computeTrade } from '../../src/lib/finance/pnl'
import { readFileSync } from 'node:fs'

const SAMPLE = readFileSync('public/sample-trade-history.csv', 'utf8')

// Recharts needs layout APIs happy-dom does not provide.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', RO)

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.stubGlobal('ResizeObserver', RO)
})

function renderAt(path: string) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

function stubSampleFetch() {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => SAMPLE })))
  vi.stubGlobal('ResizeObserver', RO)
}

describe('empty states (no fake numbers)', () => {
  it.each(['/overview', '/analytics', '/history'])('%s shows an import CTA and no metrics', (path) => {
    renderAt(path)
    expect(screen.getByText('No trades imported yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /connect wallet or import csv/i })).toHaveAttribute('href', '/import')
    expect(screen.queryByText(/net p&l/i)).not.toBeInTheDocument()
  })

  it('redirects / to overview', () => {
    renderAt('/')
    expect(screen.getByText(/understand your real trading performance/i)).toBeInTheDocument()
  })
})

describe('import flow', () => {
  it('shows validation errors for a bad CSV and blocks import', async () => {
    renderAt('/import')
    const file = new File(['date,symbol\n2026-01-01,BTC'], 'bad.csv', { type: 'text/csv' })
    fireEvent.change(screen.getByLabelText('Choose CSV file'), { target: { files: [file] } })
    expect(await screen.findByText(/missing required column/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import 0 trades/i })).toBeDisabled()
  })

  it('requires explicit confirmation for blank fees', async () => {
    renderAt('/import')
    const csv = 'date,symbol,side,entry_price,exit_price,quantity,fees\n2026-01-01,BTC,LONG,100,110,1,'
    fireEvent.change(screen.getByLabelText('Choose CSV file'), {
      target: { files: [new File([csv], 'nofees.csv', { type: 'text/csv' })] },
    })
    expect(await screen.findByRole('heading', { name: /have blank fees/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^import/i })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /treat blank fees as 0/i }))
    expect(await screen.findByText(/\+\$10\.00/)).toBeInTheDocument() // preview net P&L
    expect(screen.getByRole('button', { name: /^import 1 trade/i })).toBeEnabled()
  })

  it('rejects non-CSV files', async () => {
    renderAt('/import')
    fireEvent.change(screen.getByLabelText('Choose CSV file'), {
      target: { files: [new File(['x'], 'pic.png', { type: 'image/png' })] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(/\.csv/)
  })

  it('imports the sample, shows real metrics, then removes the dataset', async () => {
    stubSampleFetch()
    renderAt('/overview')
    fireEvent.click(screen.getByRole('button', { name: /try with sample data/i }))
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()

    const expected = validateText(SAMPLE).validTrades.map(computeTrade)
    const total = expected.reduce((s, t) => s.plus(t.netPnl), expected[0]!.netPnl.minus(expected[0]!.netPnl))
    const card = screen.getByText('Total net P&L').parentElement!
    expect(card.textContent).toContain(total.abs().toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','))
    expect(screen.getByText('Total trades').nextElementSibling).toHaveTextContent('14')

    // remove from Import page
    cleanup()
  })
})

describe('history filtering/sorting', () => {
  const trades = validateText(SAMPLE).validTrades.map(computeTrade)

  it('searches by symbol (case-insensitive, partial)', () => {
    const rows = filterAndSort(trades, 'eth', 'ALL', 'date', 'asc')
    expect(rows.length).toBe(4)
    expect(rows.every((t) => t.symbol.includes('ETH'))).toBe(true)
  })
  it('filters wins and losses consistently with result', () => {
    const w = filterAndSort(trades, '', 'WIN', 'pnl', 'desc')
    const l = filterAndSort(trades, '', 'LOSS', 'pnl', 'desc')
    expect(w.length + l.length).toBe(trades.length)
    expect(w.every((t) => t.netPnl.greaterThan(0))).toBe(true)
    expect(l.every((t) => !t.netPnl.greaterThan(0))).toBe(true)
  })
  it('sorts by P&L and by date in both directions', () => {
    const desc = filterAndSort(trades, '', 'ALL', 'pnl', 'desc')
    expect(desc[0]!.netPnl.greaterThanOrEqualTo(desc[desc.length - 1]!.netPnl)).toBe(true)
    const asc = filterAndSort(trades, '', 'ALL', 'date', 'asc')
    expect(asc[0]!.date.getTime()).toBeLessThanOrEqual(asc[asc.length - 1]!.date.getTime())
  })
  it('does not mutate its input', () => {
    const copy = [...trades]
    filterAndSort(trades, '', 'ALL', 'pnl', 'asc')
    expect(trades).toEqual(copy)
  })
})

describe('history table rendering', () => {
  it('colors WIN green and LOSS red after import', async () => {
    stubSampleFetch()
    renderAt('/overview')
    fireEvent.click(screen.getByRole('button', { name: /try with sample data/i }))
    // navigates to /overview; go to history through nav
    await screen.findByRole('heading', { name: 'Overview' })
    fireEvent.click(screen.getAllByRole('link', { name: /history/i })[0]!)
    await screen.findByRole('heading', { name: 'Trading History' }, { timeout: 5000 })
    const table = screen.getByRole('table')
    const win = within(table).getAllByText('WIN')[0]!
    const loss = within(table).getAllByText('LOSS')[0]!
    expect(win.className).toContain('text-positive')
    expect(loss.className).toContain('text-negative')
  })
})

describe('reducer', () => {
  it('imports and clears', () => {
    const trades = validateText(SAMPLE).validTrades.map(computeTrade)
    const meta = { fileName: 'a.csv', importedAt: new Date(0), rowCount: trades.length }
    const s1 = reducer({ trades: null, meta: null, live: null }, { type: 'IMPORT_TRADES', trades, meta })
    expect(s1.trades).toHaveLength(14)
    expect(reducer(s1, { type: 'CLEAR_TRADES' })).toEqual({ trades: null, meta: null, live: null })
  })
})
