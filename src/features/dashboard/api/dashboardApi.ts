import { ORDER_STATUS } from '@/entities/order/constants/order.constants'
import { supabase } from '@/shared/api/supabase'

type DashboardOrderRow = {
  total_amount: number | null
}

export type DashboardStats = {
  todayRevenue: number
  todayClosedOrdersCount: number
  todayAverageCheck: number
  weekRevenue: number
  monthRevenue: number
}

const sumRevenue = (orders: DashboardOrderRow[]) =>
  orders.reduce((total, order) => total + (order.total_amount ?? 0), 0)

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
    .select('total_amount')
    .eq('status', ORDER_STATUS.CLOSED)
    .gte('closed_at', from.toISOString())
    .lt('closed_at', to.toISOString())

  if (error) {
    console.error('dashboardApi.getClosedOrdersRevenue error:', error)
    throw error
  }

  return (data || []) as DashboardOrderRow[]
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const now = new Date()
    const [todayOrders, weekOrders, monthOrders] = await Promise.all([
      getClosedOrdersRevenue(getStartOfDay(now), getStartOfTomorrow(now)),
      getClosedOrdersRevenue(getStartOfWeek(now), getStartOfNextWeek(now)),
      getClosedOrdersRevenue(getStartOfMonth(now), getStartOfNextMonth(now)),
    ])

    const todayRevenue = sumRevenue(todayOrders)
    const todayClosedOrdersCount = todayOrders.length

    return {
      todayRevenue,
      todayClosedOrdersCount,
      todayAverageCheck:
        todayClosedOrdersCount > 0 ? todayRevenue / todayClosedOrdersCount : 0,
      weekRevenue: sumRevenue(weekOrders),
      monthRevenue: sumRevenue(monthOrders),
    }
  },
}
