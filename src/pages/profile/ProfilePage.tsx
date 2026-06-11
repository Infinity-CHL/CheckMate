import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/features/auth/useAuth'

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  waiter: 'Официант',
}

const gradeLabels: Record<string, string> = {
  intern: 'Стажёр',
  assistant: 'Помощник официанта',
  junior: 'Новичок',
  professional: 'Профессионал',
  mentor: 'Наставник',
  expert: 'Эксперт',
}

const getLabel = (
  value: string | null | undefined,
  labels: Record<string, string>,
  fallback = 'Не указан'
) => {
  if (!value) {
    return fallback
  }

  return labels[value] ?? value
}

export const ProfilePage = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const fullName = profile?.full_name || user?.email || 'Не указан'
  const role = getLabel(profile?.role, roleLabels)
  const grade = getLabel(profile?.grade, gradeLabels)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Профиль</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Данные сотрудника текущей смены.
        </p>
      </div>

      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">Сотрудник</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              ФИО
            </p>
            <p className="text-base font-semibold">{fullName}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Позиция
              </p>
              <Badge variant="secondary">{role}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Грейд
              </p>
              <Badge variant="outline">{grade}</Badge>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full gap-2 sm:w-auto"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Выйти из аккаунта
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
