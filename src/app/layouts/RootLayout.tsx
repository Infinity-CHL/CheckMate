import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { BarChart3, ClipboardList, User, UtensilsCrossed } from 'lucide-react'
import { UserNiceAvatar } from '@/components/UserNiceAvatar'
import { useAuth } from '@/features/auth/useAuth'

export const RootLayout = () => {
  const { user, profile } = useAuth()
  const location = useLocation()
  const avatarSeed = user?.id || user?.email || profile?.full_name || 'CheckMate'
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const isAdminPage = location.pathname.startsWith('/admin')
  const showAppChrome = !isAuthPage && !isAdminPage

  return (
    <div className="flex min-h-screen flex-col">
      {showAppChrome && <header className="sticky top-0 z-40 hidden border-b border-white/60 bg-background/75 backdrop-blur-xl md:block">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            CheckMate
          </Link>

          {user && (
            <Link
              to="/menu"
              className="flex min-h-10 items-center gap-2 px-3 text-sm font-medium md:hidden"
            >
              <UtensilsCrossed className="h-4 w-4" />
              Меню
            </Link>
          )}

          <nav className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <Link to="/orders">Заказы</Link>
                <Link to="/tables">Столы</Link>
                <Link to="/dashboard">Dashboard</Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin/employees">Сотрудники</Link>
                )}
                <Link to="/menu" className="inline-flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Меню
                </Link>
                <Link to="/profile" className="inline-flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Профиль
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">Вход</Link>
                <Link to="/signup">Регистрация</Link>
              </>
            )}
          </nav>
        </div>
      </header>}

      <main className={showAppChrome ? 'flex-1 pb-24 md:pb-0' : 'flex-1'}>
        <Outlet />
      </main>

      {user && showAppChrome && (
        <nav className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-white/70 bg-background/80 px-2 py-2 shadow-lg backdrop-blur-xl md:hidden">
          <div className="grid grid-cols-4 gap-1">
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`
              }
            >
              <ClipboardList className="h-5 w-5" />
              <span>Заказы</span>
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`
              }
            >
              <BarChart3 className="h-5 w-5" />
              <span>Аналитика</span>
            </NavLink>
            <NavLink
              to="/menu"
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`
              }
            >
              <UtensilsCrossed className="h-5 w-5" />
              <span>Меню</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-0 text-xs font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary [&_.profile-avatar]:ring-2 [&_.profile-avatar]:ring-primary [&_.profile-avatar]:ring-offset-2 [&_.profile-avatar]:ring-offset-background' : 'text-muted-foreground'}`
              }
              aria-label="Профиль"
            >
              <span className="profile-avatar flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-border">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Профиль"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserNiceAvatar seed={avatarSeed} size={36} />
                )}
              </span>
            </NavLink>
          </div>
        </nav>
      )}

      {showAppChrome && <footer className="hidden border-t py-4 text-center text-sm text-muted-foreground md:block">
        <div className="container mx-auto">
          CheckMate © {new Date().getFullYear()}
        </div>
      </footer>}
    </div>
  )
}
