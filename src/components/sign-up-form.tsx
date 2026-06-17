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

const getSignUpErrorMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('already registered') ||
    normalizedMessage.includes('already exists') ||
    normalizedMessage.includes('user already')
  ) {
    return 'Аккаунт с такой почтой уже существует'
  }

  if (normalizedMessage.includes('invalid email')) {
    return 'Введите корректную почту'
  }

  if (normalizedMessage.includes('password')) {
    return 'Пароль должен быть не короче 6 символов'
  }

  return 'Не удалось зарегистрироваться. Попробуйте ещё раз'
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user?.identities?.length === 0) {
        setError('Аккаунт с такой почтой уже существует')
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (error: unknown) {
      console.error('Signup error:', error)
      setError(
        error instanceof Error
          ? getSignUpErrorMessage(error.message)
          : 'Не удалось зарегистрироваться. Попробуйте ещё раз'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      {success ? (
        <Card className="bg-white/80">
          <CardHeader className="gap-1 pb-2 text-center">
            <CardTitle className="text-xl">Проверьте почту</CardTitle>
            <CardDescription>Мы отправили письмо для подтверждения</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Подтвердите аккаунт по ссылке из письма, затем войдите в CheckMate.
            </p>
            <Button onClick={() => navigate('/login')} className="h-10 w-full">
              Войти
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80">
          <CardHeader className="gap-1 pb-2 text-center">
            <CardTitle className="text-xl">Регистрация</CardTitle>
            <CardDescription>Создайте аккаунт сотрудника</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Минимум 6 символов
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Повторите пароль</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={repeatPassword}
                    onChange={(event) => setRepeatPassword(event.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button type="submit" className="h-10 w-full" disabled={isLoading}>
                  {isLoading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
                  Войти
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
