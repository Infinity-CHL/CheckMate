import { useEffect, useState } from 'react'
import { getTables } from '@/features/tables/api/tablesApi'
import type { RestaurantTable } from '@/entities/table/model/table.model'

export const useTables = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTables = async () => {
    try {
      setLoading(true)
      const data = await getTables()
      setTables(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки столов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  return { tables, loading, error, refetch: fetchTables }
}
