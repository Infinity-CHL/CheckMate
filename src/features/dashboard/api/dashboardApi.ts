import { ORDER_STATUS } from '@/entities/order/constants/order.constants'
import { supabase } from '@/shared/api/supabase'

type DashboardOrderRow = {
  total_amount: number | null
  tips_amount: number | null
}

export type DashboardPeriod = 'today' | 'week' | 'month'

export type DashboardStats = {
  periodRevenue: number
  periodTips: number
  periodClosedOrdersCount: number
  periodAverageCheck: number
  todayRevenue: number
  todayClosedOrdersCount: number
  todayAverageCheck: number
  weekRevenue: number
  monthRevenue: number
}

const sumRevenue = (orders: DashboardOrderRow[]) =>
  orders.reduce((total, order) => total + (order.total_amount ?? 0), 0)

const sumTips = (orders: DashboardOrderRow[]) =>
  orders.reduce((total, order) => total + (order.tips_amount ?? 0), 0)

const getStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const getStartOfTomorrow = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

const getStartOfWeek = (date: Date) => {
  const startOfDay = getStartOfDay(date)
  const day = startOfDay.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1

  startOfDay.setDate(startOfDay.getDate() - daysFromMonday)
  return startOfDay
}

const getStartOfNextWeek = (date: Date) => {
  const startOfWeek = getStartOfWeek(date)
  startOfWeek.setDate(startOfWeek.getDate() + 7)
  return startOfWeek
}

const getStartOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1)

const getStartOfNextMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 1)

const getClosedOrdersRevenue = async (from: Date, to: Date) => {
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount, tips_amount')
    .eq('status', ORDER_STATUS.CLOSED)
    .gte('closed_at', from.toISOString())
    .lt('closed_at', to.toISOString())

  if (error) {
    console.error('dashboardApi.getClosedOrdersRevenue error:', error)
    throw error
  }

  return (data || []) as DashboardOrderRow[]
}

const getPeriodRange = (period: DashboardPeriod, now: Date) => {
  if (period === 'week') {
    return {
      from: getStartOfWeek(now),
      to: getStartOfNextWeek(now),
    }
  }

  if (period === 'month') {
    return {
      from: getStartOfMonth(now),
      to: getStartOfNextMonth(now),
    }
  }

  return {
    from: getStartOfDay(now),
    to: getStartOfTomorrow(now),
  }
}

export const dashboardApi = {
  async getStats(period: DashboardPeriod = 'today'): Promise<DashboardStats> {
    const now = new Date()
    const periodRange = getPeriodRange(period, now)
    const [periodOrders, todayOrders, weekOrders, monthOrders] = await Promise.all([
      getClosedOrdersRevenue(periodRange.from, periodRange.to),
      getClosedOrdersRevenue(getStartOfDay(now), getStartOfTomorrow(now)),
      getClosedOrdersRevenue(getStartOfWeek(now), getStartOfNextWeek(now)),
      getClosedOrdersRevenue(getStartOfMonth(now), getStartOfNextMonth(now)),
    ])

    const todayRevenue = sumRevenue(todayOrders)
    const todayClosedOrdersCount = todayOrders.length
    const periodRevenue = sumRevenue(periodOrders)
    const periodClosedOrdersCount = periodOrders.length

    return {
      periodRevenue,
      periodTips: sumTips(periodOrders),
      periodClosedOrdersCount,
      periodAverageCheck:
        periodClosedOrdersCount > 0 ? periodRevenue / periodClosedOrdersCount : 0,
      todayRevenue,
      todayClosedOrdersCount,
      todayAverageCheck:
        todayClosedOrdersCount > 0 ? todayRevenue / todayClosedOrdersCount : 0,
      weekRevenue: sumRevenue(weekOrders),
      monthRevenue: sumRevenue(monthOrders),
    }
  },
}
