import { BarChart3, LogOut, Users } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/useAuth'
import { EmployeesSkeleton } from '@/shared/ui/skeletons'

const navItems = [
  {
    to: '/admin/employees',
    label: 'Сотрудники',
    icon: Users,
  },
  {
    to: '/admin/analytics',
    label: 'Аналитика',
    icon: BarChart3,
  },
]

export const AdminLayout = () => {
  const { profile, isLoading } = useAuth()
  const isAdmin = profile?.role === 'admin'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <EmployeesSkeleton />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
        <Card className="w-full max-w-xl bg-white/85 shadow-md backdrop-blur">
          <CardHeader>
            <CardTitle>Нет доступа</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Админ-раздел доступен только администраторам.
            </p>
            <Button asChild variant="secondary" className="mt-5 h-11 rounded-2xl">
              <Link to="/orders">Вернуться в приложение</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <div className="grid min-h-screen md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/70 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-xl md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r md:px-5 md:py-6">
          <div className="flex items-center justify-between gap-3 md:block">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                CheckMate Admin
              </div>
              <div className="text-xs text-muted-foreground">
                Управление рестораном
              </div>
            </div>
            <Button asChild variant="secondary" size="sm" className="rounded-xl md:hidden">
              <Link to="/orders">В приложение</Link>
            </Button>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto md:mt-8 md:grid md:overflow-visible">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex h-11 shrink-0 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 hidden md:block">
            <Button asChild variant="outline" className="h-11 w-full rounded-2xl">
              <Link to="/orders">
                <LogOut className="h-4 w-4" />
                В приложение
              </Link>
            </Button>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
