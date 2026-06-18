import { ORDER_STATUS } from '@/entities/order/constants/order.constants'
import { supabase } from '@/shared/api/supabase'

type DashboardOrderRow = {
  waiter_id: string | null
  total_amount: number | null
  tips_amount: number | null
}

type DashboardWorkedDayRow = {
  closed_at: string | null
}

type DashboardEmployeeRow = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  grade: string | null
}

export type DashboardPeriod = 'today' | 'week' | 'month' | 'date'

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

export type DashboardEmployeeStats = {
  userId: string
  fullName: string | null
  email: string | null
  role: string | null
  grade: string | null
  revenue: number
  closedOrdersCount: number
  averageCheck: number
}

export type AdminDashboardStats = {
  totalRevenue: number
  closedOrdersCount: number
  averageCheck: number
  employees: DashboardEmployeeStats[]
}

export type AdminSummaryStats = {
  totalRevenue: number
  closedOrdersCount: number
  averageCheck: number
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

const getDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getClosedOrdersRevenue = async (
  from: Date,
  to: Date,
  userId?: string
) => {
  let query = supabase
    .from('orders')
    .select('waiter_id, total_amount, tips_amount')
    .eq('status', ORDER_STATUS.CLOSED)
    .gte('closed_at', from.toISOString())
    .lt('closed_at', to.toISOString())

  if (userId) {
    query = query.eq('waiter_id', userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('dashboardApi.getClosedOrdersRevenue error:', error)
    throw error
  }

  return (data || []) as DashboardOrderRow[]
}

const getAllEmployees = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, grade')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('dashboardApi.getAllEmployees error:', error)
    throw error
  }

  return (data || []) as DashboardEmployeeRow[]
}

const buildAdminStats = async (
  orders: DashboardOrderRow[]
): Promise<AdminDashboardStats> => {
  const totalRevenue = sumRevenue(orders)
  const closedOrdersCount = orders.length
  const employees = await getAllEmployees()
  const employeeTotals = new Map<
    string,
    { revenue: number; closedOrdersCount: number }
  >()

  orders.forEach((order) => {
    if (!order.waiter_id) {
      return
    }

    const currentStats = employeeTotals.get(order.waiter_id) ?? {
      revenue: 0,
      closedOrdersCount: 0,
    }

    currentStats.revenue += order.total_amount ?? 0
    currentStats.closedOrdersCount += 1
    employeeTotals.set(order.waiter_id, currentStats)
  })

  return {
    totalRevenue,
    closedOrdersCount,
    averageCheck: closedOrdersCount > 0 ? totalRevenue / closedOrdersCount : 0,
    employees: employees.map((employee) => {
      const stats = employeeTotals.get(employee.id) ?? {
        revenue: 0,
        closedOrdersCount: 0,
      }

      return {
        userId: employee.id,
        fullName: employee.full_name,
        email: employee.email,
        role: employee.role,
        grade: employee.grade,
        revenue: stats.revenue,
        closedOrdersCount: stats.closedOrdersCount,
        averageCheck:
          stats.closedOrdersCount > 0
            ? stats.revenue / stats.closedOrdersCount
            : 0,
      }
    }),
  }
}

const getPeriodRange = (
  period: DashboardPeriod,
  now: Date,
  selectedDate?: string
) => {
  if (period === 'date') {
    const date = selectedDate ? new Date(`${selectedDate}T00:00:00`) : now

    return {
      from: getStartOfDay(date),
      to: getStartOfTomorrow(date),
    }
  }

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

const buildSummaryStats = (orders: DashboardOrderRow[]): AdminSummaryStats => {
  const totalRevenue = sumRevenue(orders)
  const closedOrdersCount = orders.length

  return {
    totalRevenue,
    closedOrdersCount,
    averageCheck: closedOrdersCount > 0 ? totalRevenue / closedOrdersCount : 0,
  }
}

const getAdminMonthSummaryRange = (selectedDate?: string) => {
  const date = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()

  return {
    from: getStartOfMonth(date),
    to: getStartOfTomorrow(date),
  }
}

export const dashboardApi = {
  async getStats(
    period: DashboardPeriod = 'today',
    userId?: string,
    selectedDate?: string
  ): Promise<DashboardStats> {
    const now = new Date()
    const periodRange = getPeriodRange(period, now, selectedDate)
    const [periodOrders, todayOrders, weekOrders, monthOrders] = await Promise.all([
      getClosedOrdersRevenue(periodRange.from, periodRange.to, userId),
      getClosedOrdersRevenue(getStartOfDay(now), getStartOfTomorrow(now), userId),
      getClosedOrdersRevenue(getStartOfWeek(now), getStartOfNextWeek(now), userId),
      getClosedOrdersRevenue(getStartOfMonth(now), getStartOfNextMonth(now), userId),
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

  async getAdminAnalytics(
    selectedDate?: string
  ): Promise<AdminDashboardStats> {
    const now = new Date()
    const periodRange = getPeriodRange('date', now, selectedDate)
    const orders = await getClosedOrdersRevenue(periodRange.from, periodRange.to)

    return buildAdminStats(orders)
  },

  async getAdminMonthSummary(
    selectedDate?: string
  ): Promise<AdminSummaryStats> {
    const periodRange = getAdminMonthSummaryRange(selectedDate)
    const orders = await getClosedOrdersRevenue(periodRange.from, periodRange.to)

    return buildSummaryStats(orders)
  },

  async getWorkedDaysForMonth(
    userId: string,
    monthDate: Date
  ): Promise<string[]> {
    const from = getStartOfMonth(monthDate)
    const to = getStartOfNextMonth(monthDate)

    const { data, error } = await supabase
      .from('orders')
      .select('closed_at')
      .eq('waiter_id', userId)
      .eq('status', ORDER_STATUS.CLOSED)
      .gte('closed_at', from.toISOString())
      .lt('closed_at', to.toISOString())

    if (error) {
      console.error('dashboardApi.getWorkedDaysForMonth error:', error)
      throw error
    }

    return Array.from(
      new Set(
        ((data || []) as DashboardWorkedDayRow[])
          .map((order) =>
            order.closed_at ? getDateKey(new Date(order.closed_at)) : null
          )
          .filter((date): date is string => Boolean(date))
      )
    )
  },
}
