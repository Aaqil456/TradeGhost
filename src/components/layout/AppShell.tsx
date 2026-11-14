import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { GhostMark } from '../ui/primitives'

const icon = (d: string): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
    <path d={d} />
  </svg>
)

const NAV = [
  { to: '/overview', label: 'Overview', icon: icon('M3 12l9-9 9 9M5 10v10h14V10') },
  { to: '/analytics', label: 'Analytics', icon: icon('M4 20V10M10 20V4M16 20v-7M22 20H2') },
  { to: '/history', label: 'History', icon: icon('M4 6h16M4 12h16M4 18h10') },
  { to: '/import', label: 'Import', icon: icon('M12 3v12m0 0l-4-4m4 4l4-4M4 21h16') },
  { to: '/settings', label: 'Settings', icon: icon('M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 00-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2l.4 2.6h4l.4-2.6c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z') },
]

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'

export function AppShell() {
  const { meta } = useApp()
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-panel p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <GhostMark className="h-7 w-7 text-accent" />
          <span className="text-lg font-semibold tracking-tight">
            Trade<span className="text-accent">Ghost</span>
          </span>
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-panel-2 hover:text-ink'}`
              }
            >
              {n.icon}
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-line bg-base/50 p-3 text-xs text-muted">
          <div className="mb-1 font-medium text-ink">{meta ? meta.fileName : 'No data loaded'}</div>
          {meta ? `${meta.rowCount} trades · local only` : 'Your data never leaves your browser.'}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 md:pb-0">
        <header className="flex items-center gap-2 border-b border-line bg-panel px-4 py-3 md:hidden">
          <GhostMark className="h-6 w-6 text-accent" />
          <span className="font-semibold tracking-tight">
            Trade<span className="text-accent">Ghost</span>
          </span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-panel md:hidden"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`
            }
          >
            {n.icon}
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
