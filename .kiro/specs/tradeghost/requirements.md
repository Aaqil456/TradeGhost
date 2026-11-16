# TradeGhost — Requirements

## 1. Overview
TradeGhost is a browser-based cryptocurrency trading performance analyzer. A user uploads a standardized CSV of completed trades; the app parses, validates, and transforms that history into accurate performance metrics, charts, per-pair breakdowns, behavior insights, and a searchable trade history. All processing is local to the browser and session-only.

## 2. Users
Beginner to intermediate crypto traders, active traders reviewing performance, and traders who want to understand their mistakes and losing patterns. The app must be usable without technical knowledge.

## 3. Functional requirements

### Feature A — CSV Upload
- **A1** Provide a downloadable sample CSV template (`public/sample-trade-history.csv`) with the required columns and clearly-labeled SAMPLE rows.
- **A2** Support drag-and-drop and click-to-select CSV uploading.
- **A3** Validate uploaded files against the standardized schema and collect all errors (do not fail fast).
- **A4** Display clear error messages with row numbers and reasons.
- **A5** Preview imported trades (including computed net P&L and WIN/LOSS) before finalizing.
- **A6** When a row has blank `fees`, do not silently zero it; ask the user to explicitly confirm "treat missing fees as 0".
- **A7** Allow the user to remove an imported dataset and upload another.
- **A8** Use the standardized CSV format with required columns: `date, symbol, side, entry_price, exit_price, quantity, fees`.

**Acceptance criteria (A):**
- Drag-and-drop and click-to-select both work.
- A malformed/empty/wrong-schema file produces a readable, row-specific error report and no crash.
- After confirming, valid trades load into the dashboard.
- The sample template downloads successfully and parses cleanly when re-uploaded.
- Removing a dataset clears all derived views back to the empty state.

### Feature B — Trading Performance Dashboard
- **B1** Metric cards: total net P&L, total trades, winning trades, losing trades, win rate %, average winning trade, average losing trade, best trade, worst trade.
- **B2** A cumulative realized P&L chart over time.
- **B3** A per-cryptocurrency-pair performance breakdown.

**Acceptance criteria (B):**
- All metrics are computed from imported data (never hardcoded).
- Win rate is a percentage in [0, 100].
- The cumulative chart is ordered chronologically and its final point equals the sum of all net P&L.
- The pair breakdown lists each symbol with its net P&L, counts, and win rate.
- With zero trades, the dashboard shows an empty state with an Import CTA.

### Feature C — Trading Analytics
- **C1** Most profitable trading pair.
- **C2** Least profitable trading pair.
- **C3** Pair with the highest number of losses.
- **C4** Average profit per trade; average loss per trade.
- **C5** Overall profitability.
- **C6** Largest winning and losing trades.
- **C7** Behavior insights derived only from the uploaded data, each gated by a minimum sample threshold so no unsupported claims are shown.

**Acceptance criteria (C):**
- Every insight references actual data (a pair, counts, or shares).
- No insight is shown when the data is too thin to support it.
- Analytics never produce financial/investment advice.

### Feature D — Trading History Table
- **D1** Columns: Date, Symbol, Side, Entry price, Exit price, Quantity, Fees, Net P&L, Result (WIN/LOSS).
- **D2** Search by cryptocurrency symbol.
- **D3** Filter by winning or losing trades.
- **D4** Sort by date and by net P&L.
- **D5** Green for profitable trades, red for losing trades.

**Acceptance criteria (D):**
- Search filters rows by symbol substring (case-insensitive).
- Filters and sorts compose correctly.
- Row colors reflect WIN/LOSS consistently with the rest of the app.

## 4. Financial calculation requirements
- LONG gross = (exit − entry) × qty; SHORT gross = (entry − exit) × qty; net = gross − fees.
- All arithmetic via `decimal.js` (no native `Number` for P&L).
- Win rate = winners / total × 100.
- Average win = Σ positive net / winners; average loss = Σ negative net / losers.
- Cumulative realized P&L computed chronologically.
- Realized P&L drawdown = cumulative − running max (always ≤ 0), labeled as such.
- Handle zero trades, missing values, and invalid numbers without silent failures or NaN.
- Missing fees are zeroed only after explicit user confirmation.

## 5. Non-functional requirements
- **NFR-1 Accuracy:** Deterministic calculations; same input → same output. No `Math.random`/`Date.now` in finance layer.
- **NFR-2 Privacy:** All processing in-browser; no persistence; no external data transmission; no API keys.
- **NFR-3 Design:** Dark-mode-first, professional SaaS look, green/red semantics, tabular figures, responsive.
- **NFR-4 Performance:** Client-side only; use PapaParse worker for large files; cap preview rows.
- **NFR-5 Accessibility:** Visible focus, keyboard-operable controls, sufficient contrast.
- **NFR-6 Testing:** Unit, property-based, CSV validation, and component tests must pass.
- **NFR-7 Compliance:** MIT license; `.kiro/` tracked in Git; README with setup + deploy instructions; deployable to a public URL via Cloudflare Pages.
- **NFR-8 Disclaimers:** Historical analysis/educational insights, not financial advice; data handled locally.

## 5b. Extension requirements (v0.2)
- **FR-L1 Live wallet connect:** user pastes a Hyperliquid wallet address (no API key); trades load and auto-refresh every 60 s. Acceptance: invalid address rejected before any request; fills paginated and de-duplicated; failures keep last good data and show an error.
- **FR-L2 Fills to trades:** fills are grouped into position cycles (flat to flat); entry/exit are quantity-weighted averages; all fees of the cycle are charged to the trade; flips split fees proportionally; open positions are excluded and reported. Acceptance: derived gross P&L and fees reconcile with the exchange's own closedPnl/fee totals on a real-wallet fixture.
- **FR-F1 Forecast:** bootstrap Monte Carlo projection of the user's own net P&L per trade (median, 5-95% range, probability of profit, expectancy). Requires >= 30 trades; deterministic seed. Not a price prediction.
- **FR-S1 Suggestions:** data-grounded suggestions (direction, pair, risk/reward, fees, losing streak), each with evidence and sample-size gating, labeled as not financial advice.

## 6. Out of scope
Exchange API-key integrations, authentication, subscriptions/payments, AI features, buy/sell trading signals or price prediction, backend/database, any data persistence, multi-exchange native formats, live trading, spot-trade pairing.

## 7. Data model (summary)
- `Trade`: `{ id, date: Date, symbol: string, side: 'LONG'|'SHORT', entryPrice: Decimal, exitPrice: Decimal, quantity: Decimal, fees: Decimal }`
- `ParseResult`: `{ validTrades, errors[], warnings[], skippedRows[] }`
- `Metrics`, `PairBreakdown[]`, `CumulativePoint[]`, `Insight[]` — produced by the finance engine (defined in design.md).
