# TradeGhost — Coding Standards

## TypeScript
- `strict` mode on; `noImplicitAny`, `noUncheckedIndexedAccess` enabled where feasible
- No `any`; use `unknown` + narrow, or explicit types
- Prefer named exports; one primary responsibility per file
- Domain types live in `src/types`; finance types in `src/lib/finance`

## Naming & structure
- Files: `kebab-case` for non-component modules (`pnl.ts`); `PascalCase` for components (`MetricCard.tsx`)
- Functions/variables: `camelCase`; types/interfaces: `PascalCase`; constants: `UPPER_SNAKE`
- Co-locate tests next to source or under `tests/` mirroring the `src/` structure

## Financial code (critical)
- Never use native `Number` for P&L arithmetic. Import `Decimal` from `src/lib/finance/decimal` (preconfigured).
- Never round intermediate values. Round only in `lib/format` at display/chart boundaries.
- All finance functions must be pure and deterministic (no `Date.now`, no `Math.random`).
- Sorts must tie-break deterministically (by date, then by stable input index).

## Error handling
- Validation returns structured results, never throws on bad user data.
- Distinguish **errors** (blocking) vs **warnings** (non-blocking) vs **skipped rows**.
- Use typed result objects, not `try/catch`, for control flow in the `finance`/`csv` layers.

## Style
- Prettier + ESLint configured. Import order: external → `lib` → `features` → `components` → relative.
- Prefer early returns; small focused functions; no commented-out dead code.
- Keep components presentational where possible; push logic into hooks/selectors.
