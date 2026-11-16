import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/App'
import { isValidAddress } from '../../src/lib/sources/hyperliquid'
import { SAMPLE_WALLETS } from '../../src/lib/sources/samples'
import { AppProvider } from '../../src/store/AppContext'

afterEach(() => cleanup())

function renderGuide() {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/guide']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  )
}

describe('How to use page', () => {
  it('shows the steps and every sample wallet address', () => {
    renderGuide()
    expect(screen.getByRole('heading', { name: /how to use tradeghost/i })).toBeInTheDocument()
    expect(screen.getByText('Paste a wallet address')).toBeInTheDocument()
    for (const w of SAMPLE_WALLETS) expect(screen.getByText(w.address)).toBeInTheDocument()
  })

  it('only lists valid wallet addresses', () => {
    for (const w of SAMPLE_WALLETS) expect(isValidAddress(w.address)).toBe(true)
  })

  it('copies an address to the clipboard', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderGuide()
    fireEvent.click(screen.getAllByRole('button', { name: /copy address/i })[0]!)
    expect(writeText).toHaveBeenCalledWith(SAMPLE_WALLETS[0]!.address)
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('is reachable from the navigation', () => {
    renderGuide()
    expect(screen.getAllByRole('link', { name: /how to use/i }).length).toBeGreaterThan(0)
  })
})
