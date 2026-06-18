import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  BadgeRussianRuble,
  Clock3,
  Percent,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { AppLoader } from '@/components/AppLoader'
import { DateCalendar } from '@/components/DateCalendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { dashboardApi, type DashboardPeriod } from '@/features/dashboard/api/dashboardApi'
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

const formatHours = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 1,
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
  date: 'Дата',
}

const periodTitleLabels: Record<DashboardPeriod, string> = {
  today: 'сегодня',
  week: 'неделю',
  month: 'месяц',
  date: 'день',
}

const defaultHoursByPeriod: Record<DashboardPeriod, number> = {
  today: 8,
  week: 40,
  month: 160,
  date: 8,
}

const getDashboardHoursKey = (
  userId: string,
  period: DashboardPeriod,
  selectedDate?: string
) =>
  period === 'date' && selectedDate
    ? `checkmate:dashboard-hours:${userId}:${selectedDate}`
    : `checkmate:dashboard-hours:${userId}:${period}`

const getLegacyDashboardDateHoursKey = (userId: string, selectedDate: string) =>
  `checkmate:dashboard-hours:${userId}:date:${selectedDate}`

const readDashboardHours = (
  userId: string,
  period: DashboardPeriod,
  selectedDate?: string
) => {
  const rawHours =
    localStorage.getItem(getDashboardHoursKey(userId, period, selectedDate)) ??
    (period === 'date' && selectedDate
      ? localStorage.getItem(getLegacyDashboardDateHoursKey(userId, selectedDate))
      : null) ??
    (period === 'date' && selectedDate === getDateInputValue()
      ? localStorage.getItem(getDashboardHoursKey(userId, 'today'))
      : null) ??
    (period === 'today'
      ? localStorage.getItem(getDashboardHoursKey(userId, 'date', getDateInputValue()))
      : null)
  const savedHours = rawHours === null ? Number.NaN : Number(rawHours)

  return Number.isFinite(savedHours) && savedHours >= 0
    ? String(savedHours)
    : String(defaultHoursByPeriod[period])
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
  const { profile, user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(getDateInputValue())
  const [workedDays, setWorkedDays] = useState<string[]>([])
  const initialHoursInput = user?.id
    ? readDashboardHours(user.id, 'today')
    : String(defaultHoursByPeriod.today)
  const [period, setPeriod] = useState<DashboardPeriod>('today')
  const [hoursInput, setHoursInput] = useState(initialHoursInput)
  const [savedHoursInput, setSavedHoursInput] = useState(initialHoursInput)
  const [hoursSaveStatus, setHoursSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle')
  const hoursSuccessTimeoutRef = useRef<number | null>(null)
  const { stats, loading, error } = useDashboardStats(period, user?.id, selectedDate)
  const periodTitle = periodTitleLabels[period]
  const todayFormatted = getDateInputValue()
  const isTodaySelected =
    period === 'date' &&
    selectedDate === todayFormatted
  const selectedDateLabel = formatSelectedDate(selectedDate)
  const selectedWeekdayLabel = formatSelectedWeekday(selectedDate)
  const gradeLabel = gradeLabels[String(profile?.grade)] || 'Грейд не указан'

  useEffect(() => {
    return () => {
      if (hoursSuccessTimeoutRef.current) {
        window.clearTimeout(hoursSuccessTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchWorkedDays = async () => {
      if (period !== 'date' || !user?.id) {
        if (isMounted) {
          setWorkedDays([])
        }
        return
      }

      try {
        const days = await dashboardApi.getWorkedDaysForMonth(
          user.id,
          new Date(`${selectedDate}T00:00:00`)
        )

        if (isMounted) {
          setWorkedDays(days)
        }
      } catch (err) {
        console.error('DashboardPage fetchWorkedDays error:', err)

        if (isMounted) {
          setWorkedDays([])
        }
      }
    }

    void fetchWorkedDays()

    return () => {
      isMounted = false
    }
  }, [period, selectedDate, user?.id])

  const parsedHours = Number(hoursInput)
  const normalizedHours =
    hoursInput.trim() === '' || !Number.isFinite(parsedHours)
      ? 0
      : Math.max(parsedHours, 0)
  const hasHoursChanged = hoursInput !== savedHoursInput
  const isSavingHours = hoursSaveStatus === 'saving'

  const handlePeriodChange = (nextPeriod: DashboardPeriod) => {
    const nextHoursInput = user?.id
      ? readDashboardHours(user.id, nextPeriod, selectedDate)
      : String(defaultHoursByPeriod[nextPeriod])

    setPeriod(nextPeriod)
    setHoursInput(nextHoursInput)
    setSavedHoursInput(nextHoursInput)
    setHoursSaveStatus('idle')

    if (hoursSuccessTimeoutRef.current) {
      window.clearTimeout(hoursSuccessTimeoutRef.current)
      hoursSuccessTimeoutRef.current = null
    }
  }

  const handleSelectedDateChange = (nextDate: string) => {
    setSelectedDate(nextDate)

    if (period !== 'date') {
      return
    }

    const nextHoursInput = user?.id
      ? readDashboardHours(user.id, 'date', nextDate)
      : String(defaultHoursByPeriod.date)

    setHoursInput(nextHoursInput)
    setSavedHoursInput(nextHoursInput)
    setHoursSaveStatus('idle')

    if (hoursSuccessTimeoutRef.current) {
      window.clearTimeout(hoursSuccessTimeoutRef.current)
      hoursSuccessTimeoutRef.current = null
    }
  }

  const handleSaveHours = () => {
    if (!user?.id || !hasHoursChanged || isSavingHours) {
      return
    }

    const nextSavedHoursInput = hoursInput.trim() === '' ? '0' : hoursInput

    setHoursSaveStatus('saving')

    if (hoursSuccessTimeoutRef.current) {
      window.clearTimeout(hoursSuccessTimeoutRef.current)
    }

    hoursSuccessTimeoutRef.current = window.setTimeout(() => {
      localStorage.setItem(
        getDashboardHoursKey(user.id, period, selectedDate),
        nextSavedHoursInput
      )

      if (period === 'today') {
        localStorage.setItem(
          getDashboardHoursKey(user.id, 'date', todayFormatted),
          nextSavedHoursInput
        )
      }

      if (isTodaySelected) {
        localStorage.setItem(
          getDashboardHoursKey(user.id, 'today'),
          nextSavedHoursInput
        )
      }

      setHoursInput(nextSavedHoursInput)
      setSavedHoursInput(nextSavedHoursInput)
      setHoursSaveStatus('success')

      hoursSuccessTimeoutRef.current = window.setTimeout(() => {
        setHoursSaveStatus('idle')
        hoursSuccessTimeoutRef.current = null
      }, 3000)
    }, 250)
  }

  const salary = useMemo(() => {
    const { hourlyRate, commissionPercent } = getSalaryConfig(
      profile?.grade,
      period,
      stats.periodRevenue
    )
    const hourlyIncome = hourlyRate * normalizedHours
    const salesIncome = stats.periodRevenue * commissionPercent

    return {
      hourlyRate,
      commissionPercent,
      hourlyIncome,
      salesIncome,
      totalIncome: hourlyIncome + salesIncome + stats.periodTips,
    }
  }, [normalizedHours, period, profile?.grade, stats.periodRevenue, stats.periodTips])

  if (loading) {
    return <AppLoader />
  }

  return (
    <div className="container mx-auto max-w-3xl p-3 pb-28 md:p-6 md:pb-6">
      <div
        className="mb-3 rounded-3xl p-3 ring-1 ring-foreground/5"
        style={glassPanelStyle}
      >
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-muted/60 p-1">
          {Object.entries(periodLabels).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={period === value ? 'default' : 'ghost'}
              className="h-9 rounded-xl px-2 text-xs shadow-none"
              onClick={() => handlePeriodChange(value as DashboardPeriod)}
            >
              {label}
            </Button>
          ))}
        </div>

        {period === 'date' && (
          <>
            <DateCalendar
              selectedDate={selectedDate}
              workedDays={workedDays}
              showWorkedDays
              className="mt-3"
              onSelectDate={handleSelectedDateChange}
            />
            <div className="mt-2 rounded-2xl bg-background/70 px-3 py-2 text-xs">
              <div className="font-medium">{selectedDateLabel}</div>
              <div className="capitalize text-muted-foreground">
                {selectedWeekdayLabel}
              </div>
            </div>
          </>
        )}

        <div className="mt-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Отработано часов
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              step={0.5}
              value={hoursInput}
              onChange={(event) => {
                setHoursInput(event.target.value)

                if (hoursSaveStatus === 'success') {
                  setHoursSaveStatus('idle')

                  if (hoursSuccessTimeoutRef.current) {
                    window.clearTimeout(hoursSuccessTimeoutRef.current)
                    hoursSuccessTimeoutRef.current = null
                  }
                }
              }}
              className="h-10 w-24 rounded-2xl text-sm"
            />
            <div className="rounded-2xl bg-background/70 px-3 py-2 text-[11px] leading-tight text-muted-foreground">
              Рекомендуем: {defaultHoursByPeriod[period]} ч
            </div>
            <Button
              type="button"
              className="h-10 rounded-2xl px-4"
              disabled={!user?.id || !hasHoursChanged || isSavingHours}
              onClick={handleSaveHours}
            >
              {hoursSaveStatus === 'saving'
                ? 'Сохранение...'
                : hoursSaveStatus === 'success'
                  ? 'Сохранено'
                  : 'Сохранить часы'}
            </Button>
          </div>
          <div className="mt-2 min-h-5 text-[11px] leading-tight text-muted-foreground">
            {hoursSaveStatus === 'success' && (
              <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2 py-1 font-medium text-green-700">
                Часы сохранены
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          Ошибка: {error}
        </div>
      )}

      {period === 'date' && stats.periodClosedOrdersCount === 0 && !error && (
        <div className="mb-3 rounded-2xl border border-dashed border-border/80 bg-white/70 px-3 py-3 text-center text-xs text-muted-foreground">
          За выбранную дату данных нет
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
          caption={`${formatHours(normalizedHours)} ч = ${formatCurrency(salary.hourlyIncome)}`}
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
