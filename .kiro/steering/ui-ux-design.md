# TradeGhost — UI/UX Design Steering

## Direction
Professional crypto analytics SaaS, dark mode by default. Not a generic admin dashboard. Clean, calm, data-forward, minimal decoration. The first screen communicates the app's value immediately.

## Color tokens (Tailwind v4 `@theme`, defined once in `src/index.css`)
- Background base: deep charcoal (~`#0a0e17`), panels slightly raised, subtle borders.
- **Positive (profit): green. Negative (loss): red.** Applied consistently across metric cards, table rows, and charts.
- Brand accent: a "ghost" teal/green for interactive/brand elements.
- Tokens defined as CSS variables so charts (Recharts) and components share the same palette.

## Typography
- Inter (system fallback). **Tabular/monospace figures for all numeric values** so columns align.

## Layout & components
- `AppShell`: sidebar nav on desktop; collapses to a compact nav on mobile.
- Reusable primitives: `Card`, `MetricCard`, `Button`, `Badge` (WIN/LOSS), `Table`, `FileDropzone`, `EmptyState`, `SearchInput`, `Spinner`, themed `ChartCard`.
- `MetricCard`: large figure, label, semantic color, subtle accent — no decorative clutter.

## Motion
- Subtle only: Tailwind transitions + a few CSS keyframes (fade-in, count-up). No heavy animation library in the MVP.

## Responsive
- Desktop-first but must work on mobile. Verify key views (Overview, History, Import) at common breakpoints.

## Accessibility
- Sufficient contrast in the dark theme; visible focus states; keyboard-operable table and dropzone; aria labels on icon-only controls.

## Hard rule
- Never render hardcoded or fake numbers in the app UI. Show an empty state with an Import CTA until real data is imported.
