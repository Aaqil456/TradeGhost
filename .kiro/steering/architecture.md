# TradeGhost — Architecture Steering

## Stack (versions verified Nov 2026)
- React 19 + TypeScript (strict), Vite 8
- Tailwind CSS v4 — CSS-first config via `@tailwindcss/vite`, theme tokens in `src/index.css` `@theme` (no `tailwind.config.js`)
- Recharts 3 (SVG charts)
- PapaParse 5 (client-side CSV parsing)
- decimal.js 10 (all financial math)
- React Router 7 (routing)
- Vitest 5 + fast-check 4 + @testing-library/react (tests)
- **Node 22 LTS required** (Vite 8 and Vitest 5 minimums)

## Architecture principles
- **Pure calculation layer:** `src/lib/finance/*` is framework-free, takes `Trade[]`, returns plain objects. This is the unit + property-test target.
- **Decimal at the core, Number at the edge:** all P&L math in `Decimal`; convert to JS `Number` only at chart/display boundaries, after rounding to display precision.
- **Validation collects, never fails fast:** produce a full error report per import rather than stopping at the first bad row.
- **No persistence anywhere:** state lives in a React context and resets on reload.
- **Modular for future extension:** a backend/subscription system could later replace the in-memory store without touching the `finance` / `csv` / UI layers.

## Data flow
```
CSV file → PapaParse (header:true, dynamicTyping:false, keep strings)
        → validation layer (collect-all)
        → (missing-fees confirm)
        → Trade[]  (Decimal-based)
        → finance engine (pure functions)
        → selectors → views
```

## Module responsibilities
- `src/lib/csv` — parsing, schema, validation, sample template
- `src/lib/finance` — decimal config, types, pnl, metrics, pairs, cumulative, drawdown, insights
- `src/lib/format` — currency / number / date formatting (Decimal → display string)
- `src/store` — AppContext + reducer + selectors (session-only)
- `src/features` — import, dashboard, analytics, history
- `src/components` — layout, ui, charts
- `src/routes` — Overview, Analytics, History, Import, Settings

## State & routing
- Context + `useReducer` holding `{ trades, meta }`. Derived metrics via memoized pure selectors from `lib/finance`.
- React Router 7 layout route → `/overview`, `/analytics`, `/history`, `/import`, `/settings`. Empty state shown until data is loaded.

## Deployment
Static `vite build` → **Cloudflare Pages**. Build command `npm run build`, output directory `dist`. SPA fallback handled via `public/_redirects` (`/* /index.html 200`), which Vite copies into `dist/`. `.kiro/` is tracked by Git and must never be added to `.gitignore`.
