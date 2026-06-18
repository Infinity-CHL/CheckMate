import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  BadgeRussianRuble,
  Clock3,
  Percent,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { AppLoader } from '@/components/AppLoader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DashboardPeriod } from '@/features/dashboard/api/dashboardApi'
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats'
import { useAuth } from '@/features/auth/useAuth'

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

type IconTone = 'green' | 'amber' | 'purple' | 'blue'

const iconStyles: Record<IconTone, CSSProperties> = {
  green: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  amber: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  purple: {
    backgroundColor: '#F3E8FF',
    color: '#7E22CE',
  },
  blue: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
}

const glassPanelStyle: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.7)',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
}

const totalPanelStyle: CSSProperties = {
  ...glassPanelStyle,
  backgroundColor: 'rgb(15, 23, 42)',
  color: '#F9FAFB',
  gridColumn: '1 / -1',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
}

type MetricCardProps = {
  title: string
  value: string
  caption: string
  icon: LucideIcon
  iconTone: IconTone
}

const MetricCard = ({
  title,
  value,
  caption,
  icon: Icon,
  iconTone,
}: MetricCardProps) => (
  <div
    className="min-h-[150px] min-w-0 rounded-3xl p-4 ring-1 ring-foreground/5"
    style={glassPanelStyle}
  >
    <div className="flex h-full min-w-0 flex-col justify-between gap-2">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={iconStyles[iconTone]}
      >
        <Icon className="h-5 w-5 shrink-0" />
      </div>

      <div className="min-w-0">
        <div className="text-xs font-medium leading-snug text-muted-foreground">
          {title}
        </div>
        <div className="mt-1 break-words text-xl font-semibold leading-tight tracking-tight">
          {value}
        </div>
      </div>

      <div className="text-[11px] leading-snug text-muted-foreground">
        {caption}
      </div>
    </div>
  </div>
)

type TotalCardProps = {
  title: string
  value: string
  grade: string
}

const TotalCard = ({ title, value, grade }: TotalCardProps) => (
  <div
    className="col-span-2 min-w-0 rounded-3xl p-8 ring-1 ring-foreground/5"
    style={totalPanelStyle}
  >
    <div className="flex min-w-0 items-center gap-4">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: 'rgba(251,191,36,.2)',
          color: '#FCD34D',
        }}
      >
        <BadgeRussianRuble className="h-7 w-7 shrink-0" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-white/70">{title}</div>

        <div className="mt-1 break-words text-4xl font-bold leading-none tracking-tight text-white">
          {value}
        </div>

        <div className="mt-2 text-sm font-medium text-white/70">{grade}</div>
      </div>
    </div>
  </div>
)

const periodLabels: Record<DashboardPeriod, string> = {
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
}

const periodTitleLabels: Record<DashboardPeriod, string> = {
  today: 'сегодня',
  week: 'неделю',
  month: 'месяц',
}

const defaultHoursByPeriod: Record<DashboardPeriod, number> = {
  today: 8,
  week: 40,
  month: 160,
}

const gradeLabels: Record<string, string> = {
  intern: 'Стажёр',
  assistant: 'Помощник',
  junior: 'Новичок',
  professional: 'Профессионал',
  expert_mentor: 'Эксперт-наставник',
}

const getSalaryConfig = (
  grade: string | null | undefined,
  period: DashboardPeriod,
  revenue: number
) => {
  switch (grade) {
    case 'intern':
      return { hourlyRate: 100, commissionPercent: 0 }
    case 'assistant':
      return { hourlyRate: 150, commissionPercent: 0 }
    case 'junior':
      return { hourlyRate: 100, commissionPercent: 0.01 }
    case 'professional':
      return {
        hourlyRate: 100,
        commissionPercent: period === 'today' && revenue > 90000 ? 0.03 : 0.025,
      }
    case 'expert_mentor':
      return { hourlyRate: 75, commissionPercent: 0.035 }
    default:
      return { hourlyRate: 0, commissionPercent: 0 }
  }
}

export const DashboardPage = () => {
  const { profile } = useAuth()
  const [period, setPeriod] = useState<DashboardPeriod>('today')
  const [hours, setHours] = useState(defaultHoursByPeriod.today)
  const { stats, loading, error } = useDashboardStats(period)
  const periodTitle = periodTitleLabels[period]
  const gradeLabel = gradeLabels[String(profile?.grade)] || 'Грейд не указан'

  useEffect(() => {
    setHours(defaultHoursByPeriod[period])
  }, [period])

  const salary = useMemo(() => {
    const { hourlyRate, commissionPercent } = getSalaryConfig(
      profile?.grade,
      period,
      stats.periodRevenue
    )
    const normalizedHours = Math.max(Number(hours) || 0, 0)
    const hourlyIncome = hourlyRate * normalizedHours
    const salesIncome = stats.periodRevenue * commissionPercent

    return {
      hourlyRate,
      commissionPercent,
      hourlyIncome,
      salesIncome,
      totalIncome: hourlyIncome + salesIncome + stats.periodTips,
    }
  }, [hours, period, profile?.grade, stats.periodRevenue, stats.periodTips])

  if (loading) {
    return <AppLoader />
  }

  return (
    <div className="container mx-auto max-w-3xl p-3 pb-28 md:p-6 md:pb-6">
      <div
        className="mb-3 rounded-3xl p-3 ring-1 ring-foreground/5"
        style={glassPanelStyle}
      >
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-1">
          {Object.entries(periodLabels).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={period === value ? 'default' : 'ghost'}
              className="h-9 rounded-xl px-2 text-xs shadow-none"
              onClick={() => setPeriod(value as DashboardPeriod)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="mt-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Отработано часов
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <Input
              type="number"
              min={0}
              step={0.5}
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
              className="h-10 rounded-2xl text-sm"
            />
            <div className="rounded-2xl bg-background/70 px-3 py-2 text-[11px] leading-tight text-muted-foreground">
              Рекомендуем: {defaultHoursByPeriod[period]} ч
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          Ошибка: {error}
        </div>
      )}

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
      >
        <MetricCard
          title="Выручка"
          value={formatCurrency(stats.periodRevenue)}
          caption={`За ${periodTitle}`}
          icon={TrendingUp}
          iconTone="green"
        />
        <MetricCard
          title="Чаевые"
          value={formatCurrency(stats.periodTips)}
          caption={`За ${periodTitle}`}
          icon={Wallet}
          iconTone="amber"
        />
        <MetricCard
          title="Доход"
          value={formatCurrency(salary.salesIncome)}
          caption={`${(salary.commissionPercent * 100).toLocaleString('ru-RU')}% от продаж`}
          icon={Percent}
          iconTone="purple"
        />
        <MetricCard
          title="Почасовая ставка"
          value={`${formatNumber(salary.hourlyRate)} ₽/час`}
          caption={`${formatNumber(hours)} ч = ${formatCurrency(salary.hourlyIncome)}`}
          icon={Clock3}
          iconTone="blue"
        />
        <TotalCard
          title={`Итог за ${periodTitle}`}
          value={formatCurrency(salary.totalIncome)}
          grade={gradeLabel}
        />
      </div>
    </div>
  )
}
