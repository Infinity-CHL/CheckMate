import { useEffect, useState } from 'react'
import { dashboardApi, type DashboardStats } from '@/features/dashboard/api/dashboardApi'

const emptyStats: DashboardStats = {
  todayRevenue: 0,
  todayClosedOrdersCount: 0,
  todayAverageCheck: 0,
  weekRevenue: 0,
  monthRevenue: 0,
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const dashboardStats = await dashboardApi.getStats()
        setStats(dashboardStats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки аналитики')
        setStats(emptyStats)
      } finally {
        setLoading(false)
      }
    }

    void fetchStats()
  }, [])

  return { stats, loading, error }
}
