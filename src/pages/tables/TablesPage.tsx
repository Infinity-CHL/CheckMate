import { useMemo, useState } from 'react'

import { AppLoader } from '@/components/AppLoader'
import { Button } from '@/components/ui/button'
import { TABLE_STATUS } from '@/entities/table/constants/table.constants'
import { TableGrid } from '@/features/tables/components/TableGrid'
import { useTables } from '@/features/tables/hooks/useTables'

type TableFilter = 'all' | 'free' | 'occupied'

const tableFilters: Array<{ value: TableFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'free', label: 'Свободные' },
  { value: 'occupied', label: 'Занятые' },
]

export const TablesPage = () => {
  const { tables, loading, error } = useTables()
  const [activeFilter, setActiveFilter] = useState<TableFilter>('all')

  const counters = useMemo(
    () => ({
      all: tables.length,
      free: tables.filter((table) => table.status === TABLE_STATUS.FREE).length,
      occupied: tables.filter(
        (table) => table.status === TABLE_STATUS.OCCUPIED
      ).length,
    }),
    [tables]
  )

  const filteredTables = useMemo(() => {
    if (activeFilter === 'all') {
      return tables
    }

    return tables.filter((table) => table.status === activeFilter)
  }, [activeFilter, tables])

  if (loading) {
    return <AppLoader />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Ошибка: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl p-3 pb-24 md:p-6">
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-3xl border border-white/70 bg-white/70 p-1.5 shadow-sm backdrop-blur">
        {tableFilters.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            className="h-10 rounded-2xl px-2 text-xs sm:text-sm"
            variant={activeFilter === filter.value ? 'default' : 'ghost'}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label} · {counters[filter.value]}
          </Button>
        ))}
      </div>

      <TableGrid tables={filteredTables} />
    </div>
  )
}
