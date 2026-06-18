import { AppLoader } from '@/components/AppLoader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats'

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

type StatCardProps = {
  title: string
  value: string
}

const StatCard = ({ title, value }: StatCardProps) => (
  <Card className="bg-white/85 shadow-sm backdrop-blur">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold tracking-tight md:text-3xl">
        {value}
      </div>
    </CardContent>
  </Card>
)

export const AdminAnalyticsPage = () => {
  const { stats, loading, error } = useDashboardStats()

  if (loading) {
    return <AppLoader />
  }

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Аналитика
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Общие показатели по закрытым заказам
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Ошибка: {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Выручка сегодня"
          value={formatCurrency(stats.todayRevenue)}
        />
        <StatCard
          title="Закрытые заказы сегодня"
          value={formatNumber(stats.todayClosedOrdersCount)}
        />
        <StatCard
          title="Средний чек сегодня"
          value={formatCurrency(stats.todayAverageCheck)}
        />
        <StatCard
          title="Выручка за неделю"
          value={formatCurrency(stats.weekRevenue)}
        />
        <StatCard
          title="Выручка за месяц"
          value={formatCurrency(stats.monthRevenue)}
        />
      </div>
    </div>
  )
}
