# TradeGhost

A browser-based cryptocurrency trading performance analyzer. Upload a CSV of your completed trades and get accurate performance metrics, charts, per-pair breakdowns, behavior insights, and a searchable trade history.

All processing happens **locally in your browser**. No trade data is ever uploaded to a server or persisted — it lives only for your session and is cleared when you close or refresh the page.

> TradeGhost provides historical performance analysis and educational insights, **not** financial or investment advice.

Built for the **Kiroween 2026 Hackathon** — Frankenstein category (CSV processing + financial analytics + data visualization).

## Features

- **Live wallet connect** — paste a Hyperliquid wallet address (no API key); trades load and refresh every minute.
- **Forecast** — Monte Carlo projection of your own performance from your past trades (not a price prediction).
- **Suggestions** — data-grounded hints with evidence, from your history only.
- **CSV upload** with drag-and-drop, validation, preview, and a downloadable sample template.
- **Performance dashboard** — net P&L, win rate, averages, best/worst trade, cumulative realized P&L chart, and per-pair breakdown.
- **Trading analytics** — most/least profitable pairs, largest win/loss, and behavior insights derived only from your data.
- **Trading history table** — searchable, filterable, sortable, with green/red WIN/LOSS coding.
- **Accurate calculations** using `decimal.js` (no floating-point drift).

## Tech stack

- React 19 + TypeScript, Vite 8
- Tailwind CSS v4 (dark theme)
- Recharts 3 (charts)
- PapaParse 5 (CSV parsing)
- decimal.js 10 (financial math)
- React Router 7
- Vitest 5 + fast-check 4 (tests)

## Requirements

- **Node.js 22 LTS** (Vite 8 and Vitest 5 require Node ≥ 22.12)

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
```

## Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start the Vite dev server                |
| `npm run build`    | Typecheck + production build to `dist/`  |
| `npm run preview`  | Preview the production build locally     |
| `npm test`         | Run the test suite once (Vitest)         |
| `npm run test:watch` | Run tests in watch mode                 |
| `npm run format`   | Format the codebase with Prettier        |

## CSV format

Required columns (one completed trade per row):

```
date,symbol,side,entry_price,exit_price,quantity,fees
```

- `date` — parseable date (ISO `YYYY-MM-DD` preferred)
- `symbol` — trading pair, e.g. `BTCUSDT`
- `side` — `LONG` or `SHORT`
- `entry_price`, `exit_price` — decimal numbers
- `quantity` — decimal, must be `> 0`
- `fees` — decimal `>= 0` (blank values require explicit confirmation during import)

A sample template is available in the app and at `public/sample-trade-history.csv`.

## Project structure

See `.kiro/steering/architecture.md` for the full module layout. Key areas:

- `src/lib/finance` — pure calculation engine (decimal.js)
- `src/lib/csv` — parsing + validation
- `src/lib/format` — display formatting (the only Number boundary)
- `src/store` — session-only app state
- `src/features` — import, dashboard, analytics, history
- `src/components` — layout, ui, charts

## Deployment (Cloudflare Pages)

1. `npm run build` produces a static site in `dist/`.
2. Deploy `dist/` to Cloudflare Pages.
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. `public/_redirects` (`/* /index.html 200`) provides SPA fallback and is copied into `dist/` by Vite.

## Privacy

- All CSV processing and calculations run in the browser.
- No `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or server storage is used for trade data.
- No exchange API keys are requested or accepted. Live mode uses only a public wallet address, sent from your browser straight to Hyperliquid's public API. It is not stored.
- No external analytics or tracking calls are made.

## License

[MIT](./LICENSE)
