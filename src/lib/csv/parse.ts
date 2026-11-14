import Papa from 'papaparse'

export interface RawCsv {
  headers: string[]
  /** One record per non-empty data line, keyed by normalized header. */
  rows: Record<string, string>[]
  /** Fatal, file-level problems (empty file, unreadable). */
  fatal: string | null
}

export function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

/** Parse CSV text (BOM, CRLF, delimiter auto-detect handled) into raw string rows. */
export function parseCsv(text: string): RawCsv {
  const clean = text.replace(/^\uFEFF/, '')
  if (clean.trim() === '') {
    return { headers: [], rows: [], fatal: 'The file is empty.' }
  }

  const result = Papa.parse<string[]>(clean, {
    header: false,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    delimitersToGuess: [',', ';', '\t', '|'],
  })

  const data = result.data
  if (data.length === 0) {
    return { headers: [], rows: [], fatal: 'The file is empty.' }
  }

  const headers = (data[0] ?? []).map(normalizeHeader)
  const rows = data.slice(1).map((cells) => {
    const rec: Record<string, string> = {}
    headers.forEach((h, i) => {
      if (h && !(h in rec)) rec[h] = (cells[i] ?? '').trim()
    })
    // Keep track of cells beyond the header width so validation can flag them.
    if (cells.length > headers.length) rec.__extra = String(cells.length - headers.length)
    return rec
  })

  return { headers, rows, fatal: null }
}
