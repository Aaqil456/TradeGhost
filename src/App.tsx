function GhostMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 11a7 7 0 0 1 14 0v9l-2.5-1.5L14 20l-2.5-1.5L9 20l-2.5-1.5L5 20v-9z"
        fill="currentColor"
        opacity={0.18}
      />
      <path
        d="M5 11a7 7 0 0 1 14 0v9l-2.5-1.5L14 20l-2.5-1.5L9 20l-2.5-1.5L5 20v-9z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="11" r="1.4" fill="currentColor" />
      <circle cx="14.5" cy="11" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function App() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex items-center gap-3">
        <GhostMark className="h-10 w-10 text-accent" />
        <span className="text-2xl font-semibold tracking-tight">
          Trade<span className="text-accent">Ghost</span>
        </span>
      </div>
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Understand your real trading performance.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Upload your completed trade history as a CSV and get accurate analytics, charts,
        and insights — all processed privately in your browser.
      </p>
      <p className="mt-8 text-sm text-muted">Scaffold ready. The full app is built in the next phases.</p>
      <p className="mt-2 max-w-md text-xs text-muted/70">
        TradeGhost provides historical performance analysis and educational insights, not financial
        or investment advice.
      </p>
    </main>
  )
}
