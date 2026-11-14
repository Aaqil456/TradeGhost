export const REQUIRED_COLUMNS = [
  'date',
  'symbol',
  'side',
  'entry_price',
  'exit_price',
  'quantity',
  'fees',
] as const

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number]

export const TEMPLATE_FILE_NAME = 'tradeghost-sample-trades.csv'
