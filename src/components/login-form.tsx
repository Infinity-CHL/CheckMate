import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { supabase } from '@/shared/api/supabase'

const getLoginErrorMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Неверная почта или пароль'
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Подтвердите почту перед входом'
  }

  return 'Не удалось войти. Проверьте данные и попробуйте ещё раз'
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      navigate('/')
    } catch (error: unknown) {
      console.error('Login error:', error)
      setError(
        error instanceof Error
          ? getLoginErrorMessage(error.message)
          : 'Не удалось войти. Попробуйте ещё раз'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <Card className="bg-white/80">
        <CardHeader className="gap-1 pb-2 text-center">
          <CardTitle className="text-xl">Войти</CardTitle>
          <CardDescription>Введите почту и пароль официанта</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Почта</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="h-10 w-full" disabled={isLoading}>
                {isLoading ? 'Входим...' : 'Войти'}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
                Зарегистрироваться
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
