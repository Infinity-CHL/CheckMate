import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/api/supabase'
import { Button } from '@/components/ui/button'

export const RootLayout = () => {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Хедер */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            CheckMate
          </Link>
          
          <nav className="flex gap-4">
            {user ? (
              <>
                <Link to="/orders">Заказы</Link>
                <Link to="/menu">Меню</Link>
                <Button variant="outline" onClick={handleLogout}>
                  Выйти
                </Button>
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

      {/* Основной контент */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Футер (опционально) */}
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          CheckMate © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}