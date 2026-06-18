import type { DashboardPeriod } from '@/features/dashboard/api/dashboardApi'
import { supabase } from '@/shared/api/supabase'

export type WorkShift = {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  created_at?: string | null
}

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

export const getWorkShiftPeriodRange = (
  period: DashboardPeriod,
  now = new Date()
) => {
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

export const calculateWorkedHours = (
  shifts: WorkShift[],
  period: DashboardPeriod,
  now = new Date()
) => {
  const { from, to } = getWorkShiftPeriodRange(period, now)
  const periodStart = from.getTime()
  const periodEnd = Math.min(to.getTime(), now.getTime())

  const workedMs = shifts.reduce((total, shift) => {
    const shiftStart = new Date(shift.started_at).getTime()
    const shiftEnd = shift.ended_at
      ? new Date(shift.ended_at).getTime()
      : now.getTime()
    const overlapStart = Math.max(shiftStart, periodStart)
    const overlapEnd = Math.min(shiftEnd, periodEnd)

    return total + Math.max(overlapEnd - overlapStart, 0)
  }, 0)

  return workedMs / 1000 / 60 / 60
}

export const workShiftsApi = {
  async getActiveShift(userId: string): Promise<WorkShift | null> {
    const { data, error } = await supabase
      .from('work_shifts')
      .select('*')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('workShiftsApi.getActiveShift error:', error)
      throw error
    }

    return data as WorkShift | null
  },

  async startShift(userId: string): Promise<WorkShift> {
    const activeShift = await workShiftsApi.getActiveShift(userId)

    if (activeShift) {
      return activeShift
    }

    const { data, error } = await supabase
      .from('work_shifts')
      .insert({
        user_id: userId,
        started_at: new Date().toISOString(),
        ended_at: null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('workShiftsApi.startShift error:', error)
      throw error
    }

    return data as WorkShift
  },

  async endShift(shiftId: string): Promise<WorkShift> {
    const { data, error } = await supabase
      .from('work_shifts')
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .select('*')
      .single()

    if (error) {
      console.error('workShiftsApi.endShift error:', error)
      throw error
    }

    return data as WorkShift
  },

  async getShiftsForPeriod(
    userId: string,
    period: DashboardPeriod
  ): Promise<WorkShift[]> {
    const { from, to } = getWorkShiftPeriodRange(period)

    const { data, error } = await supabase
      .from('work_shifts')
      .select('*')
      .eq('user_id', userId)
      .lt('started_at', to.toISOString())
      .or(`ended_at.is.null,ended_at.gte.${from.toISOString()}`)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('workShiftsApi.getShiftsForPeriod error:', error)
      throw error
    }

    return (data || []) as WorkShift[]
  },
}
