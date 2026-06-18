import { useState } from 'react'

import { AppLoader } from '@/components/AppLoader'
import { DateCalendar } from '@/components/DateCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAdminDashboardStats } from '@/features/dashboard/hooks/useDashboardStats'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)

const formatNumber = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value)

const getDateInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const formatSelectedDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))

const formatSelectedWeekday = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
  }).format(new Date(`${value}T00:00:00`))

const formatMonthSummaryRange = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)

  return `${formatSelectedDate(getDateInputValue(startOfMonth))} - ${formatSelectedDate(value)}`
}

const roleLabels: Record<string, string> = {
  admin: 'Админ',
  manager: 'Менеджер',
  waiter: 'Официант',
}

const gradeLabels: Record<string, string> = {
  intern: 'Стажер',
  assistant: 'Помощник',
  junior: 'Новичок',
  professional: 'Профессионал',
  expert_mentor: 'Эксперт-наставник',
}

export const AdminAnalyticsPage = () => {
  const [selectedDate, setSelectedDate] = useState(getDateInputValue())
  const { stats, monthSummary, loading, error } = useAdminDashboardStats(selectedDate)
  const selectedDateLabel = formatSelectedDate(selectedDate)
  const selectedWeekdayLabel = formatSelectedWeekday(selectedDate)
  const monthSummaryRange = formatMonthSummaryRange(selectedDate)

  if (loading) {
    return <AppLoader />
  }

  return (
    <div className="grid gap-5">
      <header>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Аналитика
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Выручка заведения и сотрудников за выбранный день
          </p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,42rem)_minmax(18rem,1fr)] lg:items-start">
        <div className="w-full max-w-2xl">
          <DateCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            showWorkedDays={false}
            size="lg"
          />
          <div className="mt-2 text-xs">
            <div className="font-medium">{selectedDateLabel}</div>
            <div className="capitalize text-muted-foreground">
              {selectedWeekdayLabel}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="bg-white/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Итоги за день</CardTitle>
              <div className="text-xs capitalize text-muted-foreground">
                {selectedDateLabel}, {selectedWeekdayLabel}
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-2xl bg-background/70 p-3">
                <div className="text-xs text-muted-foreground">Выручка</div>
                <div className="mt-1 text-2xl font-semibold">
                  {formatCurrency(stats.totalRevenue)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Заказы</div>
                  <div className="mt-1 text-xl font-semibold">
                    {formatNumber(stats.closedOrdersCount)}
                  </div>
                </div>
                <div className="rounded-2xl bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Средний чек</div>
                  <div className="mt-1 text-xl font-semibold">
                    {formatCurrency(stats.averageCheck)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Итоги за месяц</CardTitle>
              <div className="text-xs text-muted-foreground">
                {monthSummaryRange}
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-2xl bg-background/70 p-3">
                <div className="text-xs text-muted-foreground">Выручка</div>
                <div className="mt-1 text-2xl font-semibold">
                  {formatCurrency(monthSummary.totalRevenue)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Заказы</div>
                  <div className="mt-1 text-xl font-semibold">
                    {formatNumber(monthSummary.closedOrdersCount)}
                  </div>
                </div>
                <div className="rounded-2xl bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Средний чек</div>
                  <div className="mt-1 text-xl font-semibold">
                    {formatCurrency(monthSummary.averageCheck)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Ошибка: {error}
        </div>
      )}

      <Card className="bg-white/85 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Сотрудники</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.employees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              Сотрудники не найдены
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Сотрудник</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Грейд</TableHead>
                      <TableHead>Выручка</TableHead>
                      <TableHead>Заказы</TableHead>
                      <TableHead>Средний чек</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.employees.map((employee) => (
                      <TableRow key={employee.userId}>
                        <TableCell>
                          <div className="font-medium">
                            {employee.fullName || employee.email || 'Без имени'}
                          </div>
                          {employee.fullName && employee.email && (
                            <div className="text-xs text-muted-foreground">
                              {employee.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.role ? roleLabels[employee.role] ?? employee.role : '-'}
                        </TableCell>
                        <TableCell>
                          {employee.grade ? gradeLabels[employee.grade] ?? employee.grade : '-'}
                        </TableCell>
                        <TableCell>{formatCurrency(employee.revenue)}</TableCell>
                        <TableCell>
                          {formatNumber(employee.closedOrdersCount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(employee.averageCheck)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {stats.employees.map((employee) => (
                  <div
                    key={employee.userId}
                    className="rounded-2xl border border-white/70 bg-background/70 p-3 shadow-sm"
                  >
                    <div className="font-medium">
                      {employee.fullName || employee.email || 'Без имени'}
                    </div>
                    {employee.fullName && employee.email && (
                      <div className="text-xs text-muted-foreground">
                        {employee.email}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-1">
                        {employee.role ? roleLabels[employee.role] ?? employee.role : 'Без роли'}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-1">
                        {employee.grade ? gradeLabels[employee.grade] ?? employee.grade : 'Без грейда'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Выручка</div>
                        <div className="font-medium">
                          {formatCurrency(employee.revenue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Заказы</div>
                        <div className="font-medium">
                          {formatNumber(employee.closedOrdersCount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Средний чек</div>
                        <div className="font-medium">
                          {formatCurrency(employee.averageCheck)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
