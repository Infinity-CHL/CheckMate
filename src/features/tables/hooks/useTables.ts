import { useCallback, useEffect, useState } from 'react'
import { TABLE_STATUS } from '@/entities/table/constants/table.constants'
import type { RestaurantTable } from '@/entities/table/model/table.model'
import {
  ensureDefaultTables,
  getOpenTableOrdersByWaiterId,
  getTables,
} from '@/features/tables/api/tablesApi'
import { useAuth } from '@/features/auth/useAuth'

export const useTables = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: isAuthLoading } = useAuth()

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true)

      if (!user) {
        setTables([])
        return
      }

      await ensureDefaultTables()

      const [data, openOrderByTableId] = await Promise.all([
        getTables(),
        getOpenTableOrdersByWaiterId(user.id),
      ])

      setTables(
        data.map((table) => ({
          ...table,
          activeOrderId: openOrderByTableId.get(table.id) ?? null,
          status: openOrderByTableId.has(table.id)
            ? TABLE_STATUS.OCCUPIED
            : TABLE_STATUS.FREE,
        }))
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки столов')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    void fetchTables()
  }, [fetchTables, isAuthLoading])

  return { tables, loading, error, refetch: fetchTables }
}
