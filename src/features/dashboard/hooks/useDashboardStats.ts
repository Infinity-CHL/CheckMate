import { useEffect, useState } from 'react'
import {
  dashboardApi,
  type AdminDashboardStats,
  type AdminSummaryStats,
  type DashboardPeriod,
  type DashboardStats,
} from '@/features/dashboard/api/dashboardApi'

const emptyStats: DashboardStats = {
  periodRevenue: 0,
  periodTips: 0,
  periodClosedOrdersCount: 0,
  periodAverageCheck: 0,
  todayRevenue: 0,
  todayClosedOrdersCount: 0,
  todayAverageCheck: 0,
  weekRevenue: 0,
  monthRevenue: 0,
}

const emptyAdminStats: AdminDashboardStats = {
  totalRevenue: 0,
  closedOrdersCount: 0,
  averageCheck: 0,
  employees: [],
}

const emptyAdminSummaryStats: AdminSummaryStats = {
  totalRevenue: 0,
  closedOrdersCount: 0,
  averageCheck: 0,
}

export const useDashboardStats = (
  period: DashboardPeriod = 'today',
  userId?: string,
  selectedDate?: string
) => {
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const dashboardStats = await dashboardApi.getStats(period, userId, selectedDate)
        setStats(dashboardStats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки аналитики')
        setStats(emptyStats)
      } finally {
        setLoading(false)
      }
    }

    void fetchStats()
  }, [period, selectedDate, userId])

  return { stats, loading, error }
}

export const useAdminDashboardStats = (selectedDate?: string) => {
  const [stats, setStats] = useState<AdminDashboardStats>(emptyAdminStats)
  const [monthSummary, setMonthSummary] = useState<AdminSummaryStats>(
    emptyAdminSummaryStats
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const [dashboardStats, dashboardMonthSummary] = await Promise.all([
          dashboardApi.getAdminAnalytics(selectedDate),
          dashboardApi.getAdminMonthSummary(selectedDate),
        ])
        setStats(dashboardStats)
        setMonthSummary(dashboardMonthSummary)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки аналитики')
        setStats(emptyAdminStats)
        setMonthSummary(emptyAdminSummaryStats)
      } finally {
        setLoading(false)
      }
    }

    void fetchStats()
  }, [selectedDate])

  return { stats, monthSummary, loading, error }
}
