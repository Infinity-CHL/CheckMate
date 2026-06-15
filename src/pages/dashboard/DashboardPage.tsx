import { PageHeader } from '@/components/PageHeader'
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
  <Card className="bg-white/80">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
)

export const DashboardPage = () => {
  const { stats, loading, error } = useDashboardStats()

  if (loading) {
    return <AppLoader />
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <PageHeader title="Аналитика" />

      {error && (
        <div className="mb-4 text-sm text-red-500">
          Ошибка: {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Выручка за сегодня"
          value={formatCurrency(stats.todayRevenue)}
        />
        <StatCard
          title="Закрытых заказов сегодня"
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
