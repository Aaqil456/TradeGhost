# TradeGhost — Product Steering

## What TradeGhost is
TradeGhost is a browser-based cryptocurrency trading performance analyzer. A user uploads a CSV of completed trades; the app parses, validates, and transforms that history into accurate performance metrics, charts, per-pair breakdowns, behavior insights, and a searchable trade history. All processing happens locally in the browser.

## Target users
- Beginner to intermediate crypto traders
- Active traders reviewing past performance
- Traders who want to understand their mistakes and losing patterns

## MVP scope (in scope)
- **Feature A — CSV upload:** drag-and-drop, validation, preview, downloadable sample template, remove/re-upload.
- **Feature B — Performance dashboard:** metric cards (net P&L, trade counts, win rate, averages, best/worst), cumulative realized P&L chart, per-pair breakdown.
- **Feature C — Trading analytics:** most/least profitable pair, highest-loss pair, averages, largest win/loss, data-gated behavior insights.
- **Feature D — Trading history table:** searchable by symbol, filterable by WIN/LOSS, sortable by date and P&L, green/red coding.
- Accurate financial calculations via `decimal.js`.
- Polished dark-mode SaaS UI, responsive desktop + mobile.
- Privacy: local-only, session-only, no persistence of any kind.

## Explicitly out of scope (do NOT build)
- Exchange API integrations or API key entry
- Authentication / user accounts
- Subscriptions / payment systems
- AI features, trading signals, recommendations, forecasts
- Any backend server, database, or cloud storage
- Any data persistence (localStorage, sessionStorage, IndexedDB, cookies for trade data)
- Support for every exchange's native export format beyond the standardized CSV
- Real-time data, live trading, or order execution

## Hard rules
- Never display hardcoded or fake analytics in the running app. Sample numbers exist only in test fixtures and the downloadable template (clearly labeled SAMPLE).
- Never sacrifice calculation accuracy for visual appearance.
- Insights must be supported by the uploaded data; never invent trading patterns or make unsupported assumptions.
- Keep the MVP focused; do not introduce features that are not in the scope above.
