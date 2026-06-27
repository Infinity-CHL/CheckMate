import { TableCard } from './TableCard'
import type { RestaurantTable } from '@/entities/table/model/table.model'

interface TableGridProps {
  tables: RestaurantTable[]
}

export const TableGrid = ({ tables }: TableGridProps) => {
  if (tables.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/80 bg-white/70 px-4 py-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Столы не найдены</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {tables.map((table) => (
        <TableCard key={table.id} table={table} />
      ))}
    </div>
  )
}
