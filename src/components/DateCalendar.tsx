import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DateCalendarProps = {
  selectedDate: string
  onSelectDate: (date: string) => void
  workedDays?: string[]
  showWorkedDays?: boolean
  size?: 'default' | 'lg'
  className?: string
}

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getDateFromKey = (value: string) => new Date(`${value}T00:00:00`)

const getMonthStart = (value: string) => {
  const date = getDateFromKey(value)

  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const formatMonthTitle = (date: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(date)

const getShiftedMonth = (date: Date, monthShift: number) =>
  new Date(date.getFullYear(), date.getMonth() + monthShift, 1)

const getMonthDays = (monthDate: Date) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7

  return [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(year, month, index + 1)
    ),
  ]
}

export const DateCalendar = ({
  selectedDate,
  onSelectDate,
  workedDays = [],
  showWorkedDays = false,
  size = 'default',
  className,
}: DateCalendarProps) => {
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getMonthStart(selectedDate)
  )
  const today = getDateKey()
  const workedDaysSet = useMemo(() => new Set(workedDays), [workedDays])

  return (
    <div
      data-size={size}
      className={cn(
        'group/calendar rounded-3xl border border-white/70 bg-white/85 p-3 shadow-sm ring-1 ring-foreground/5 backdrop-blur lg:data-[size=lg]:p-5',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          onClick={() => setCalendarMonth((month) => getShiftedMonth(month, -1))}
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-sm font-semibold capitalize md:group-data-[size=lg]/calendar:text-base lg:group-data-[size=lg]/calendar:text-lg">
          {formatMonthTitle(calendarMonth)}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          onClick={() => setCalendarMonth((month) => getShiftedMonth(month, 1))}
          aria-label="Следующий месяц"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground lg:group-data-[size=lg]/calendar:text-xs">
        {weekDays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 lg:group-data-[size=lg]/calendar:gap-2">
        {getMonthDays(calendarMonth).map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-8 lg:group-data-[size=lg]/calendar:h-12" />
          }

          const dateKey = getDateKey(date)
          const isSelected = dateKey === selectedDate
          const isToday = dateKey === today
          const isWorkedDay = showWorkedDays && workedDaysSet.has(dateKey)
          const day = date.getDay()
          const isWeekend = day === 0 || day === 6

          return (
            <button
              key={dateKey}
              type="button"
              className={cn(
                'flex h-8 min-w-0 items-center justify-center rounded-xl border text-xs font-medium transition-colors lg:group-data-[size=lg]/calendar:h-12 lg:group-data-[size=lg]/calendar:rounded-2xl lg:group-data-[size=lg]/calendar:text-sm',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : isWorkedDay
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : isWeekend
                      ? 'border-amber-100 bg-amber-50 text-muted-foreground'
                      : 'border-transparent bg-background/70 text-foreground hover:bg-muted',
                isToday && !isSelected && 'ring-1 ring-primary/40'
              )}
              onClick={() => onSelectDate(dateKey)}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
