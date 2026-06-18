import { useEffect, useState } from 'react'
import {
  dashboardApi,
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

export const useDashboardStats = (period: DashboardPeriod = 'today') => {
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const dashboardStats = await dashboardApi.getStats(period)
        setStats(dashboardStats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки аналитики')
        setStats(emptyStats)
      } finally {
        setLoading(false)
      }
    }

    void fetchStats()
  }, [period])

  return { stats, loading, error }
}
