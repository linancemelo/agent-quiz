import { Link, NavLink, Outlet } from 'react-router-dom'
import { Map, BarChart3, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: '學習地圖', icon: Map },
  { to: '/progress', label: '進度／錯題', icon: BarChart3 },
]

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl no-print">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-lg shadow-lg shadow-violet-500/30 animate-float">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <span className="hidden sm:inline">
              Agent 速成班
              <span className="ml-1 text-xs font-normal text-fuchsia-300">互動測驗</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-violet-500/20 text-violet-200'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="no-print border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        題庫來源：Agent 速成班筆記 · 純前端判題 · 進度存在你的瀏覽器 · v1.5.0-prototype ✨
      </footer>
    </div>
  )
}
