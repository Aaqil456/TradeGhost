/**
 * Public Hyperliquid wallets (from the public leaderboard) for trying the app.
 * They belong to other traders; their data changes as they trade. Trade counts are approximate.
 */
export interface SampleWallet {
  address: string
  label: string
  note: string
}

export const SAMPLE_WALLETS: SampleWallet[] = [
  {
    address: '0xd0f9337179d095d744be87b33d569e5c1aa8ce0b',
    label: 'Active trader (recommended)',
    note: 'About 275 completed trades. Enough data to unlock Forecast and Suggestions. Loads in a few seconds.',
  },
  {
    address: '0x396dc3e4d1051837bb559810d2b1ea7977775899',
    label: 'High-volume trader',
    note: 'About 258 completed trades from 44,000+ fills. Takes longer to load (up to ~30 seconds).',
  },
  {
    address: '0xf84d8d3863043d578b17c1f76dded6655d1f05fc',
    label: 'Small wallet',
    note: 'Just 1 completed trade. Good for seeing the empty-data and "not enough data" messages.',
  },
]
