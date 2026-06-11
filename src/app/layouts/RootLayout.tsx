import { Outlet, Link, NavLink } from 'react-router-dom'
import { BarChart3, ClipboardList, LayoutGrid, User, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'

export const RootLayout = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
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
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {user && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
          <div className="grid grid-cols-4 gap-1">
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }
            >
              <ClipboardList className="h-5 w-5" />
              <span>Заказы</span>
            </NavLink>
            <NavLink
              to="/tables"
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }
            >
              <LayoutGrid className="h-5 w-5" />
              <span>Столы</span>
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }
            >
              <BarChart3 className="h-5 w-5" />
              <span>Аналитика</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`
              }
            >
              <User className="h-5 w-5" />
              <span>Профиль</span>
            </NavLink>
          </div>
        </nav>
      )}

      <footer className="hidden border-t py-4 text-center text-sm text-muted-foreground md:block">
        <div className="container mx-auto">
          CheckMate © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
