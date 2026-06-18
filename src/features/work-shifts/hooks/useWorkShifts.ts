import { useCallback, useEffect, useMemo, useState } from 'react'

import type { DashboardPeriod } from '@/features/dashboard/api/dashboardApi'
import {
  calculateWorkedHours,
  workShiftsApi,
  type WorkShift,
} from '@/features/work-shifts/api/workShiftsApi'

export const useWorkShifts = (
  userId: string | undefined,
  period: DashboardPeriod
) => {
  const [activeShift, setActiveShift] = useState<WorkShift | null>(null)
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShifts = useCallback(async () => {
    if (!userId) {
      setActiveShift(null)
      setShifts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [currentShift, periodShifts] = await Promise.all([
        workShiftsApi.getActiveShift(userId),
        workShiftsApi.getShiftsForPeriod(userId, period),
      ])

      setActiveShift(currentShift)
      setShifts(periodShifts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить смены')
      setActiveShift(null)
      setShifts([])
    } finally {
      setLoading(false)
    }
  }, [period, userId])

  useEffect(() => {
    void fetchShifts()
  }, [fetchShifts])

  const startShift = useCallback(async () => {
    if (!userId) {
      return
    }

    try {
      setActionLoading(true)
      setError(null)
      await workShiftsApi.startShift(userId)
      await fetchShifts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать смену')
    } finally {
      setActionLoading(false)
    }
  }, [fetchShifts, userId])

  const endShift = useCallback(async () => {
    if (!activeShift) {
      return
    }

    try {
      setActionLoading(true)
      setError(null)
      await workShiftsApi.endShift(activeShift.id)
      await fetchShifts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось закончить смену')
    } finally {
      setActionLoading(false)
    }
  }, [activeShift, fetchShifts])

  const workedHours = useMemo(
    () => calculateWorkedHours(shifts, period),
    [period, shifts]
  )

  return {
    activeShift,
    shifts,
    workedHours,
    loading,
    actionLoading,
    error,
    refetch: fetchShifts,
    startShift,
    endShift,
  }
}
