import { UtensilsCrossed } from 'lucide-react'

import { LoginForm } from '@/components/login-form'

export function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-md">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">CheckMate</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Быстрый вход в ресторанный POS
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
