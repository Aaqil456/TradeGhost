# TradeGhost — Data Validation Steering

## Standardized CSV format
Required columns: `date, symbol, side, entry_price, exit_price, quantity, fees`.
Each row represents one completed trade. A header row is required on the first line.

## Validation rules (collect ALL errors, do not fail fast)
- Header present and matches the schema (case-insensitive, trimmed). Extra columns are ignored with a warning.
- `date` — parseable (ISO preferred; accept common formats, normalized to a `Date`).
- `symbol` — non-empty string.
- `side` — `∈ {LONG, SHORT}` (case-insensitive).
- `entry_price`, `exit_price` — valid decimals.
- `quantity` — valid decimal `> 0`.
- `fees` — valid decimal `≥ 0`, **or blank** (→ missing-fees confirm flow).
- Empty file / header-only → friendly error with zero rows.

## Robustness
- Handle BOM, alternate delimiters (PapaParse auto-detect), trailing whitespace, and CRLF.
- Each row reports its own error/warning with row number + reason.

## Output
`ParseResult { validTrades, errors[], warnings[], skippedRows[] }` → preview table → user confirms → `Trade[]`.

## Sample template
`public/sample-trade-history.csv`: clearly labeled SAMPLE, mixed LONG/SHORT, multiple symbols, wins/losses, varied fees. Also reused as a test fixture.
